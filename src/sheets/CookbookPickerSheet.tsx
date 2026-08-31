import { useState } from 'react';
import { Box, Button, Checkbox, List, ListItemButton, ListItemIcon, ListItemText, TextField, Typography } from '@mui/material';
import SheetShell from '../components/SheetShell';
import * as db from '../lib/db';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';

export default function CookbookPickerSheet({
  open,
  onClose,
  recipeId,
}: {
  open: boolean;
  onClose: () => void;
  recipeId: string;
}) {
  const { t } = useI18n();
  const { cookbooks, cookbookRecipes, refreshCookbooks } = useApp();
  const [newName, setNewName] = useState('');

  const inCookbook = (cookbookId: string) =>
    cookbookRecipes.some((cr) => cr.cookbook_id === cookbookId && cr.recipe_id === recipeId);

  const toggle = async (cookbookId: string) => {
    if (inCookbook(cookbookId)) await db.removeRecipeFromCookbook(cookbookId, recipeId);
    else await db.addRecipeToCookbook(cookbookId, recipeId);
    await refreshCookbooks();
  };

  const createAndAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    const cb = await db.createCookbook(name, null);
    if (cb) await db.addRecipeToCookbook(cb.id, recipeId);
    setNewName('');
    await refreshCookbooks();
  };

  return (
    <SheetShell open={open} onClose={onClose} title={t('cookbook_pick')}>
      {cookbooks.length === 0 ? (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {t('cookbook_none_yet')}
        </Typography>
      ) : (
        <List>
          {cookbooks.map((cb) => (
            <ListItemButton key={cb.id} onClick={() => toggle(cb.id)}>
              <ListItemIcon>
                <Checkbox edge="start" checked={inCookbook(cb.id)} tabIndex={-1} disableRipple />
              </ListItemIcon>
              <ListItemText primary={`${cb.emoji ? `${cb.emoji} ` : ''}${cb.name}`} />
            </ListItemButton>
          ))}
        </List>
      )}
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <TextField
          fullWidth
          size="small"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t('cookbook_new')}
          inputProps={{ dir: 'auto' }}
          onKeyDown={(e) => e.key === 'Enter' && createAndAdd()}
        />
        <Button variant="contained" onClick={createAndAdd} disabled={!newName.trim()}>
          {t('create')}
        </Button>
      </Box>
    </SheetShell>
  );
}
