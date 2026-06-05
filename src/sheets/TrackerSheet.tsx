import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useI18n } from '../i18n';
import { useApp } from '../context/AppContext';
import { useNow } from '../hooks/useNow';
import SheetShell from '../components/SheetShell';
import PhotoField from '../components/PhotoField';
import { Row, TimeRow, NotesField } from '../components/fields';
import { typeColor } from '../data/activities';
import { builtinRoutines } from '../data/routines';
import { firstFoods } from '../data/firstFoods';
import { createEntry, updateEntry, deleteEntry, uploadPhoto } from '../lib/db';
import { fmtDuration, splitDuration } from '../lib/format';
import type { Entry, EntryType } from '../lib/types';
import { labelKeyForType } from '../data/activities';

type Props = {
  open: boolean;
  type: EntryType;
  entry: Entry | null;
  onClose: () => void;
  onSaved: () => void;
};

const isTimer = (t: EntryType) => t === 'sleep' || t === 'breastfeed' || t === 'pump';

export default function TrackerSheet({ open, type, entry, onClose, onSaved }: Props) {
  const { t, lang } = useI18n();
  const { activeBaby, units } = useApp();
  const now = useNow(1000);

  // shared fields
  const [start, setStart] = useState<Date>(new Date());
  const [end, setEnd] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // type-specific
  const [data, setData] = useState<Record<string, any>>({});
  // breastfeed/pump per-side stopwatch (seconds accumulated + running side)
  const [leftSec, setLeftSec] = useState(0);
  const [rightSec, setRightSec] = useState(0);
  const [running, setRunning] = useState<null | 'left' | 'right' | 'sleep'>(null);
  const runStartRef = useRef<number>(0);

  const set = (k: string, v: any) => setData((d) => ({ ...d, [k]: v }));

  // initialize from entry / fresh
  useEffect(() => {
    if (!open) return;
    if (entry) {
      setStart(new Date(entry.start_time));
      setEnd(entry.end_time ? new Date(entry.end_time) : null);
      const d = { ...(entry.data || {}) } as Record<string, any>;
      setNotes((d.notes as string) || '');
      setLeftSec((d.leftSec as number) || 0);
      setRightSec((d.rightSec as number) || 0);
      setData(d);
      // resume a running sleep timer
      if (entry.type === 'sleep' && !entry.end_time) {
        setRunning('sleep');
        runStartRef.current = new Date(entry.start_time).getTime();
      } else {
        setRunning(null);
      }
    } else {
      setStart(new Date());
      setEnd(null);
      setNotes('');
      setLeftSec(0);
      setRightSec(0);
      setRunning(null);
      setData(defaultData(type, units));
    }
    setPhotoData(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entry, type]);

  // live tick for running stopwatch (breastfeed/pump)
  const liveLeft = leftSec + (running === 'left' ? (now.getTime() - runStartRef.current) / 1000 : 0);
  const liveRight = rightSec + (running === 'right' ? (now.getTime() - runStartRef.current) / 1000 : 0);
  const sleepElapsed = running === 'sleep' ? (now.getTime() - runStartRef.current) / 1000 : 0;

  function toggleSide(side: 'left' | 'right') {
    if (running === side) {
      // stop this side, bank the seconds
      const add = (now.getTime() - runStartRef.current) / 1000;
      if (side === 'left') setLeftSec((s) => s + add);
      else setRightSec((s) => s + add);
      setRunning(null);
    } else {
      // bank the other side if it was running
      if (running === 'left') setLeftSec((s) => s + (now.getTime() - runStartRef.current) / 1000);
      if (running === 'right') setRightSec((s) => s + (now.getTime() - runStartRef.current) / 1000);
      runStartRef.current = now.getTime();
      setRunning(side);
    }
  }

  // --- Sleep timer: persists immediately so it shows on the card ---
  async function startSleep() {
    if (!activeBaby) return;
    setBusy(true);
    const e = await createEntry({
      baby_id: activeBaby.id,
      type: 'sleep',
      start_time: new Date().toISOString(),
      end_time: null,
      data: {},
    });
    setBusy(false);
    if (e) {
      onSaved();
      onClose();
    }
  }

  async function stopSleep() {
    if (!entry) {
      // started and stopped within an unsaved manual flow
      setEnd(new Date());
      setRunning(null);
      return;
    }
    setBusy(true);
    await updateEntry(entry.id, { end_time: new Date().toISOString() });
    setBusy(false);
    onSaved();
    onClose();
  }

  async function save() {
    if (!activeBaby) return;
    setBusy(true);
    let photo_path = (data.photo_path as string) || null;
    if (photoData) {
      photo_path = await uploadPhoto(activeBaby.id, photoData);
    }

    const payload: Record<string, any> = { ...data, notes };
    if (photo_path) payload.photo_path = photo_path;
    let endTime = end;

    if (type === 'breastfeed') {
      const l = Math.round(liveLeft);
      const r = Math.round(liveRight);
      payload.leftSec = l;
      payload.rightSec = r;
      payload.lastSide = running ?? data.lastSide;
      endTime = new Date(start.getTime() + (l + r) * 1000);
    }
    if (type === 'pump') {
      payload.leftSec = Math.round(liveLeft);
      payload.rightSec = Math.round(liveRight);
    }

    if (entry) {
      await updateEntry(entry.id, {
        start_time: start.toISOString(),
        end_time: endTime ? endTime.toISOString() : null,
        data: payload,
      });
    } else {
      await createEntry({
        baby_id: activeBaby.id,
        type,
        start_time: start.toISOString(),
        end_time: endTime ? endTime.toISOString() : null,
        data: payload,
      });
    }
    setBusy(false);
    onSaved();
    onClose();
  }

  async function remove() {
    if (!entry) return;
    setBusy(true);
    await deleteEntry(entry.id);
    setBusy(false);
    onSaved();
    onClose();
  }

  const color = typeColor[type];
  const title = t(labelKeyForType[type]);

  return (
    <SheetShell
      open={open}
      onClose={onClose}
      title={title}
      color={color}
      onSave={type === 'sleep' && running === 'sleep' ? undefined : save}
      saveDisabled={busy}
    >
      {/* ---- Timer area for sleep ---- */}
      {type === 'sleep' && (
        <Stack alignItems="center" spacing={2} sx={{ py: 3 }}>
          <Typography color="text.secondary">{t('totalTime')}</Typography>
          <BigTime seconds={running === 'sleep' ? sleepElapsed : end ? (end.getTime() - start.getTime()) / 1000 : 0} />
          {running === 'sleep' ? (
            <Button
              variant="contained"
              onClick={stopSleep}
              sx={{ bgcolor: '#E8632A', '&:hover': { bgcolor: '#cf5320' }, px: 5, py: 1.2 }}
            >
              {t('stopTimer')}
            </Button>
          ) : (
            !entry && (
              <Button variant="outlined" onClick={startSleep} sx={{ px: 5, py: 1.2, borderColor: 'divider', color: 'text.primary' }}>
                {t('startTimer')}
              </Button>
            )
          )}
        </Stack>
      )}

      {/* ---- Breastfeed timers ---- */}
      {type === 'breastfeed' && (
        <Stack direction="row" spacing={2} sx={{ py: 2 }}>
          <SideTimer
            label={t('left')}
            seconds={liveLeft}
            active={running === 'left'}
            onToggle={() => toggleSide('left')}
            startLabel={t('startLeft')}
            stopLabel={t('stopLeft')}
          />
          <SideTimer
            label={t('right')}
            seconds={liveRight}
            active={running === 'right'}
            onToggle={() => toggleSide('right')}
            startLabel={t('startRight')}
            stopLabel={t('stopRight')}
          />
        </Stack>
      )}

      {/* ---- Common time rows ---- */}
      {type !== 'sleep' && <TimeRow label={t('startTime')} value={start} onChange={setStart} />}
      {type === 'sleep' && !running && (
        <>
          <TimeRow label={t('startTime')} value={start} onChange={setStart} />
          <TimeRow label={t('endTime')} value={end ?? start} onChange={setEnd} />
        </>
      )}

      {/* ---- Type-specific bodies ---- */}
      {type === 'bottle' && (
        <>
          <Row label={t('amount')}>
            <AmountInput value={data.amount} unit={units.volume} onChange={(v) => set('amount', v)} />
          </Row>
          <Row label={t('contents')}>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={data.contents || 'formula'}
              onChange={(_e, v) => v && set('contents', v)}
            >
              <ToggleButton value="formula">{t('formula')}</ToggleButton>
              <ToggleButton value="breastmilk">{t('breastmilk')}</ToggleButton>
            </ToggleButtonGroup>
          </Row>
        </>
      )}

      {type === 'pump' && (
        <Stack spacing={1} sx={{ pt: 1 }}>
          <Stack direction="row" spacing={2}>
            <SideTimer label={t('left')} seconds={liveLeft} active={running === 'left'} onToggle={() => toggleSide('left')} startLabel={t('startLeft')} stopLabel={t('stopLeft')} />
            <SideTimer label={t('right')} seconds={liveRight} active={running === 'right'} onToggle={() => toggleSide('right')} startLabel={t('startRight')} stopLabel={t('stopRight')} />
          </Stack>
          <Row label={t('leftAmount')}>
            <AmountInput value={data.leftAmount} unit={units.volume} onChange={(v) => set('leftAmount', v)} />
          </Row>
          <Row label={t('rightAmount')}>
            <AmountInput value={data.rightAmount} unit={units.volume} onChange={(v) => set('rightAmount', v)} />
          </Row>
        </Stack>
      )}

      {type === 'solids' && <FoodPicker value={data.foods || []} onChange={(v) => set('foods', v)} />}

      {type === 'diaper' && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-around', py: 3 }}>
            {(['wet', 'dirty', 'dry'] as const).map((k) => (
              <Box
                key={k}
                onClick={() => set('kind', k)}
                sx={{
                  width: 92,
                  height: 92,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  border: '2px solid',
                  borderColor: data.kind === k ? 'primary.main' : 'divider',
                  bgcolor: data.kind === k ? 'primary.main' : 'transparent',
                  color: data.kind === k ? 'primary.contrastText' : 'primary.main',
                  cursor: 'pointer',
                  fontSize: 18,
                }}
              >
                {t(k)}
              </Box>
            ))}
          </Box>
          <Row label={t('diaperRash')}>
            <Switch checked={!!data.rash} onChange={(e) => set('rash', e.target.checked)} />
          </Row>
        </>
      )}

      {type === 'routine' && <RoutinePicker value={data.routineType || ''} onChange={(v) => set('routineType', v)} />}

      {(type === 'weight' || type === 'height' || type === 'head') && (
        <Row label={t('value')}>
          <AmountInput
            value={data.value}
            unit={type === 'weight' ? units.weight : units.length}
            onChange={(v) => set('value', v)}
            step={type === 'weight' ? 0.01 : 0.1}
          />
        </Row>
      )}

      {(type === 'milestone' || type === 'medical') && (
        <TextField label={t('title')} value={data.title || ''} onChange={(e) => set('title', e.target.value)} fullWidth sx={{ mt: 2 }} />
      )}
      {type === 'vaccine' && (
        <TextField label={t('name')} value={data.name || ''} onChange={(e) => set('name', e.target.value)} fullWidth sx={{ mt: 2 }} />
      )}

      {/* ---- Notes + photo (not while a sleep timer is mid-run) ---- */}
      {!(type === 'sleep' && running === 'sleep') && (
        <>
          <NotesField value={notes} onChange={setNotes} placeholder={t('notes')} />
          <Box sx={{ mt: 2 }}>
            <PhotoField
              dataUrl={photoData}
              existingPath={data.photo_path}
              onPick={setPhotoData}
              onClear={() => {
                setPhotoData(null);
                set('photo_path', null);
              }}
            />
          </Box>
        </>
      )}

      {entry && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button color="secondary" onClick={remove} sx={{ color: '#E8632A' }}>
            {t('delete')}
          </Button>
        </Box>
      )}
      <Box sx={{ height: 24 }} />
      <DurationHint type={type} leftSec={liveLeft} rightSec={liveRight} lang={lang} />
    </SheetShell>
  );
}

