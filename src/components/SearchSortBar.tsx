import { Box, Chip, InputAdornment, MenuItem, TextField } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import { useI18n } from '../i18n';
import { useTagLabel } from './TagChips';

export type SortKey = 'newest' | 'alpha' | 'time';

export default function SearchSortBar({
  query,
  onQuery,
  sort,
  onSort,
  favoritesOnly,
  onFavoritesOnly,
  tagOptions,
  activeTag,
  onTag,
}: {
  query: string;
  onQuery: (q: string) => void;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  favoritesOnly: boolean;
  onFavoritesOnly: (v: boolean) => void;
  tagOptions: string[];
  activeTag: string | null;
  onTag: (tag: string | null) => void;
}) {
  const { t } = useI18n();
  const tagLabel = useTagLabel();
  return (
    <Box sx={{ px: 2, pb: 1 }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={t('search_placeholder')}
          inputProps={{ 'aria-label': t('search') }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select
          size="small"
          value={sort}
          onChange={(e) => onSort(e.target.value as SortKey)}
          sx={{ minWidth: 110 }}
          inputProps={{ 'aria-label': 'sort' }}
        >
          <MenuItem value="newest">{t('sort_newest')}</MenuItem>
          <MenuItem value="alpha">{t('sort_alpha')}</MenuItem>
          <MenuItem value="time">{t('sort_time')}</MenuItem>
        </TextField>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.75, mt: 1, overflowX: 'auto', pb: 0.5 }}>
        <Chip
          size="small"
          icon={<FavoriteRoundedIcon sx={{ fontSize: 14 }} />}
          label={t('filter_favorites')}
          color={favoritesOnly ? 'primary' : 'default'}
          variant={favoritesOnly ? 'filled' : 'outlined'}
          onClick={() => onFavoritesOnly(!favoritesOnly)}
        />
        {tagOptions.map((tag) => (
          <Chip
            key={tag}
            size="small"
            label={tagLabel(tag)}
            color={activeTag === tag ? 'primary' : 'default'}
            variant={activeTag === tag ? 'filled' : 'outlined'}
            onClick={() => onTag(activeTag === tag ? null : tag)}
          />
        ))}
      </Box>
    </Box>
  );
}
