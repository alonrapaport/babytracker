import type { ReactNode } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';

export default function AppHeader({
  title,
  back,
  actions,
}: {
  title: string;
  back?: boolean | string;
  actions?: ReactNode;
}) {
  const navigate = useNavigate();
  const { dir } = useI18n();
  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1050,
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        pt: 'calc(env(safe-area-inset-top) + 10px)',
        pb: 1,
      }}
    >
      {back ? (
        <IconButton edge="start" onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}>
          <ArrowBackRoundedIcon sx={{ transform: dir === 'rtl' ? 'scaleX(-1)' : 'none' }} />
        </IconButton>
      ) : null}
      <Typography variant="h5" sx={{ flex: 1, fontWeight: 600 }} noWrap>
        {title}
      </Typography>
      {actions}
    </Box>
  );
}
