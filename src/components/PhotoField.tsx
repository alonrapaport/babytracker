import { useEffect, useRef, useState } from 'react';
import { Box, Button, IconButton } from '@mui/material';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useI18n } from '../i18n';
import { signedPhotoUrl } from '../lib/db';

// Holds a data URL for a freshly-picked image (uploaded on Save) OR shows an
// existing stored photo by its storage path.
export default function PhotoField({
  dataUrl,
  existingPath,
  onPick,
  onClear,
}: {
  dataUrl: string | null;
  existingPath?: string | null;
  onPick: (dataUrl: string) => void;
  onClear: () => void;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [existingUrl, setExistingUrl] = useState<string | null>(null);

  useEffect(() => {
    if (existingPath && !dataUrl) signedPhotoUrl(existingPath).then(setExistingUrl);
  }, [existingPath, dataUrl]);

  const preview = dataUrl || existingUrl;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onPick(reader.result as string);
    reader.readAsDataURL(file);
  }

  if (preview) {
    return (
      <Box sx={{ position: 'relative', width: 120 }}>
        <Box component="img" src={preview} sx={{ width: 120, height: 120, borderRadius: 3, objectFit: 'cover' }} />
        <IconButton
          size="small"
          onClick={onClear}
          sx={{ position: 'absolute', top: 4, insetInlineEnd: 4, bgcolor: 'rgba(0,0,0,0.5)' }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
      <Button
        variant="outlined"
        startIcon={<PhotoCameraRoundedIcon />}
        onClick={() => inputRef.current?.click()}
        sx={{ borderColor: 'divider', color: 'text.primary' }}
      >
        {t('addPhoto')}
      </Button>
    </>
  );
}
