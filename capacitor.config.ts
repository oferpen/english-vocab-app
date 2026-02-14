import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.oferp.englishpath',
  appName: 'English Path',
  webDir: 'out', // Will be used for static export, or use server URL
  server: {
    // Use production URL for iOS app
    url: 'https://www.englishpath.xyz',
    androidScheme: 'https',
    iosScheme: 'https',
    // For local development, uncomment:
    // url: 'http://localhost:3000',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#3b82f6',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
};

export default config;
