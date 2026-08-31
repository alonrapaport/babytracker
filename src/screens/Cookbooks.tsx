import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import * as db from '../lib/db';

export default function Cookbooks() {
  const { t } = useI18n();
  const { cookbooks, cookbookRecipes, refreshCookbooks } = useApp();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');

  const count = (id: string) => cookbookRecipes.filter((cr) => cr.cookbook_id === id).length;

  const create = async () => {
    if (!name.trim()) return;
    const cb = await db.createCookbook(name.trim(), emoji.trim() || null);
    await refreshCookbooks();
    setDialogOpen(false);
    setName('');
    setEmoji('');
    if (cb) navigate(`/cookbooks/${cb.id}`);
  };

  return (
    <Box>
      <AppHeader
        title={t('cookbooks_title')}
        back="/"
        actions={
          <Button startIcon={<AddRoundedIcon />} onClick={() => setDialogOpen(true)}>
            {t('cookbook_new')}
          </Button>
        }
      />
      {cookbooks.length === 0 ? (
        <EmptyState emoji="📚" title={t('cookbook_none_yet')} />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, px: 2, pb: 2 }}>
          {cookbooks.map((cb) => (
            <Card key={cb.id}>
              <CardActionArea onClick={() => navigate(`/cookbooks/${cb.id}`)} sx={{ p: 2, display: 'flex', justifyContent: 'flex-start', gap: 1.5 }}>
                <Typography sx={{ fontSize: 32, lineHeight: 1 }}>{cb.emoji || '📖'}</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700 }} dir="auto">
                    {cb.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('recipes_count', { n: count(cb.id) })}
                  </Typography>
                </Box>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t('cookbook_new')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', gap: 1, pt: '8px !important' }}>
          <TextField
            autoFocus
            fullWidth
            label={t('cookbook_name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            inputProps={{ dir: 'auto' }}
            onKeyDown={(e) => e.key === 'Enter' && create()}
          />
          <TextField label={t('cookbook_emoji')} value={emoji} onChange={(e) => setEmoji(e.target.value)} sx={{ width: 120 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={create} disabled={!name.trim()}>
            {t('create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
