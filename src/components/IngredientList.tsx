import { Fragment } from 'react';
import { Box, Typography } from '@mui/material';
import type { ParsedIngredient, UnitSystem } from '../lib/types';
import { displayIngredient } from '../lib/scale';
import { useI18n } from '../i18n';

export default function IngredientList({
  ingredients,
  factor = 1,
  unitSystem = 'original',
}: {
  ingredients: ParsedIngredient[];
  factor?: number;
  unitSystem?: UnitSystem;
}) {
  const { lang } = useI18n();
  let lastGroup: string | null | undefined;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      {ingredients.map((ing, i) => {
        const showGroup = ing.group !== lastGroup && ing.group;
        lastGroup = ing.group;
        return (
          <Fragment key={i}>
            {showGroup ? (
              <Typography variant="overline" sx={{ mt: i ? 1 : 0, color: 'primary.main', fontWeight: 700 }}>
                {ing.group}
              </Typography>
            ) : null}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
              <Box sx={{ width: 6, height: 6, borderRadius: 3, bgcolor: 'secondary.main', flexShrink: 0, alignSelf: 'center' }} />
              <Typography dir="auto" sx={{ fontSize: 15 }}>
                {displayIngredient(ing, factor, lang, unitSystem)}
              </Typography>
            </Box>
          </Fragment>
        );
      })}
    </Box>
  );
}
