import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import StarsRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import { useI18n } from '../i18n';

const tabs = [
  { path: '/', key: 'nav_activity', Icon: StarsRoundedIcon },
  { path: '/history', key: 'nav_history', Icon: CalendarMonthRoundedIcon },
  { path: '/trends', key: 'nav_trends', Icon: TrendingUpRoundedIcon },
  { path: '/shop', key: 'nav_shop', Icon: StorefrontRoundedIcon },
  { path: '/account', key: 'nav_account', Icon: FavoriteBorderRoundedIcon },
] as const;

export default function TabBar() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const current = tabs.findIndex((x) => x.path === location.pathname);

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        maxWidth: 520,
        mx: 'auto',
        borderTop: '1px solid',
        borderColor: 'divider',
        zIndex: 1100,
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <BottomNavigation
        showLabels
        value={current === -1 ? 0 : current}
        onChange={(_e, v) => navigate(tabs[v].path)}
      >
        {tabs.map(({ key, Icon }) => (
          <BottomNavigationAction key={key} label={t(key)} icon={<Icon />} />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
