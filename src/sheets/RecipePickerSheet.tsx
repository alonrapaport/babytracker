import { useMemo, useState } from 'react';
import { Box, InputAdornment, List, ListItemButton, ListItemText, TextField } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SheetShell from '../components/SheetShell';
import RecipePhoto from '../components/RecipePhoto';
import type { Recipe } from '../lib/types';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';

export default function RecipePickerSheet({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (recipe: Recipe) => void;
}) {
  const { t } = useI18n();
  const { libraryRecipes } = useApp();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? libraryRecipes.filter(
          (r) =>
            r.title.toLowerCase().includes(q) || r.ingredients.some((i) => i.name.toLowerCase().includes(q))
        )
      : libraryRecipes;
    return list.slice(0, 50);
  }, [libraryRecipes, query]);

  return (
    <SheetShell open={open} onClose={onClose} title={t('pick_recipe')}>
      <TextField
        fullWidth
        size="small"
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('search_placeholder')}
        inputProps={{ dir: 'auto' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />
      <List>
        {results.map((r) => (
          <ListItemButton
            key={r.id}
            onClick={() => {
              onPick(r);
              onClose();
            }}
            sx={{ borderRadius: '14px', gap: 1.5 }}
          >
            <Box sx={{ width: 52, height: 52, borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
              <RecipePhoto recipe={r} height={52} emojiSize={26} />
            </Box>
            <ListItemText primary={r.title} primaryTypographyProps={{ dir: 'auto' }} />
          </ListItemButton>
        ))}
      </List>
    </SheetShell>
  );
}
