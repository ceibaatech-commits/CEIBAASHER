import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'in.ceibaa.app',
  appName: 'Ceibaa',
  webDir: 'build',
  server: {
    url: 'https://ceibaa.in',
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      showSpinner: false,
      splashImmersive: true,
      splashFullScreen: true
    },
    StatusBar: {
      backgroundColor: '#0f172a',
      style: 'DARK'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;
