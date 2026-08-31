import { useState } from 'react';
import { Box, Button, Checkbox, Chip, Drawer, FormControlLabel, IconButton, Typography } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { useWakeLock } from '../lib/wakeLock';
import { displayIngredient } from '../lib/scale';

// Fullscreen step-by-step cooking: one step per view, tap/swipe navigation,
// step check-off, an ingredients drawer, and a screen wake lock.
export default function CookMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang, dir } = useI18n();
  const { recipes } = useApp();
  const recipe = recipes.find((r) => r.id === id) ?? null;

  const [index, setIndex] = useState(0);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [ingOpen, setIngOpen] = useState(false);
  const { supported } = useWakeLock(true);

  if (!recipe) {
    navigate('/');
    return null;
  }

  const steps = recipe.steps.length ? recipe.steps : [{ text: '—', group: null }];
  const step = steps[index];
  const isLast = index === steps.length - 1;

  const next = () => (isLast ? navigate(`/recipes/${recipe.id}`) : setIndex((i) => i + 1));
  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const toggleChecked = (i: number) =>
    setChecked((prevSet) => {
      const nextSet = new Set(prevSet);
      if (nextSet.has(i)) nextSet.delete(i);
      else nextSet.add(i);
      return nextSet;
    });

  const PrevIcon = dir === 'rtl' ? ChevronRightRoundedIcon : ChevronLeftRoundedIcon;
  const NextIcon = dir === 'rtl' ? ChevronLeftRoundedIcon : ChevronRightRoundedIcon;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        bgcolor: '#221D18',
        color: '#F7F1E8',
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 520,
        mx: 'auto',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, gap: 1 }}>
        <IconButton onClick={() => navigate(`/recipes/${recipe.id}`)} sx={{ color: 'inherit' }} aria-label={t('close')}>
          <CloseRoundedIcon />
        </IconButton>
        <Typography sx={{ flex: 1, fontWeight: 600 }} noWrap dir="auto">
          {recipe.title}
        </Typography>
        <Chip
          size="small"
          label={supported ? t('cook_wake_on') : t('cook_wake_unsupported')}
          sx={{ bgcolor: 'rgba(255,255,255,.12)', color: 'inherit', maxWidth: 180 }}
        />
      </Box>

      <Box
        onClick={next}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', px: 3, cursor: 'pointer' }}
      >
        <Typography variant="overline" sx={{ opacity: 0.7 }}>
          {t('cook_step_of', { i: index + 1, n: steps.length })}
          {step.group ? ` · ${step.group}` : ''}
        </Typography>
        <FormControlLabel
          onClick={(e) => e.stopPropagation()}
          control={
            <Checkbox
              checked={checked.has(index)}
              onChange={() => toggleChecked(index)}
              sx={{ color: '#E9A13B', '&.Mui-checked': { color: '#E9A13B' } }}
            />
          }
          label={
            <Typography
              variant="h5"
              dir="auto"
              sx={{ lineHeight: 1.5, textDecoration: checked.has(index) ? 'line-through' : 'none', opacity: checked.has(index) ? 0.6 : 1 }}
            >
              {step.text}
            </Typography>
          }
          sx={{ alignItems: 'flex-start', m: 0, gap: 1 }}
        />
        {isLast ? (
          <Typography sx={{ mt: 3, fontSize: 22 }}>{t('cook_done')}</Typography>
        ) : null}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.75, pb: 1 }}>
        {steps.map((_s, i) => (
          <Box
            key={i}
            onClick={() => setIndex(i)}
            sx={{
              width: i === index ? 22 : 8,
              height: 8,
              borderRadius: 4,
              bgcolor: checked.has(i) ? '#E9A13B' : i === index ? '#F7F1E8' : 'rgba(255,255,255,.3)',
              transition: 'width .2s',
              cursor: 'pointer',
            }}
          />
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 1, p: 2, pb: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
        <IconButton onClick={prev} disabled={index === 0} sx={{ color: 'inherit', bgcolor: 'rgba(255,255,255,.08)' }} aria-label="prev">
          <PrevIcon />
        </IconButton>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<RestaurantMenuRoundedIcon />}
          onClick={() => setIngOpen(true)}
          sx={{ color: 'inherit', borderColor: 'rgba(255,255,255,.35)' }}
        >
          {t('cook_ingredients')}
        </Button>
        <Button
          variant="contained"
          onClick={next}
          endIcon={isLast ? undefined : <NextIcon />}
          sx={{ minWidth: 110, bgcolor: '#E9A13B', color: '#221D18', '&:hover': { bgcolor: '#D8922F' } }}
        >
          {isLast ? t('cook_finish') : t('done')}
        </Button>
      </Box>

      <Drawer anchor="bottom" open={ingOpen} onClose={() => setIngOpen(false)} PaperProps={{ sx: { maxWidth: 520, mx: 'auto', borderRadius: '22px 22px 0 0', maxHeight: '70vh' } }}>
        <Box sx={{ p: 2.5, pb: 4 }}>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            {t('cook_ingredients')}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {recipe.ingredients.map((ing, i) => (
              <FormControlLabel
                key={i}
                control={<Checkbox size="small" />}
                label={
                  <Typography dir="auto" sx={{ fontSize: 15 }}>
                    {displayIngredient(ing, 1, lang)}
                  </Typography>
                }
              />
            ))}
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}
