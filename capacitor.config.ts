import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bat.narababy',
  appName: 'Nara Baby',
  webDir: 'dist',
  backgroundColor: '#1e2330',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#E8632A',
    },
  },
};

export default config;
