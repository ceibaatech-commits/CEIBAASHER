# Google OAuth Setup Guide for Ceibaa

## Current Error
You're seeing **"Error 401: invalid_client"** because Google OAuth credentials haven't been configured yet.

## Step-by-Step Setup Instructions

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account

### Step 2: Create or Select a Project
1. Click on the project dropdown at the top
2. Click **"NEW PROJECT"** or select an existing project
3. If creating new:
   - Project name: **Ceibaa** (or any name you prefer)
   - Click **"CREATE"**

### Step 3: Enable Google+ API (Required for OAuth)
1. In the left sidebar, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** or **"Google Identity Services"**
3. Click on it and press **"ENABLE"**

### Step 4: Configure OAuth Consent Screen
1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** (unless you have a Google Workspace)
3. Click **"CREATE"**
4. Fill in required fields:
   - **App name**: Ceibaa
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click **"SAVE AND CONTINUE"**
6. **Scopes**: Click "SAVE AND CONTINUE" (default scopes are fine)
7. **Test users**: Add your email for testing
8. Click **"SAVE AND CONTINUE"**

### Step 5: Create OAuth 2.0 Credentials
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: **Ceibaa Web Client**
5. **Authorized JavaScript origins**: Add
   ```
   https://solo-quiz-app.preview.emergentagent.com
   ```
6. **Authorized redirect URIs**: Add
   ```
   https://solo-quiz-app.preview.emergentagent.com/api/auth/google/callback
   ```
7. Click **"CREATE"**
8. **IMPORTANT**: Copy the **Client ID** and **Client secret** that appear

### Step 6: Update Backend .env File
1. Open `/app/backend/.env`
2. Replace the placeholder values:
   ```env
   GOOGLE_CLIENT_ID="paste_your_client_id_here"
   GOOGLE_CLIENT_SECRET="paste_your_client_secret_here"
   ```
3. Save the file

### Step 7: Restart Backend
Run this command:
```bash
sudo supervisorctl restart backend
```

### Step 8: Test Google Login
1. Go to https://solo-quiz-app.preview.emergentagent.com/login
2. Click **"Continue with Google"**
3. You should see Google's login/consent screen
4. After signing in, you'll be redirected to your social feed
5. You should stay logged in! ✅

## Example .env Configuration

After obtaining credentials, your .env should look like this:

```env
# Google OAuth
GOOGLE_CLIENT_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abcdefghijklmnopqrstuvwxyz"
GOOGLE_CALLBACK_URL="https://solo-quiz-app.preview.emergentagent.com/api/auth/google/callback"
```

## Troubleshooting

### Error 401: invalid_client
- ✅ Make sure you copied the Client ID and Secret correctly
- ✅ Check there are no extra spaces or quotes
- ✅ Restart the backend after updating .env

### Error 400: redirect_uri_mismatch
- ✅ Make sure the redirect URI in Google Console matches exactly:
  `https://solo-quiz-app.preview.emergentagent.com/api/auth/google/callback`
- ✅ No trailing slashes
- ✅ Must include https://

### "Access blocked: This app's request is invalid"
- ✅ Make sure OAuth consent screen is configured
- ✅ Add your email to test users
- ✅ App doesn't need to be verified for testing

## Security Notes

🔒 **Keep your credentials secure**:
- Never commit .env file to public repositories
- Never share Client Secret publicly
- Use different credentials for production

## Testing Checklist

After setup, verify:
- ✅ Click "Continue with Google" button
- ✅ Google login screen appears
- ✅ After login, redirected to social feed
- ✅ User data visible (name, email, profile picture)
- ✅ Can create posts and interact
- ✅ Refresh page - still logged in
- ✅ No more "Login to Continue" loop

## Need Help?

If you encounter issues:
1. Check backend logs: `tail -f /var/log/supervisor/backend.err.log`
2. Check browser console for errors
3. Verify all steps above were completed
4. Make sure backend was restarted after .env changes

---

**Once configured, Google OAuth will work seamlessly!** 🎉
