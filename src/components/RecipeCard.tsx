import { Box, Card, CardActionArea, Chip, Typography } from '@mui/material';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import type { Recipe } from '../lib/types';
import RecipePhoto from './RecipePhoto';
import { formatMinutes } from '../lib/parse/duration';
import { useI18n } from '../i18n';

export default function RecipeCard({ recipe, onClick }: { recipe: Recipe; onClick: () => void }) {
  const { lang } = useI18n();
  return (
    <Card sx={{ position: 'relative' }}>
      <CardActionArea onClick={onClick}>
        <RecipePhoto recipe={recipe} height={120} emojiSize={44} />
        <Box sx={{ p: 1.25 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              lineHeight: 1.25,
              minHeight: '2.5em',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {recipe.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.75, alignItems: 'center', flexWrap: 'wrap' }}>
            {recipe.total_min ? (
              <Chip
                size="small"
                icon={<AccessTimeRoundedIcon sx={{ fontSize: 14 }} />}
                label={formatMinutes(recipe.total_min, lang)}
                sx={{ height: 22 }}
              />
            ) : null}
            {recipe.servings ? <Chip size="small" label={`×${recipe.servings}`} sx={{ height: 22 }} /> : null}
          </Box>
        </Box>
      </CardActionArea>
      {recipe.favorite ? (
        <FavoriteRoundedIcon
          sx={{
            position: 'absolute',
            top: 8,
            insetInlineEnd: 8,
            color: '#E25D3D',
            fontSize: 20,
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.25))',
          }}
        />
      ) : null}
    </Card>
  );
}
