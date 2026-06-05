import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useI18n } from '../i18n';
import { useApp } from '../context/AppContext';
import { updateProfile } from '../lib/db';
import type { Lang } from '../lib/types';

export default function LanguageToggle({ size = 'small' }: { size?: 'small' | 'medium' }) {
  const { lang, setLang } = useI18n();
  const { session, profile } = useApp();

  const change = async (next: Lang) => {
    if (!next || next === lang) return;
    setLang(next);
    if (session?.user?.id && profile) {
      await updateProfile(session.user.id, { language: next });
    }
  };

  return (
    <ToggleButtonGroup
      exclusive
      size={size}
      value={lang}
      onChange={(_e, v) => v && change(v as Lang)}
    >
      <ToggleButton value="he">עברית</ToggleButton>
      <ToggleButton value="en">EN</ToggleButton>
    </ToggleButtonGroup>
  );
}
