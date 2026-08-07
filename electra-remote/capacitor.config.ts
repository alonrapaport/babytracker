import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.electra.acremote',
  appName: 'Electra AC Remote',
  webDir: 'dist',
  backgroundColor: '#0b1120',
  android: {
    // The remote is a single fixed-size panel; letting it stretch looks wrong.
    backgroundColor: '#0b1120',
  },
};

export default config;
