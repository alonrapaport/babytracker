import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import type { Recipe } from '../lib/types';
import { photoUrl } from '../lib/db';

// Deterministic placeholder: two-tone gradient + a large emoji chosen by tag,
// so the demo looks alive with zero network access.

const TAG_EMOJI: [string, string][] = [
  ['breakfast', '🍳'],
  ['dessert', '🍪'],
  ['baking', '🥧'],
  ['soup', '🍲'],
  ['salad', '🥗'],
  ['italian', '🍝'],
  ['dinner', '🍽️'],
  ['vegan', '🥬'],
  ['israeli', '🥙'],
];

const GRADIENTS = [
  ['#F6E7D8', '#EFCDB4'],
  ['#E3EDDC', '#C8DCC4'],
  ['#FBE3DC', '#F3C6B8'],
  ['#E0EEF4', '#C2DBE6'],
  ['#F7E6D0', '#EDD0A9'],
  ['#EAE8EF', '#D2CEE0'],
];

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function emojiFor(recipe: Pick<Recipe, 'tags' | 'title'>): string {
  for (const [tag, emoji] of TAG_EMOJI) {
    if (recipe.tags.includes(tag)) return emoji;
  }
  return '🍽️';
}

export default function RecipePhoto({
  recipe,
  height = 150,
  rounded = false,
  emojiSize = 54,
}: {
  recipe: Pick<Recipe, 'image_path' | 'image_url' | 'tags' | 'title'>;
  height?: number | string;
  rounded?: boolean;
  emojiSize?: number;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const ref = recipe.image_path || recipe.image_url;

  useEffect(() => {
    let alive = true;
    setFailed(false);
    setSrc(null);
    if (!ref) return;
    photoUrl(ref).then((url) => {
      if (alive) setSrc(url);
    });
    return () => {
      alive = false;
    };
  }, [ref]);

  const [c1, c2] = GRADIENTS[hashCode(recipe.title) % GRADIENTS.length];

  if (src && !failed) {
    return (
      <Box
        component="img"
        src={src}
        alt={recipe.title}
        onError={() => setFailed(true)}
        sx={{
          width: '100%',
          height,
          objectFit: 'cover',
          display: 'block',
          borderRadius: rounded ? '22px' : 0,
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        borderRadius: rounded ? '22px' : 0,
      }}
    >
      <Typography component="span" sx={{ fontSize: emojiSize, lineHeight: 1 }}>
        {emojiFor(recipe)}
      </Typography>
    </Box>
  );
}
