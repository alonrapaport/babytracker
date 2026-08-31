import { useMemo, useState } from 'react';
import { Alert, Box, Fab, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CollectionsBookmarkRoundedIcon from '@mui/icons-material/CollectionsBookmarkRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import ContentPasteRoundedIcon from '@mui/icons-material/ContentPasteRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import SearchSortBar, { type SortKey } from '../components/SearchSortBar';
import RecipeCard from '../components/RecipeCard';
import EmptyState from '../components/EmptyState';
import RecipeEditorSheet from '../sheets/RecipeEditorSheet';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { isDemo } from '../lib/demo';

export default function Recipes() {
  const { t } = useI18n();
  const { libraryRecipes } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const tagOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of libraryRecipes) for (const tag of r.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  }, [libraryRecipes]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = libraryRecipes.filter((r) => {
      if (favoritesOnly && !r.favorite) return false;
      if (activeTag && !r.tags.includes(activeTag)) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(q))
      );
    });
    if (sort === 'alpha') list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'time') list = [...list].sort((a, b) => (a.total_min ?? 999) - (b.total_min ?? 999));
    else list = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return list;
  }, [libraryRecipes, query, sort, favoritesOnly, activeTag]);

  return (
    <Box>
      <AppHeader
        title={t('app_name')}
        actions={
          <IconButton onClick={() => navigate('/cookbooks')} aria-label={t('cookbooks_title')}>
            <CollectionsBookmarkRoundedIcon />
          </IconButton>
        }
      />
      {isDemo ? (
        <Alert severity="info" sx={{ mx: 2, mb: 1, py: 0 }}>
          {t('demo_banner')}
        </Alert>
      ) : null}
      <SearchSortBar
        query={query}
        onQuery={setQuery}
        sort={sort}
        onSort={setSort}
        favoritesOnly={favoritesOnly}
        onFavoritesOnly={setFavoritesOnly}
        tagOptions={tagOptions}
        activeTag={activeTag}
        onTag={setActiveTag}
      />
      {shown.length === 0 ? (
        <EmptyState emoji="🍳" title={t('empty_recipes_title')} body={t('empty_recipes_body')} />
      ) : (
        <>
          <Typography variant="caption" color="text.secondary" sx={{ px: 2 }}>
            {t('recipes_count', { n: shown.length })}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, px: 2, pt: 0.5, pb: 2 }}>
            {shown.map((r) => (
              <RecipeCard key={r.id} recipe={r} onClick={() => navigate(`/recipes/${r.id}`)} />
            ))}
          </Box>
        </>
      )}

      <Fab
        aria-label={t('add')}
        onClick={(e) => setMenuAnchor(e.currentTarget)}
        sx={{ position: 'fixed', bottom: 88, insetInlineEnd: 'max(16px, calc(50% - 244px))' }}
      >
        <AddRoundedIcon />
      </Fab>
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            navigate('/import?tab=url');
          }}
        >
          <ListItemIcon>
            <LinkRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('add_menu_url')}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            navigate('/import?tab=text');
          }}
        >
          <ListItemIcon>
            <ContentPasteRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('add_menu_paste')}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            setEditorOpen(true);
          }}
        >
          <ListItemIcon>
            <EditNoteRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('add_menu_manual')}</ListItemText>
        </MenuItem>
      </Menu>

      <RecipeEditorSheet
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={(r) => navigate(`/recipes/${r.id}`)}
      />
    </Box>
  );
}
