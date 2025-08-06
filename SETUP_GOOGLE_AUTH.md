# Setup Google Authentication - Step by Step

## 🚀 Quick Setup Guide

Follow these steps to enable real Google authentication:

### Step 1: Get Your Extension ID

1. Go to `chrome://extensions/`
2. Make sure **Developer mode** is ON (top right)
3. Click **"Load unpacked"** and select your `dist` folder
4. **Copy the Extension ID** (long string like `abcdefghijklmnopqrstuvwxyzabcdef`)

### Step 2: Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **`videoprompter-d6a18`**
3. Navigate to **APIs & Services** → **Credentials**
4. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
5. Choose **"Chrome extension"** as application type
6. **Enter your Extension ID** from Step 1
7. Click **"Create"**
8. **Copy the Client ID** (format: `123456789-abc123.apps.googleusercontent.com`)

### Step 3: Update Extension Configuration

Edit `dist/manifest.json` and replace the placeholder:

```json
"oauth2": {
  "client_id": "YOUR_ACTUAL_CLIENT_ID_HERE.apps.googleusercontent.com",
  "scopes": [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
  ]
}
```

### Step 4: Enable Required APIs

In Google Cloud Console, go to **APIs & Services** → **Library** and enable:
- **Google Identity Toolkit API**
- **Google+ API** (for user info)

### Step 5: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **"External"** user type
3. Fill required fields:
   - **App name**: Veo 3 Prompt Assistant
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
5. Add test users (your Gmail address)

### Step 6: Switch to Google Auth

Update `dist/popup.html`:
```html
<!-- Change this line -->
<script src="auth-final.js"></script>
<!-- To this -->
<script src="auth-google.js"></script>
```

### Step 7: Test Google Sign-In

1. **Reload the extension** in Chrome
2. **Open the extension popup**
3. **Click "🔑 Sign in with Google"**
4. **Complete Google OAuth flow**
5. **See your real Google profile** appear

## 🔧 Troubleshooting

### Error: "OAuth2 not granted"
- **Solution**: Complete OAuth consent screen setup
- **Check**: Client ID is correct in manifest.json

### Error: "invalid_client"
- **Solution**: Extension ID doesn't match OAuth client
- **Fix**: Recreate OAuth client with correct Extension ID

### No popup appears
- **Solution**: Check popup blockers
- **Alternative**: Use incognito mode for testing

### Error: "Access blocked"
- **Solution**: Add your email as test user in OAuth consent screen

## 🎯 Expected Results

**After successful setup:**
- Button shows "🔑 Sign in with Google"
- Clicking opens Google OAuth popup
- Your real Google profile picture appears
- Your real name shows in the header
- Sign out clears Google session

## 📱 Current Status Check

Run this in browser console to check current config:
```javascript
// Check if Chrome Identity API is available
chrome.identity

// Check current manifest OAuth config
chrome.runtime.getManifest().oauth2

// Test auth module
window.authModule
```

## 🚨 Important Notes

- **OAuth client must match Extension ID exactly**
- **Test users required for external OAuth consent**
- **Reload extension after changing manifest.json**
- **Clear browser cache if issues persist**

Once you complete these steps, you'll have real Google authentication working! 🎉