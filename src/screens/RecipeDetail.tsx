import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  Snackbar,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import PlayCircleRoundedIcon from '@mui/icons-material/PlayCircleRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import BookmarkAddRoundedIcon from '@mui/icons-material/BookmarkAddRounded';
import { useNavigate, useParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import RecipePhoto from '../components/RecipePhoto';
import IngredientList from '../components/IngredientList';
import TagChips from '../components/TagChips';
import ServingsStepper from '../components/ServingsStepper';
import RecipeEditorSheet from '../sheets/RecipeEditorSheet';
import AddToGrocerySheet from '../sheets/AddToGrocerySheet';
import CookbookPickerSheet from '../sheets/CookbookPickerSheet';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import * as db from '../lib/db';
import { scaleFactor } from '../lib/scale';
import { formatMinutes } from '../lib/parse/duration';
import { recipeToShareText, shareText } from '../lib/shareOut';
import { youtubeEmbedUrl } from '../lib/video';
import type { UnitSystem } from '../lib/types';

const SOCIAL_HOSTS = ['instagram.com', 'tiktok.com', 'youtube.com', 'youtu.be', 'facebook.com', 'pinterest.'];

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const { recipes, uid, unitSystem, refreshRecipes } = useApp();
  const recipe = recipes.find((r) => r.id === id) ?? null;

  const [servings, setServings] = useState<number | null>(null);
  const [system, setSystem] = useState<UnitSystem>(unitSystem);
  const [editorOpen, setEditorOpen] = useState(false);
  const [grocerySheet, setGrocerySheet] = useState(false);
  const [cookbookSheet, setCookbookSheet] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  const isOwn = recipe?.owner_id === uid;
  const effServings = servings ?? recipe?.servings ?? 2;
  const factor = useMemo(() => scaleFactor(recipe?.servings ?? null, effServings), [recipe, effServings]);

  if (!recipe) {
    return (
      <Box>
        <AppHeader title={t('app_name')} back="/" />
        <Typography sx={{ p: 3 }} color="text.secondary">
          {t('loading')}
        </Typography>
      </Box>
    );
  }

  const isSocial = recipe.source_url && SOCIAL_HOSTS.some((h) => recipe.source_url!.includes(h));
  const embedUrl = youtubeEmbedUrl(recipe.source_url);

  const toggleFavorite = async () => {
    await db.updateRecipe(recipe.id, { favorite: !recipe.favorite });
    await refreshRecipes();
  };

  const togglePublic = async (value: boolean) => {
    await db.updateRecipe(recipe.id, { is_public: value });
    await refreshRecipes();
  };

  const remove = async () => {
    if (!window.confirm(t('delete_recipe_confirm'))) return;
    await db.deleteRecipe(recipe.id);
    await refreshRecipes();
    navigate('/');
  };

  const share = async () => {
    const res = await shareText(recipe.title, recipeToShareText(recipe, lang));
    if (res === 'copied') setSnack(t('copied'));
  };

  const saveCopy = async () => {
    const copy = await db.createRecipe({
      title: recipe.title,
      description: recipe.description,
      image_path: null,
      image_url: recipe.image_url,
      source_url: recipe.source_url,
      source_name: recipe.source_name,
      prep_min: recipe.prep_min,
      cook_min: recipe.cook_min,
      total_min: recipe.total_min,
      servings: recipe.servings,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      notes: recipe.notes,
      tags: recipe.tags,
      nutrition: recipe.nutrition,
      favorite: false,
      is_public: false,
      lang: recipe.lang,
    });
    await refreshRecipes();
    setSnack(t('discover_saved'));
    if (copy) navigate(`/recipes/${copy.id}`);
  };

  let stepGroup: string | null = null;
  let stepNo = 0;

  return (
    <Box sx={{ pb: 4 }}>
      <AppHeader
        title=""
        back
        actions={
          isOwn ? (
            <>
              <IconButton onClick={toggleFavorite} aria-label={t('filter_favorites')}>
                {recipe.favorite ? <FavoriteRoundedIcon sx={{ color: '#E25D3D' }} /> : <FavoriteBorderRoundedIcon />}
              </IconButton>
              <IconButton onClick={() => setEditorOpen(true)} aria-label={t('edit')}>
                <EditRoundedIcon />
              </IconButton>
              <IconButton onClick={remove} aria-label={t('delete')}>
                <DeleteRoundedIcon />
              </IconButton>
            </>
          ) : null
        }
      />
      <Box sx={{ px: 2 }}>
        <RecipePhoto recipe={recipe} height={190} rounded emojiSize={72} />
        <Typography variant="h4" dir="auto" sx={{ mt: 1.5, mb: 0.5 }}>
          {recipe.title}
        </Typography>
        {recipe.source_name || recipe.source_url ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }} dir="auto">
            {recipe.source_name ? t('made_by', { name: recipe.source_name }) : null}
          </Typography>
        ) : null}
        {recipe.description ? (
          <Typography variant="body2" color="text.secondary" dir="auto" sx={{ mb: 1 }}>
            {recipe.description}
          </Typography>
        ) : null}
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
          {recipe.prep_min ? <Chip size="small" label={`${t('prep_short')} · ${formatMinutes(recipe.prep_min, lang)}`} /> : null}
          {recipe.cook_min ? <Chip size="small" label={`${t('cook_short')} · ${formatMinutes(recipe.cook_min, lang)}`} /> : null}
          {recipe.total_min ? <Chip size="small" color="primary" variant="outlined" label={`${t('total_short')} · ${formatMinutes(recipe.total_min, lang)}`} /> : null}
          {recipe.source_url ? (
            <Chip
              size="small"
              icon={isSocial ? <PlayCircleRoundedIcon /> : <OpenInNewRoundedIcon />}
              label={isSocial ? t('watch_original') : t('open_source')}
              component="a"
              href={recipe.source_url}
              target="_blank"
              rel="noreferrer"
              clickable
            />
          ) : null}
        </Box>
        <TagChips tags={recipe.tags} />

        <Box sx={{ display: 'flex', gap: 1, my: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<LocalFireDepartmentRoundedIcon />}
            onClick={() => navigate(`/recipes/${recipe.id}/cook`)}
          >
            {t('cook_mode')}
          </Button>
          <Button variant="outlined" startIcon={<ShoppingCartRoundedIcon />} onClick={() => setGrocerySheet(true)}>
            {t('add_to_grocery')}
          </Button>
          {isOwn ? (
            <Button variant="outlined" startIcon={<MenuBookRoundedIcon />} onClick={() => setCookbookSheet(true)}>
              {t('add_to_cookbook')}
            </Button>
          ) : (
            <Button variant="outlined" startIcon={<BookmarkAddRoundedIcon />} onClick={saveCopy}>
              {t('discover_save_copy')}
            </Button>
          )}
          <Button variant="outlined" startIcon={<ShareRoundedIcon />} onClick={share}>
            {t('share')}
          </Button>
        </Box>

        {embedUrl ? (
          <Box
            component="iframe"
            src={embedUrl}
            title={t('watch_original')}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            sx={{ width: '100%', aspectRatio: '16 / 9', border: 0, borderRadius: '18px', mb: 2, display: 'block', bgcolor: '#000' }}
          />
        ) : null}

        {isOwn ? (
          <FormControlLabel
            control={<Switch checked={recipe.is_public} onChange={(_e, v) => togglePublic(v)} />}
            label={
              <Box>
                <Typography variant="body2">{t('public_toggle')}</Typography>
                {recipe.is_public ? (
                  <Typography variant="caption" color="text.secondary">
                    {t('public_on_hint')}
                  </Typography>
                ) : null}
              </Box>
            }
            sx={{ mb: 1 }}
          />
        ) : null}

        <Divider sx={{ my: 1.5 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h6">{t('ingredients_title')}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ServingsStepper value={effServings} onChange={setServings} />
            <Typography variant="caption" color="text.secondary">
              {t('servings_label')}
            </Typography>
          </Box>
        </Box>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={system}
          onChange={(_e, v) => v && setSystem(v)}
          sx={{ mb: 1.5 }}
        >
          <ToggleButton value="original">{t('units_original')}</ToggleButton>
          <ToggleButton value="metric">{t('units_metric')}</ToggleButton>
          <ToggleButton value="us">{t('units_us')}</ToggleButton>
        </ToggleButtonGroup>
        <IngredientList ingredients={recipe.ingredients} factor={factor} unitSystem={system} />

        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>
          {t('steps_title')}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {recipe.steps.map((s, i) => {
            const showGroup = s.group && s.group !== stepGroup;
            stepGroup = s.group;
            stepNo += 1;
            return (
              <Box key={i}>
                {showGroup ? (
                  <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700 }}>
                    {s.group}
                  </Typography>
                ) : null}
                <Box sx={{ display: 'flex', gap: 1.25 }}>
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      flexShrink: 0,
                      mt: 0.25,
                    }}
                  >
                    {stepNo}
                  </Box>
                  <Typography dir="auto">{s.text}</Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        {recipe.nutrition ? (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6">{t('nutrition_title')}</Typography>
              {recipe.nutrition.estimated ? (
                <Chip size="small" color="warning" variant="outlined" label={t('nutrition_estimated')} />
              ) : null}
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
              {(
                [
                  ['calories', recipe.nutrition.calories, ''],
                  ['protein', recipe.nutrition.protein, t('grams_short')],
                  ['carbs', recipe.nutrition.carbs, t('grams_short')],
                  ['fat', recipe.nutrition.fat, t('grams_short')],
                ] as const
              ).map(([key, value, unit]) => (
                <Box key={key} sx={{ bgcolor: 'action.hover', borderRadius: '14px', p: 1, textAlign: 'center' }}>
                  <Typography sx={{ fontWeight: 700 }}>
                    {value != null ? `${Math.round(value)}${unit}` : '—'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t(key)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        ) : null}

        {recipe.notes ? (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              {t('notes_title')}
            </Typography>
            <Typography dir="auto" color="text.secondary">
              {recipe.notes}
            </Typography>
          </>
        ) : null}
      </Box>

      <RecipeEditorSheet open={editorOpen} onClose={() => setEditorOpen(false)} recipe={recipe} onSaved={() => undefined} />
      <AddToGrocerySheet
        open={grocerySheet}
        onClose={() => setGrocerySheet(false)}
        recipe={recipe}
        onAdded={() => setSnack(t('added_to_grocery'))}
      />
      <CookbookPickerSheet open={cookbookSheet} onClose={() => setCookbookSheet(false)} recipeId={recipe.id} />
      <Snackbar open={!!snack} autoHideDuration={2500} onClose={() => setSnack(null)} message={snack} />
      {!isOwn && recipe.is_public ? (
        <Alert severity="info" sx={{ mx: 2, mt: 2 }}>
          {t('discover_hint')}
        </Alert>
      ) : null}
    </Box>
  );
}
