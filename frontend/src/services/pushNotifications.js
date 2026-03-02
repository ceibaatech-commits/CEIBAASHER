/**
 * Push Notification Service for Capacitor Android App
 * Handles FCM token registration and notification listeners
 */
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const initPushNotifications = async (userId) => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Push notifications only work on native platforms');
    return;
  }

  try {
    // Request permission
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') {
      console.warn('Push notification permission not granted');
      return;
    }

    // Register with FCM
    await PushNotifications.register();

    // Listen for registration success
    PushNotifications.addListener('registration', async (token) => {
      console.log('FCM Token:', token.value);
      
      // Send token to backend
      try {
        await fetch(`${API_URL}/api/push/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            fcm_token: token.value,
            device_info: `${Capacitor.getPlatform()} - Ceibaa App`
          })
        });
      } catch (err) {
        console.error('Failed to register token with backend:', err);
      }
    });

    // Listen for registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    // Listen for push notifications received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
    });

    // Listen for push notification tapped (app opened from notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action:', notification);
      const data = notification.notification.data;
      
      // Handle navigation based on notification data
      if (data?.route) {
        window.location.href = data.route;
      }
    });

  } catch (error) {
    console.error('Push notification init error:', error);
  }
};

export const removePushListeners = async () => {
  if (!Capacitor.isNativePlatform()) return;
  await PushNotifications.removeAllListeners();
};
