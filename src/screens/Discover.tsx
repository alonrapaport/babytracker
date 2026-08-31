import { useMemo, useState } from 'react';
import { Box, InputAdornment, TextField, Typography } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import RecipeCard from '../components/RecipeCard';
import EmptyState from '../components/EmptyState';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';

// Community feed: everything shared publicly, searchable by dish name,
// ingredient or tag ("what can I make with עגבניות?").
export default function Discover() {
  const { t } = useI18n();
  const { publicRecipes } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return publicRecipes;
    return publicRecipes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(q)) ||
        r.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [publicRecipes, query]);

  return (
    <Box>
      <AppHeader title={t('discover_title')} />
      <Typography variant="body2" color="text.secondary" sx={{ px: 2, mb: 1 }}>
        {t('discover_hint')}
      </Typography>
      <Box sx={{ px: 2, pb: 1.5 }}>
        <TextField
          fullWidth
          size="small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('discover_search_placeholder')}
          inputProps={{ dir: 'auto' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      {shown.length === 0 ? (
        <EmptyState emoji="🌍" title={t('discover_empty')} />
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, px: 2, pb: 2 }}>
          {shown.map((r) => (
            <Box key={r.id}>
              <RecipeCard recipe={r} onClick={() => navigate(`/recipes/${r.id}`)} />
              {r.source_name ? (
                <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }} dir="auto">
                  {t('made_by', { name: r.source_name })}
                </Typography>
              ) : null}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
