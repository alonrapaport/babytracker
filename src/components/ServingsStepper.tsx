import { Box, IconButton, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import { formatQty } from '../lib/scale';

export default function ServingsStepper({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label?: string;
}) {
  const dec = () => onChange(Math.max(value > 1 ? value - 1 : value / 2, 0.5));
  const inc = () => onChange(value < 1 ? value * 2 : value + 1);
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        bgcolor: 'action.hover',
        borderRadius: 999,
        px: 0.5,
      }}
    >
      <IconButton size="small" onClick={dec} aria-label="decrease">
        <RemoveRoundedIcon fontSize="small" />
      </IconButton>
      <Typography sx={{ minWidth: 54, textAlign: 'center', fontWeight: 700 }}>
        {formatQty(value)}
        {label ? ` ${label}` : ''}
      </Typography>
      <IconButton size="small" onClick={inc} aria-label="increase">
        <AddRoundedIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
