import { Box, Chip } from '@mui/material';
import { KNOWN_TAGS } from '../data/tags';
import { useI18n, type Dict } from '../i18n';

export function useTagLabel() {
  const { t } = useI18n();
  return (tag: string) => (KNOWN_TAGS.has(tag) ? t(`tag_${tag}` as keyof Dict) : tag);
}

export default function TagChips({
  tags,
  onClick,
  selected,
  size = 'small',
}: {
  tags: string[];
  onClick?: (tag: string) => void;
  selected?: Set<string>;
  size?: 'small' | 'medium';
}) {
  const label = useTagLabel();
  if (!tags.length) return null;
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
      {tags.map((tag) => (
        <Chip
          key={tag}
          size={size}
          label={label(tag)}
          color={selected?.has(tag) ? 'primary' : 'default'}
          variant={selected?.has(tag) ? 'filled' : 'outlined'}
          onClick={onClick ? () => onClick(tag) : undefined}
        />
      ))}
    </Box>
  );
}
