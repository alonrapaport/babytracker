import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useI18n } from '../i18n';
import { useApp } from '../context/AppContext';
import * as db from '../lib/db';

export default function LanguageToggle() {
  const { lang, setLang } = useI18n();
  const { uid } = useApp();

  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={lang}
      onChange={(_e, v) => {
        if (!v) return;
        setLang(v);
        if (uid) db.updateProfile(uid, { language: v });
      }}
    >
      <ToggleButton value="he">עברית</ToggleButton>
      <ToggleButton value="en">English</ToggleButton>
    </ToggleButtonGroup>
  );
}
