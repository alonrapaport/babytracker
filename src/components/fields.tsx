import type { ReactNode } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { toLocalInputValue, fromLocalInputValue } from '../lib/format';

export function Row({
  label,
  children,
  onClick,
}: {
  label: string;
  children?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        py: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <Typography sx={{ fontSize: 18 }}>{label}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{children}</Box>
    </Box>
  );
}

export function TimeRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date;
  onChange: (d: Date) => void;
}) {
  return (
    <Row label={label}>
      <TextField
        type="datetime-local"
        size="small"
        variant="standard"
        value={toLocalInputValue(value)}
        onChange={(e) => onChange(fromLocalInputValue(e.target.value))}
        InputProps={{ disableUnderline: true }}
        sx={{ '& input': { textAlign: 'end', fontSize: 16 } }}
      />
    </Row>
  );
}

export function NotesField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <TextField
      label={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      multiline
      minRows={2}
      fullWidth
      sx={{ mt: 2 }}
    />
  );
}
