import { useEffect, useState } from 'react';
import { Avatar } from '@mui/material';
import ChildCareRoundedIcon from '@mui/icons-material/ChildCareRounded';
import { signedPhotoUrl } from '../lib/db';
import type { Baby } from '../lib/types';

export default function BabyAvatar({ baby, size = 56 }: { baby: Baby | null; size?: number }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (baby?.photo_path) {
      signedPhotoUrl(baby.photo_path).then((u) => alive && setUrl(u));
    } else {
      setUrl(null);
    }
    return () => {
      alive = false;
    };
  }, [baby?.photo_path]);

  return (
    <Avatar src={url ?? undefined} sx={{ width: size, height: size, bgcolor: '#DCEAF4', color: '#3E6A86' }}>
      <ChildCareRoundedIcon sx={{ fontSize: size * 0.6 }} />
    </Avatar>
  );
}
