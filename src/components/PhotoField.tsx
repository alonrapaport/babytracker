import { useRef } from 'react';
import { Box, Button, IconButton } from '@mui/material';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';

// Picks an image, downscales it to <=1024px JPEG and hands back a dataURL
// (kept inline in demo mode; uploaded to Supabase Storage on save otherwise).

async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const max = 1024;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.82);
}

export default function PhotoField({
  value,
  onChange,
  label,
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Box>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) onChange(await fileToDataUrl(file));
          e.target.value = '';
        }}
      />
      {value ? (
        <Box sx={{ position: 'relative' }}>
          <Box component="img" src={value} alt="" sx={{ width: '100%', borderRadius: '16px', display: 'block' }} />
          <IconButton
            size="small"
            onClick={() => onChange(null)}
            sx={{ position: 'absolute', top: 8, insetInlineEnd: 8, bgcolor: 'rgba(255,255,255,.85)' }}
          >
            <DeleteRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Button
          variant="outlined"
          startIcon={<PhotoCameraRoundedIcon />}
          onClick={() => inputRef.current?.click()}
          fullWidth
        >
          {label}
        </Button>
      )}
    </Box>
  );
}
