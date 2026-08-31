import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';
import { useApp } from '../context/AppContext';
import { useI18n, type Dict } from '../i18n';
import * as db from '../lib/db';
import { quickAddItem } from '../lib/grocery';
import { AISLE_IDS } from '../data/aisles';
import { aisleColors } from '../theme';
import { formatQty } from '../lib/scale';
import { unitLabel } from '../data/units';
import { groceryListToText, shareText } from '../lib/shareOut';
import type { GroceryItem } from '../lib/types';

export default function Grocery() {
  const { t, lang } = useI18n();
  const { groceryItems, customAisles, setCustomAisles, refreshGrocery } = useApp();
  const [groupBy, setGroupBy] = useState<'aisle' | 'recipe'>('aisle');
  const [quickAdd, setQuickAdd] = useState('');
  const [menu, setMenu] = useState<{ anchor: HTMLElement; item: GroceryItem } | null>(null);
  const [aisleMenuFor, setAisleMenuFor] = useState<GroceryItem | null>(null);
  const [newAisleOpen, setNewAisleOpen] = useState(false);
  const [newAisleName, setNewAisleName] = useState('');
  const [snack, setSnack] = useState<string | null>(null);

  const aisleName = (aisle: string) =>
    (AISLE_IDS as readonly string[]).includes(aisle) ? t(`aisle_${aisle}` as keyof Dict) : aisle;

  const groups = useMemo(() => {
    const map = new Map<string, GroceryItem[]>();
    const keys: string[] = [];
    const push = (key: string, item: GroceryItem) => {
      if (!map.has(key)) {
        map.set(key, []);
        keys.push(key);
      }
      map.get(key)!.push(item);
    };
    if (groupBy === 'aisle') {
      const order = [...AISLE_IDS.filter((a) => a !== 'other'), ...customAisles, 'other'];
      for (const aisle of order) {
        for (const item of groceryItems.filter((i) => i.aisle === aisle)) push(aisle, item);
      }
      // anything with an unknown custom aisle
      for (const item of groceryItems.filter((i) => !order.includes(i.aisle))) push(item.aisle, item);
    } else {
      for (const item of groceryItems.filter((i) => i.recipe_title)) push(item.recipe_title!, item);
      for (const item of groceryItems.filter((i) => !i.recipe_title)) push(t('no_recipe_group'), item);
    }
    for (const list of map.values()) list.sort((a, b) => Number(a.checked) - Number(b.checked));
    return keys.map((key) => ({ key, items: map.get(key)! }));
  }, [groceryItems, groupBy, customAisles, t]);

  const onQuickAdd = async () => {
    const item = quickAddItem(quickAdd);
    if (!item) return;
    await db.addGroceryItems([item]);
    await refreshGrocery();
    setQuickAdd('');
  };

  const toggle = async (item: GroceryItem) => {
    await db.updateGroceryItem(item.id, { checked: !item.checked });
    await refreshGrocery();
  };

  const moveToAisle = async (item: GroceryItem, aisle: string) => {
    await db.updateGroceryItem(item.id, { aisle });
    await refreshGrocery();
    setAisleMenuFor(null);
  };

  const createAisle = async () => {
    const name = newAisleName.trim();
    if (!name) return;
    if (!customAisles.includes(name)) await setCustomAisles([...customAisles, name]);
    if (aisleMenuFor) await moveToAisle(aisleMenuFor, name);
    setNewAisleOpen(false);
    setNewAisleName('');
  };

  const share = async () => {
    const res = await shareText(t('grocery_title'), groceryListToText(groceryItems, lang, aisleName));
    if (res === 'copied') setSnack(t('copied'));
  };

  const hasChecked = groceryItems.some((i) => i.checked);

  return (
    <Box sx={{ pb: 2 }}>
      <AppHeader
        title={t('grocery_title')}
        actions={
          <>
            <IconButton onClick={share} aria-label={t('share_list')}>
              <ShareRoundedIcon />
            </IconButton>
            <IconButton
              onClick={async () => {
                await db.clearCheckedGrocery();
                await refreshGrocery();
              }}
              disabled={!hasChecked}
              aria-label={t('clear_checked')}
            >
              <DeleteSweepRoundedIcon />
            </IconButton>
          </>
        }
      />
      <Box sx={{ px: 2, display: 'flex', gap: 1, mb: 1.5, alignItems: 'center' }}>
        <TextField
          fullWidth
          size="small"
          value={quickAdd}
          onChange={(e) => setQuickAdd(e.target.value)}
          placeholder={t('quick_add_placeholder')}
          inputProps={{ dir: 'auto' }}
          onKeyDown={(e) => e.key === 'Enter' && onQuickAdd()}
        />
        <ToggleButtonGroup exclusive size="small" value={groupBy} onChange={(_e, v) => v && setGroupBy(v)}>
          <ToggleButton value="aisle">{t('group_by_aisle')}</ToggleButton>
          <ToggleButton value="recipe">{t('group_by_recipe')}</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {groceryItems.length === 0 ? (
        <EmptyState emoji="🛒" title={t('grocery_empty')} />
      ) : (
        <Box sx={{ px: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {groups.map(({ key, items }) => (
            <Box key={key} sx={{ bgcolor: 'background.paper', borderRadius: '18px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Box sx={{ px: 1.5, py: 0.75, bgcolor: groupBy === 'aisle' ? (aisleColors[key] ?? '#EFECE7') : '#EFECE7' }}>
                <Typography variant="subtitle2" dir="auto" sx={{ fontWeight: 700 }}>
                  {groupBy === 'aisle' ? aisleName(key) : key}
                </Typography>
              </Box>
              <Divider />
              {items.map((item) => (
                <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', px: 0.5, py: 0.25 }}>
                  <Checkbox checked={item.checked} onChange={() => toggle(item)} />
                  <ListItemText
                    primary={
                      <Typography
                        dir="auto"
                        sx={{ textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? 'text.disabled' : 'text.primary', fontSize: 15 }}
                      >
                        {item.qty != null ? `${formatQty(item.qty)} ${unitLabel(item.unit, item.qty, lang)} `.replace('  ', ' ') : ''}
                        {item.name}
                      </Typography>
                    }
                    secondary={groupBy === 'aisle' && item.recipe_title ? item.recipe_title : undefined}
                    secondaryTypographyProps={{ dir: 'auto', fontSize: 12 }}
                  />
                  <IconButton size="small" onClick={(e) => setMenu({ anchor: e.currentTarget, item })} aria-label="more">
                    <MoreVertRoundedIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      )}

      <Menu anchorEl={menu?.anchor ?? null} open={!!menu} onClose={() => setMenu(null)}>
        <MenuItem
          onClick={() => {
            setAisleMenuFor(menu!.item);
            setMenu(null);
          }}
        >
          {t('move_aisle')}
        </MenuItem>
        <MenuItem
          onClick={async () => {
            await db.deleteGroceryItem(menu!.item.id);
            await refreshGrocery();
            setMenu(null);
          }}
        >
          {t('delete')}
        </MenuItem>
      </Menu>

      <Dialog open={!!aisleMenuFor} onClose={() => setAisleMenuFor(null)} fullWidth maxWidth="xs">
        <DialogTitle>{t('move_aisle')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {[...AISLE_IDS, ...customAisles].map((aisle) => (
            <Button key={aisle} size="small" variant="outlined" onClick={() => aisleMenuFor && moveToAisle(aisleMenuFor, aisle)}>
              {aisleName(aisle)}
            </Button>
          ))}
          <Button size="small" variant="contained" onClick={() => setNewAisleOpen(true)}>
            {t('custom_aisle_new')}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={newAisleOpen} onClose={() => setNewAisleOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t('custom_aisle_name')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            value={newAisleName}
            onChange={(e) => setNewAisleName(e.target.value)}
            inputProps={{ dir: 'auto' }}
            onKeyDown={(e) => e.key === 'Enter' && createAisle()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewAisleOpen(false)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={createAisle} disabled={!newAisleName.trim()}>
            {t('create')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={2000} onClose={() => setSnack(null)} message={snack} />
    </Box>
  );
}
