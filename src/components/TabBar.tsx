import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { useI18n } from '../i18n';

const tabs = [
  { path: '/', key: 'nav_recipes', Icon: MenuBookRoundedIcon },
  { path: '/discover', key: 'nav_discover', Icon: TravelExploreRoundedIcon },
  { path: '/planner', key: 'nav_planner', Icon: CalendarMonthRoundedIcon },
  { path: '/grocery', key: 'nav_grocery', Icon: ShoppingCartRoundedIcon },
  { path: '/account', key: 'nav_account', Icon: PersonRoundedIcon },
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
        borderRadius: 0,
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