function defaultData(type: EntryType, units: { volume: string }): Record<string, any> {
  if (type === 'diaper') return { kind: 'wet', rash: false };
  if (type === 'bottle') return { contents: 'formula', unit: units.volume };
  if (type === 'solids') return { foods: [] };
  return {};
}

function BigTime({ seconds }: { seconds: number }) {
  const { h, m, s } = splitDuration(seconds);
  return (
    <Typography variant="h2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
      {h}
      <small style={{ fontSize: '0.5em' }}>H</small> {m}
      <small style={{ fontSize: '0.5em' }}>M</small> {s}
      <small style={{ fontSize: '0.5em' }}>S</small>
    </Typography>
  );
}

function SideTimer({
  label,
  seconds,
  active,
  onToggle,
  startLabel,
  stopLabel,
}: {
  label: string;
  seconds: number;
  active: boolean;
  onToggle: () => void;
  startLabel: string;
  stopLabel: string;
}) {
  const { m, s } = splitDuration(seconds);
  return (
    <Stack alignItems="center" spacing={1.5} sx={{ flex: 1 }}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography variant="h4" sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {m}:{String(s).padStart(2, '0')}
      </Typography>
      <Button
        variant={active ? 'contained' : 'outlined'}
        onClick={onToggle}
        sx={
          active
            ? { bgcolor: '#E8632A', '&:hover': { bgcolor: '#cf5320' } }
            : { borderColor: 'divider', color: 'text.primary' }
        }
      >
        {active ? stopLabel : startLabel}
      </Button>
    </Stack>
  );
}

