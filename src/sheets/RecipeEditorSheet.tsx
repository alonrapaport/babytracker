import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, TextField, Typography } from '@mui/material';
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';
import SheetShell from '../components/SheetShell';
import PhotoField from '../components/PhotoField';
import { useTagLabel } from '../components/TagChips';
import { TAG_GROUPS } from '../data/tags';
import type { Recipe, RecipeDraft } from '../lib/types';
import { parseIngredientBlock } from '../lib/parse/ingredient';
import { estimateNutrition } from '../lib/nutrition';
import * as db from '../lib/db';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { isDemo } from '../lib/demo';

// The one place every path converges: manual creation, URL/text/HTML imports
// and edits all land here, so whatever a parser missed is fixable by hand.

function ingredientsToText(ings: Recipe['ingredients']): string {
  const lines: string[] = [];
  let group: string | null = null;
  for (const ing of ings) {
    if (ing.group && ing.group !== group) lines.push(`${ing.group}:`);
    group = ing.group;
    lines.push(ing.raw || ing.name);
  }
  return lines.join('\n');
}

export default function RecipeEditorSheet({
  open,
  onClose,
  recipe,
  draft,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  recipe?: Recipe | null;
  draft?: RecipeDraft | null;
  onSaved: (r: Recipe) => void;
}) {
  const { t, lang } = useI18n();
  const { refreshRecipes } = useApp();
  const tagLabel = useTagLabel();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [servings, setServings] = useState('');
  const [prep, setPrep] = useState('');
  const [cook, setCook] = useState('');
  const [ingText, setIngText] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<Set<string>>(new Set());
  const [freeTag, setFreeTag] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [estimated, setEstimated] = useState(false);
  const [coverage, setCoverage] = useState<{ matched: number; total: number } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const src = recipe ?? draft;
    setTitle(src?.title === 'Recipe' ? '' : src?.title ?? '');
    setDescription(src?.description ?? '');
    setPhoto(
      recipe?.image_path && recipe.image_path.startsWith('data:')
        ? recipe.image_path
        : draft?.photo_data ?? null
    );
    setServings(src?.servings != null ? String(src.servings) : '');
    setPrep(src?.prep_min != null ? String(src.prep_min) : '');
    setCook(src?.cook_min != null ? String(src.cook_min) : '');
    setIngText(src ? ingredientsToText(src.ingredients) : '');
    setStepsText(src ? src.steps.map((s) => s.text).join('\n') : '');
    setNotes(src?.notes ?? '');
    setTags(new Set(src?.tags ?? []));
    setFreeTag('');
    setSourceUrl(src?.source_url ?? '');
    setSourceName(src?.source_name ?? '');
    setImageUrl(src?.image_url ?? '');
    setCalories(src?.nutrition?.calories != null ? String(src.nutrition.calories) : '');
    setProtein(src?.nutrition?.protein != null ? String(src.nutrition.protein) : '');
    setCarbs(src?.nutrition?.carbs != null ? String(src.nutrition.carbs) : '');
    setFat(src?.nutrition?.fat != null ? String(src.nutrition.fat) : '');
    setEstimated(src?.nutrition?.estimated ?? false);
    setCoverage(null);
  }, [open, recipe, draft]);

  const toggleTag = (tag: string) => {
    setTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const num = (s: string): number | null => {
    const n = Number(s.replace(',', '.'));
    return s.trim() && Number.isFinite(n) ? n : null;
  };

  const save = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      let image_path = recipe?.image_path ?? null;
      if (photo) image_path = isDemo ? photo : await db.uploadPhoto(photo);
      const nutrition =
        num(calories) != null || num(protein) != null || num(carbs) != null || num(fat) != null
          ? { calories: num(calories), protein: num(protein), carbs: num(carbs), fat: num(fat), ...(estimated ? { estimated: true } : {}) }
          : null;
      const prepMin = num(prep);
      const cookMin = num(cook);
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        image_path,
        image_url: imageUrl.trim() || null,
        source_url: sourceUrl.trim() || null,
        source_name: sourceName.trim() || null,
        prep_min: prepMin,
        cook_min: cookMin,
        total_min: prepMin != null || cookMin != null ? (prepMin ?? 0) + (cookMin ?? 0) : null,
        servings: num(servings),
        ingredients: parseIngredientBlock(ingText),
        steps: stepsText
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((text) => ({ text, group: null })),
        notes: notes.trim() || null,
        tags: [...tags],
        nutrition,
        favorite: recipe?.favorite ?? false,
        is_public: recipe?.is_public ?? false,
        lang: (recipe?.lang ?? draft?.lang ?? lang) as Recipe['lang'],
      };
      let saved: Recipe | null;
      if (recipe) {
        await db.updateRecipe(recipe.id, payload);
        saved = { ...recipe, ...payload, updated_at: new Date().toISOString() };
      } else {
        saved = await db.createRecipe(payload);
      }
      await refreshRecipes();
      if (saved) onSaved(saved);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const confidenceKey = useMemo(() => {
    if (!draft || recipe) return null;
    return draft.confidence === 'high'
      ? ('editor_confidence_high' as const)
      : draft.confidence === 'medium'
        ? ('editor_confidence_medium' as const)
        : ('editor_confidence_low' as const);
  }, [draft, recipe]);

  return (
    <SheetShell
      open={open}
      onClose={onClose}
      title={recipe ? t('editor_edit_title') : t('editor_new_title')}
      onSave={save}
      saveDisabled={!title.trim() || saving}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {confidenceKey ? (
          <Alert severity={draft?.confidence === 'low' ? 'warning' : 'success'}>{t(confidenceKey)}</Alert>
        ) : null}
        <TextField
          label={t('field_title')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          helperText={!title.trim() ? t('editor_missing_title') : ' '}
          inputProps={{ dir: 'auto' }}
          autoFocus={!recipe && !draft}
        />
        <TextField
          label={t('field_description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          minRows={2}
          inputProps={{ dir: 'auto' }}
        />
        <PhotoField value={photo} onChange={setPhoto} label={t('field_image_url')} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField label={t('field_servings')} value={servings} onChange={(e) => setServings(e.target.value)} type="number" sx={{ flex: 1 }} />
          <TextField label={t('field_prep')} value={prep} onChange={(e) => setPrep(e.target.value)} type="number" sx={{ flex: 1 }} />
          <TextField label={t('field_cook')} value={cook} onChange={(e) => setCook(e.target.value)} type="number" sx={{ flex: 1 }} />
        </Box>
        <TextField
          label={t('field_ingredients')}
          value={ingText}
          onChange={(e) => setIngText(e.target.value)}
          multiline
          minRows={6}
          placeholder={t('editor_ing_placeholder')}
          inputProps={{ dir: 'auto' }}
        />
        <TextField
          label={t('field_steps')}
          value={stepsText}
          onChange={(e) => setStepsText(e.target.value)}
          multiline
          minRows={6}
          placeholder={t('editor_steps_placeholder')}
          inputProps={{ dir: 'auto' }}
        />
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t('field_tags')} — {t('editor_tags_hint')}
          </Typography>
          {TAG_GROUPS.map((g) => (
            <Box key={g.group} sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
              {g.tags.map((tag) => (
                <Chip
                  key={tag}
                  size="small"
                  label={tagLabel(tag)}
                  color={tags.has(tag) ? 'primary' : 'default'}
                  variant={tags.has(tag) ? 'filled' : 'outlined'}
                  onClick={() => toggleTag(tag)}
                />
              ))}
            </Box>
          ))}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
            {[...tags]
              .filter((tag) => !TAG_GROUPS.some((g) => g.tags.includes(tag)))
              .map((tag) => (
                <Chip key={tag} size="small" label={tag} color="primary" onDelete={() => toggleTag(tag)} />
              ))}
          </Box>
          <TextField
            size="small"
            value={freeTag}
            onChange={(e) => setFreeTag(e.target.value)}
            placeholder="#"
            inputProps={{ dir: 'auto' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && freeTag.trim()) {
                toggleTag(freeTag.trim().toLowerCase());
                setFreeTag('');
              }
            }}
          />
        </Box>
        <Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField label={t('calories')} value={calories} onChange={(e) => { setCalories(e.target.value); setEstimated(false); }} type="number" sx={{ flex: 1 }} />
            <TextField label={t('protein')} value={protein} onChange={(e) => { setProtein(e.target.value); setEstimated(false); }} type="number" sx={{ flex: 1 }} />
            <TextField label={t('carbs')} value={carbs} onChange={(e) => { setCarbs(e.target.value); setEstimated(false); }} type="number" sx={{ flex: 1 }} />
            <TextField label={t('fat')} value={fat} onChange={(e) => { setFat(e.target.value); setEstimated(false); }} type="number" sx={{ flex: 1 }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<CalculateRoundedIcon />}
              onClick={() => {
                const est = estimateNutrition(parseIngredientBlock(ingText), num(servings));
                if (!est) return;
                setCalories(est.nutrition.calories != null ? String(est.nutrition.calories) : '');
                setProtein(est.nutrition.protein != null ? String(est.nutrition.protein) : '');
                setCarbs(est.nutrition.carbs != null ? String(est.nutrition.carbs) : '');
                setFat(est.nutrition.fat != null ? String(est.nutrition.fat) : '');
                setEstimated(true);
                setCoverage({ matched: est.matched, total: est.total });
              }}
            >
              {t('estimate_nutrition')}
            </Button>
            {estimated ? <Chip size="small" color="warning" variant="outlined" label={t('nutrition_estimated')} /> : null}
            {coverage ? (
              <Typography variant="caption" color="text.secondary">
                {t('nutrition_coverage', { matched: coverage.matched, total: coverage.total })}
              </Typography>
            ) : null}
          </Box>
        </Box>
        <TextField label={t('field_notes')} value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} inputProps={{ dir: 'auto' }} />
        <TextField label={t('field_source')} value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} dir="ltr" />
        <TextField label={t('field_source_name')} value={sourceName} onChange={(e) => setSourceName(e.target.value)} inputProps={{ dir: 'auto' }} />
        <TextField label={t('field_image_url')} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} dir="ltr" />
      </Box>
    </SheetShell>
  );
}
