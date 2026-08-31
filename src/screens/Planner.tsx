import { useMemo, useState } from 'react';
import { Box, Button, Chip, IconButton, Snackbar, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import RecipePickerSheet from '../sheets/RecipePickerSheet';
import { useApp } from '../context/AppContext';
import { useI18n, type Dict } from '../i18n';
import * as db from '../lib/db';
import { addDays, dateKey, isSameDay, monthMatrix, startOfWeek } from '../lib/format';
import { recipeToGroceryItems } from '../lib/grocery';
import type { MealPlanEntry, PlanSlot } from '../lib/types';
import { PLAN_SLOTS } from '../lib/types';
import { emojiFor } from '../components/RecipePhoto';

// Sunday-first weekly planner (Israeli convention) + month overview. Slots per
// day for breakfast/lunch/dinner/snack, and one-tap "add day/week to grocery"
// — the thing ReciMe famously doesn't do.
export default function Planner() {
  const { t, dir } = useI18n();
  const navigate = useNavigate();
  const { plans, recipes, refreshPlans, refreshGrocery } = useApp();
  const [view, setView] = useState<'week' | 'month'>('week');
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [picker, setPicker] = useState<{ date: string; slot: PlanSlot } | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  const today = new Date();
  const days = useMemo(() => Array.from({ length: 7 }, (_v, i) => addDays(weekStart, i)), [weekStart]);
  const monthAnchor = days[3];

  const plansByDay = useMemo(() => {
    const map = new Map<string, MealPlanEntry[]>();
    for (const p of plans) {
      const list = map.get(p.plan_date) ?? [];
      list.push(p);
      map.set(p.plan_date, list);
    }
    return map;
  }, [plans]);

  const recipeById = (rid: string) => recipes.find((r) => r.id === rid);

  const addToGrocery = async (entries: MealPlanEntry[]) => {
    const items = entries.flatMap((e) => {
      const r = recipeById(e.recipe_id);
      return r ? recipeToGroceryItems(r, e.servings ?? r.servings) : [];
    });
    if (!items.length) return;
    await db.addGroceryItems(items);
    await refreshGrocery();
    setSnack(t('added_to_grocery'));
  };

  const weekEntries = days.flatMap((d) => plansByDay.get(dateKey(d)) ?? []);

  const PrevIcon = dir === 'rtl' ? ChevronRightRoundedIcon : ChevronLeftRoundedIcon;
  const NextIcon = dir === 'rtl' ? ChevronLeftRoundedIcon : ChevronRightRoundedIcon;

  return (
    <Box sx={{ pb: 2 }}>
      <AppHeader
        title={t('planner_title')}
        actions={
          <ToggleButtonGroup exclusive size="small" value={view} onChange={(_e, v) => v && setView(v)}>
            <ToggleButton value="week">{t('week_view')}</ToggleButton>
            <ToggleButton value="month">{t('month_view')}</ToggleButton>
          </ToggleButtonGroup>
        }
      />

      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, gap: 1, mb: 1 }}>
        <IconButton onClick={() => setWeekStart((w) => addDays(w, view === 'week' ? -7 : -28))} aria-label="prev">
          <PrevIcon />
        </IconButton>
        <Button size="small" onClick={() => setWeekStart(startOfWeek(new Date()))}>
          {t('this_week')}
        </Button>
        <Typography sx={{ flex: 1, textAlign: 'center', fontWeight: 600 }}>
          {view === 'week'
            ? `${days[0].getDate()}.${days[0].getMonth() + 1} – ${days[6].getDate()}.${days[6].getMonth() + 1}`
            : `${monthAnchor.getMonth() + 1}/${monthAnchor.getFullYear()}`}
        </Typography>
        <IconButton onClick={() => setWeekStart((w) => addDays(w, view === 'week' ? 7 : 28))} aria-label="next">
          <NextIcon />
        </IconButton>
      </Box>

      {view === 'week' ? (
        <>
          <Box sx={{ px: 2, mb: 1.5 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ShoppingCartRoundedIcon />}
              disabled={!weekEntries.length}
              onClick={() => addToGrocery(weekEntries)}
            >
              {t('add_week_to_grocery')}
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, px: 2 }}>
            {days.map((day) => {
              const key = dateKey(day);
              const dayPlans = plansByDay.get(key) ?? [];
              const isToday = isSameDay(day, today);
              return (
                <Box key={key} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '18px', p: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, gap: 1 }}>
                    <Typography sx={{ fontWeight: 700, color: isToday ? 'primary.main' : 'text.primary' }}>
                      {t(`day_${day.getDay()}` as keyof Dict)} · {day.getDate()}.{day.getMonth() + 1}
                    </Typography>
                    {dayPlans.length ? (
                      <Button size="small" sx={{ ms: 'auto', minHeight: 0, ml: 'auto' }} onClick={() => addToGrocery(dayPlans)}>
                        {t('add_day_to_grocery')}
                      </Button>
                    ) : null}
                  </Box>
                  {PLAN_SLOTS.map((slot) => {
                    const slotPlans = dayPlans.filter((p) => p.slot === slot);
                    return (
                      <Box key={slot} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.4 }}>
                        <Typography variant="caption" sx={{ width: 56, color: 'text.secondary', flexShrink: 0 }}>
                          {t(`slot_${slot}` as keyof Dict)}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', flex: 1 }}>
                          {slotPlans.map((p) => {
                            const r = recipeById(p.recipe_id);
                            if (!r) return null;
                            return (
                              <Chip
                                key={p.id}
                                size="small"
                                label={`${emojiFor(r)} ${r.title}`}
                                onClick={() => navigate(`/recipes/${r.id}`)}
                                onDelete={async () => {
                                  await db.deletePlan(p.id);
                                  await refreshPlans();
                                }}
                                sx={{ maxWidth: 240 }}
                              />
                            );
                          })}
                          <IconButton size="small" onClick={() => setPicker({ date: key, slot })} aria-label={t('add')} sx={{ p: 0.25 }}>
                            <AddRoundedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                          </IconButton>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              );
            })}
          </Box>
        </>
      ) : (
        <Box sx={{ px: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
            {Array.from({ length: 7 }, (_v, i) => (
              <Typography key={i} variant="caption" sx={{ textAlign: 'center', color: 'text.secondary' }}>
                {t(`day_short_${i}` as keyof Dict)}
              </Typography>
            ))}
          </Box>
          {monthMatrix(monthAnchor.getFullYear(), monthAnchor.getMonth()).map((week, wi) => (
            <Box key={wi} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
              {week.map((day) => {
                const key = dateKey(day);
                const count = (plansByDay.get(key) ?? []).length;
                const inMonth = day.getMonth() === monthAnchor.getMonth();
                const isToday = isSameDay(day, today);
                return (
                  <Box
                    key={key}
                    onClick={() => {
                      setWeekStart(startOfWeek(day));
                      setView('week');
                    }}
                    sx={{
                      aspectRatio: '1',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      bgcolor: isToday ? 'primary.main' : 'background.paper',
                      color: isToday ? 'primary.contrastText' : inMonth ? 'text.primary' : 'text.disabled',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {day.getDate()}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.25, height: 6 }}>
                      {Array.from({ length: Math.min(count, 3) }, (_v, i) => (
                        <Box key={i} sx={{ width: 5, height: 5, borderRadius: 3, bgcolor: isToday ? 'primary.contrastText' : 'secondary.main' }} />
                      ))}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      )}

      <RecipePickerSheet
        open={!!picker}
        onClose={() => setPicker(null)}
        onPick={async (r) => {
          if (!picker) return;
          await db.addPlan({ plan_date: picker.date, slot: picker.slot, recipe_id: r.id, servings: r.servings });
          await refreshPlans();
        }}
      />
      <Snackbar open={!!snack} autoHideDuration={2200} onClose={() => setSnack(null)} message={snack} />
    </Box>
  );
}
