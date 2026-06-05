import type { ReactNode } from 'react';
import { Box, Dialog, IconButton, Slide, Typography, Button } from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import { forwardRef } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useI18n } from '../i18n';

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// A Material bottom-sheet style dialog with a colored header (the Nara look).
export default function SheetShell({
  open,
  onClose,
  title,
  color,
  onSave,
  saveDisabled,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  color: string;
  onSave?: () => void;
  saveDisabled?: boolean;
  children: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      TransitionComponent={Transition}
      PaperProps={{ sx: { bgcolor: 'background.default', maxWidth: 520, mx: 'auto' } }}
    >
      <Box
        sx={{
          bgcolor: color,
          color: '#1c2128',
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <IconButton onClick={onClose} sx={{ color: '#1c2128' }}>
          <CloseRoundedIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
        {onSave ? (
          <Button onClick={onSave} disabled={saveDisabled} sx={{ color: '#1c2128', fontWeight: 700 }}>
            {t('save')}
          </Button>
        ) : (
          <Box sx={{ width: 56 }} />
        )}
      </Box>
      <Box sx={{ p: 2, pb: 6, overflowY: 'auto' }}>{children}</Box>
    </Dialog>
  );
}
