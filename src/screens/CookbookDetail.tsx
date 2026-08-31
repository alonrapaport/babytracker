import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, IconButton, Snackbar, Typography } from '@mui/material';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useNavigate, useParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';
import RecipeCard from '../components/RecipeCard';
import RecipePickerSheet from '../sheets/RecipePickerSheet';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import * as db from '../lib/db';
import type { CookbookMember } from '../lib/types';

export default function CookbookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { cookbooks, cookbookRecipes, recipes, uid, refreshCookbooks } = useApp();
  const cookbook = cookbooks.find((c) => c.id === id) ?? null;
  const [members, setMembers] = useState<CookbookMember[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  useEffect(() => {
    if (id) db.listCookbookMembers(id).then(setMembers);
  }, [id]);

  const inBook = useMemo(() => {
    if (!cookbook) return [];
    const ids = new Set(cookbookRecipes.filter((cr) => cr.cookbook_id === cookbook.id).map((cr) => cr.recipe_id));
    return recipes.filter((r) => ids.has(r.id));
  }, [cookbook, cookbookRecipes, recipes]);

  if (!cookbook) {
    return (
      <Box>
        <AppHeader title={t('cookbooks_title')} back="/cookbooks" />
        <Typography sx={{ p: 3 }} color="text.secondary">
          {t('loading')}
        </Typography>
      </Box>
    );
  }

  const isOwner = cookbook.owner_id === uid;

  const copyInvite = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/join?token=${cookbook.invite_token}`;
    await navigator.clipboard.writeText(url);
    setSnack(t('copied'));
  };

  const removeRecipe = async (recipeId: string) => {
    await db.removeRecipeFromCookbook(cookbook.id, recipeId);
    await refreshCookbooks();
  };

  const deleteBook = async () => {
    if (!window.confirm(t('cookbook_delete_confirm'))) return;
    await db.deleteCookbook(cookbook.id);
    await refreshCookbooks();
    navigate('/cookbooks');
  };

  const leaveBook = async () => {
    if (!uid) return;
    await db.leaveCookbook(cookbook.id, uid);
    await refreshCookbooks();
    navigate('/cookbooks');
  };

  return (
    <Box>
      <AppHeader
        title={`${cookbook.emoji ? `${cookbook.emoji} ` : ''}${cookbook.name}`}
        back="/cookbooks"
        actions={
          isOwner ? (
            <IconButton onClick={deleteBook} aria-label={t('delete')}>
              <DeleteRoundedIcon />
            </IconButton>
          ) : (
            <IconButton onClick={leaveBook} aria-label="leave">
              <LogoutRoundedIcon />
            </IconButton>
          )
        }
      />
      <Box sx={{ px: 2, display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
        <Button variant="outlined" size="small" startIcon={<PersonAddRoundedIcon />} onClick={copyInvite}>
          {t('cookbook_invite')}
        </Button>
        <Button variant="contained" size="small" startIcon={<AddRoundedIcon />} onClick={() => setPickerOpen(true)}>
          {t('cookbook_add_recipes')}
        </Button>
      </Box>
      <Box sx={{ px: 2, mb: 1.5, display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {t('cookbook_members')}:
        </Typography>
        {members.map((m) => (
          <Chip key={m.id} size="small" label={m.display_name || `${m.user_id.slice(0, 6)}…`} variant={m.role === 'owner' ? 'filled' : 'outlined'} />
        ))}
      </Box>

      {inBook.length === 0 ? (
        <EmptyState emoji="🍲" title={t('cookbook_empty')} />
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, px: 2, pb: 2 }}>
          {inBook.map((r) => (
            <Box key={r.id} sx={{ position: 'relative' }}>
              <RecipeCard recipe={r} onClick={() => navigate(`/recipes/${r.id}`)} />
              <IconButton
                size="small"
                onClick={() => removeRecipe(r.id)}
                aria-label={t('delete')}
                sx={{ position: 'absolute', top: 4, insetInlineStart: 4, bgcolor: 'rgba(255,255,255,.85)', '&:hover': { bgcolor: 'rgba(255,255,255,.95)' } }}
              >
                <CloseRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      <RecipePickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={async (r) => {
          await db.addRecipeToCookbook(cookbook.id, r.id);
          await refreshCookbooks();
        }}
      />
      <Snackbar open={!!snack} autoHideDuration={2000} onClose={() => setSnack(null)} message={snack} />
    </Box>
  );
}