function AmountInput({
  value,
  unit,
  onChange,
  step = 5,
}: {
  value: any;
  unit: string;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <TextField
      type="number"
      size="small"
      variant="standard"
      value={value ?? ''}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      InputProps={{ disableUnderline: true, endAdornment: <span style={{ opacity: 0.6, marginInlineStart: 4 }}>{unit}</span>, inputProps: { step } }}
      sx={{ width: 110, '& input': { textAlign: 'end', fontSize: 16 } }}
    />
  );
}

function FoodPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const { lang } = useI18n();
  const toggle = (food: string) =>
    onChange(value.includes(food) ? value.filter((x) => x !== food) : [...value, food]);
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, py: 2 }}>
      {firstFoods.map((f) => {
        const label = lang === 'he' ? f.he : f.en;
        const on = value.includes(label);
        return (
          <ToggleButton key={f.en} value={label} selected={on} onClick={() => toggle(label)} size="small">
            {label}
          </ToggleButton>
        );
      })}
    </Box>
  );
}

function RoutinePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n();
  const [custom, setCustom] = useState('');
  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {builtinRoutines.map((r) => (
          <ToggleButton key={r.id} value={r.id} selected={value === t(r.labelKey)} onClick={() => onChange(t(r.labelKey))} size="small">
            {t(r.labelKey)}
          </ToggleButton>
        ))}
      </Box>
      <Stack direction="row" spacing={1}>
        <TextField size="small" placeholder={t('addRoutine')} value={custom} onChange={(e) => setCustom(e.target.value)} fullWidth />
        <Button onClick={() => { if (custom.trim()) { onChange(custom.trim()); setCustom(''); } }}>{t('add')}</Button>
      </Stack>
      {value && (
        <Typography sx={{ mt: 2 }} color="text.secondary">
          {t('routineType')}: {value}
        </Typography>
      )}
    </Box>
  );
}

function DurationHint({ type, leftSec, rightSec, lang }: { type: EntryType; leftSec: number; rightSec: number; lang: 'he' | 'en' }) {
  if (!isTimer(type) || type === 'sleep') return null;
  const total = Math.round(leftSec + rightSec);
  if (total <= 0) return null;
  return (
    <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
      {fmtDuration(total, lang)}
    </Typography>
  );
}
