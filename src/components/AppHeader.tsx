import type { ReactNode } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import BabyAvatar from './BabyAvatar';

const dayName = (d: Date, lang: string) =>
  d.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

export default function AppHeader({ actions }: { actions?: ReactNode }) {
  const { activeBaby } = useApp();
  const { lang } = useI18n();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, pt: 'calc(env(safe-area-inset-top) + 12px)', pb: 1.5 }}>
      <BabyAvatar baby={activeBaby} size={56} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h4" noWrap sx={{ lineHeight: 1.1 }}>
          {activeBaby?.name ?? ''}
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: 14 }}>
          {dayName(new Date(), lang)}
        </Typography>
      </Box>
      {actions}
    </Box>
  );
}

export function HeaderIcon({ onClick, children }: { onClick?: () => void; children: ReactNode }) {
  return (
    <IconButton
      onClick={onClick}
      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, width: 44, height: 40 }}
    >
      {children}
    </IconButton>
  );
}
