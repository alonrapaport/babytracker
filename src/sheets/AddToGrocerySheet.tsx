import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, Typography } from '@mui/material';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import SheetShell from '../components/SheetShell';
import ServingsStepper from '../components/ServingsStepper';
import type { Recipe } from '../lib/types';
import { recipeToGroceryItems } from '../lib/grocery';
import { formatQty } from '../lib/scale';
import { unitLabel } from '../data/units';
import * as db from '../lib/db';
import { useApp } from '../context/AppContext';
import { useI18n, type Dict } from '../i18n';

export default function AddToGrocerySheet({
  open,
  onClose,
  recipe,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  recipe: Recipe;
  onAdded: () => void;
}) {
  const { t, lang } = useI18n();
  const { refreshGrocery } = useApp();
  const [servings, setServings] = useState(recipe.servings ?? 2);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setServings(recipe.servings ?? 2);
  }, [open, recipe]);

  const items = useMemo(() => recipeToGroceryItems(recipe, servings), [recipe, servings]);

  const add = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await db.addGroceryItems(items);
      await refreshGrocery();
      onAdded();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <SheetShell open={open} onClose={onClose} title={t('add_to_grocery')}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Typography>{t('grocery_add_servings')}</Typography>
        <ServingsStepper value={servings} onChange={setServings} />
        <Typography color="text.secondary">{t('servings_label')}</Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
        {items.map((item, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip size="small" label={t(`aisle_${item.aisle}` as keyof Dict)} sx={{ minWidth: 84 }} />
            <Typography dir="auto" sx={{ fontSize: 15 }}>
              {item.qty != null ? `${formatQty(item.qty)} ${unitLabel(item.unit, item.qty, lang)} ` : ''}
              {item.name}
            </Typography>
          </Box>
        ))}
      </Box>
      <Button fullWidth variant="contained" size="large" startIcon={<ShoppingCartRoundedIcon />} onClick={add} disabled={busy}>
        {t('grocery_add_action', { n: items.length })}
      </Button>
    </SheetShell>
  );
}
