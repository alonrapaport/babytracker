import type { ReactNode } from 'react';
import { Box, Dialog, IconButton, Slide, Typography, Button } from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import { forwardRef } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useI18n } from '../i18n';
import { accents } from '../theme';

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// A Material bottom-sheet style fullscreen dialog with a colored header.
export default function SheetShell({
  open,
  onClose,
  title,
  color = accents.cream,
  onSave,
  saveDisabled,
  saveLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  color?: string;
  onSave?: () => void;
  saveDisabled?: boolean;
  saveLabel?: string;
  children: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      TransitionComponent={Transition}
      PaperProps={{ sx: { bgcolor: 'background.default', maxWidth: 520, mx: 'auto', width: '100%' } }}
    >
      <Box
        sx={{
          bgcolor: color,
          color: '#2B2520',
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 5,
        }}
      >
        <IconButton onClick={onClose} sx={{ color: '#2B2520' }}>
          <CloseRoundedIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600, mx: 1, flex: 1, textAlign: 'center' }} noWrap>
          {title}
        </Typography>
        {onSave ? (
          <Button onClick={onSave} disabled={saveDisabled} sx={{ color: accents.terracotta, fontWeight: 700 }}>
            {saveLabel ?? t('save')}
          </Button>
        ) : (
          <Box sx={{ width: 56 }} />
        )}
      </Box>
      <Box sx={{ p: 2, pb: 8, overflowY: 'auto' }}>{children}</Box>
    </Dialog>
  );
}
