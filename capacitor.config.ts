import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.brandfox.app',
  appName: 'BrandFox',
  webDir: 'out',
  server: {
    url: 'https://www.bfox.pro',
    cleartext: false,
    androidScheme: 'https',
    allowNavigation: [
      '*.bfox.pro',
      '*.google.com',
      '*.googleapis.com',
      'accounts.google.com',
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#120B07',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#120B07',
    },
  },
};

export default config;
