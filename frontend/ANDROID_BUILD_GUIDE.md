# Ceibaa Android App - Build & Publish Guide

## Overview
The Ceibaa Android app is built using **Capacitor 6**, wrapping the production web app (`https://ceibaa.in`) in a native Android container with push notification support via Firebase Cloud Messaging (FCM).

---

## Prerequisites (On Your Local Machine)

1. **Android Studio** (Hedgehog 2023.1.1 or later)
   - Download: https://developer.android.com/studio
2. **JDK 17** (bundled with Android Studio)
3. **Node.js 18+** and **npm/yarn**
4. **Android SDK** (API Level 23+ for minimum, 34+ for target)
   - Install via Android Studio > Settings > SDK Manager

---

## Project Structure

```
frontend/
├── capacitor.config.ts      # Capacitor configuration
├── android/                  # Native Android project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── res/
│   │   │   │   ├── mipmap-*/ic_launcher.png     # App icons (all densities)
│   │   │   │   ├── drawable/splash.png          # Splash screen
│   │   │   │   └── values/colors.xml            # Theme colors
│   │   │   └── java/.../MainActivity.java
│   │   └── build.gradle
│   └── build.gradle
├── resources/
│   └── icon.png              # Source icon (1024x1024)
└── src/
    └── services/
        └── pushNotifications.js  # Push notification service
```

---

## Step 1: Clone & Setup

```bash
# After downloading code from Emergent ("Save to GitHub" → clone)
cd frontend
yarn install
```

---

## Step 2: Firebase Setup (For Push Notifications)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Add an Android app:
   - Package name: `in.ceibaa.app`
   - App nickname: `Ceibaa`
4. Download `google-services.json`
5. Place it at: `frontend/android/app/google-services.json`
6. For the backend, download the **Firebase Admin SDK** service account key:
   - Firebase Console → Project Settings → Service Accounts → Generate New Private Key
   - Save as `firebase-service-account.json` in the backend directory
   - Set env variable: `FIREBASE_CREDENTIALS_PATH=/path/to/firebase-service-account.json`

---

## Step 3: Build & Sync

```bash
cd frontend

# Build the React app
yarn build

# Sync web assets to Android project
npx cap sync android
```

---

## Step 4: Open in Android Studio

```bash
npx cap open android
```

This opens the `android/` folder in Android Studio. Wait for Gradle sync to complete.

---

## Step 5: Test on Device/Emulator

1. In Android Studio, select a device (emulator or USB-connected phone)
2. Click **Run** (green play button)
3. The app should launch, show splash screen, then load `ceibaa.in`

### Testing Push Notifications
- Test on a **physical device** (emulators may not support FCM)
- After login, the app auto-registers for push notifications
- Test sending from backend:
  ```bash
  curl -X POST https://ceibaa.in/api/push/send \
    -H "Content-Type: application/json" \
    -d '{
      "user_id": "YOUR_USER_ID",
      "title": "Test Notification",
      "body": "Hello from Ceibaa!"
    }'
  ```

---

## Step 6: Build Release APK/AAB

### Generate Signing Key (First Time Only)
```bash
keytool -genkey -v -keystore ceibaa-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias ceibaa-key \
  -storepass YOUR_STORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD
```

**IMPORTANT:** Keep this keystore file safe! You need it for every future update.

### Configure Signing in Gradle
Edit `android/app/build.gradle`, add inside `android {}`:

```groovy
signingConfigs {
    release {
        storeFile file('ceibaa-release-key.jks')
        storePassword 'YOUR_STORE_PASSWORD'
        keyAlias 'ceibaa-key'
        keyPassword 'YOUR_KEY_PASSWORD'
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### Build AAB (for Play Store)
In Android Studio: **Build → Generate Signed Bundle/APK → Android App Bundle**

Or via command line:
```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

---

## Step 7: Publish to Google Play Store

### A. Create Developer Account
1. Go to [Google Play Console](https://play.google.com/console)
2. Pay the one-time $25 registration fee
3. Complete identity verification

### B. Create App Listing
1. Click **"Create app"**
2. Fill in:
   - **App name:** Ceibaa
   - **Default language:** English
   - **App type:** App
   - **Free or Paid:** Free
   - **Category:** Education

### C. Store Listing Details
- **Short description** (80 chars): "Learn, compete & grow — exam prep made social"
- **Full description** (4000 chars): Describe all features
- **Screenshots:** At least 2 phone screenshots (1080x1920 min)
- **Feature graphic:** 1024x500 PNG/JPG
- **App icon:** 512x512 (auto-uploaded from your AAB)

### D. Content Rating
- Complete the content rating questionnaire
- Ceibaa is likely **Everyone** / **E** rated

### E. Privacy Policy
- **Required.** Host a privacy policy at `https://ceibaa.in/privacy`
- Must cover: data collection, camera/mic usage (for battles), push notifications

### F. Upload AAB
1. Go to **Production → Create new release**
2. Upload the `app-release.aab` file
3. Add release notes
4. Review and **Start rollout to Production**

### G. Review Timeline
- First submission: 1-7 days for review
- Updates: Usually 1-3 days

---

## Updating the App

After making changes to the web app at `ceibaa.in`:
- **No app update needed!** The app loads from the web URL
- App updates are only needed for:
  - Native plugin changes
  - Icon/splash screen changes
  - New Android permissions
  - Capacitor version upgrades

For native changes:
```bash
cd frontend
yarn build
npx cap sync android
# Then build and upload new AAB
```

---

## Key Configuration

| Setting | Value |
|---------|-------|
| App Name | Ceibaa |
| Package ID | in.ceibaa.app |
| Min SDK | 23 (Android 6.0) |
| Target SDK | 34 (Android 14) |
| Server URL | https://ceibaa.in |
| Splash Color | #0f172a |
| Accent Color | #6366f1 |

---

## Push Notification API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/push/register` | POST | Register device FCM token |
| `/api/push/unregister` | POST | Deactivate a token |
| `/api/push/send` | POST | Send notification to user |
| `/api/push/tokens/{user_id}` | GET | List active tokens |

---

## Troubleshooting

### App shows blank screen
- Check that `https://ceibaa.in` is accessible
- Verify `capacitor.config.ts` has correct `server.url`

### Push notifications not working
- Ensure `google-services.json` is in `android/app/`
- Test on physical device (not emulator)
- Check Firebase Console for delivery reports

### Build fails
- Run `npx cap sync android` after any web changes
- Ensure Android SDK and Gradle are up to date
- Clean build: `cd android && ./gradlew clean`
