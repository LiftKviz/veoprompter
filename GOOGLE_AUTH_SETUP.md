# Google Authentication Setup for Veo 3 Chrome Extension

## Prerequisites
- Google Cloud Console account
- Chrome Extension ID (get this after loading the extension in Chrome)

## Setup Steps

### 1. Get Your Chrome Extension ID
1. Load the extension in Chrome (chrome://extensions/)
2. Enable Developer mode
3. Load unpacked extension from the `dist` folder
4. Copy the Extension ID shown under your extension

### 2. Create OAuth 2.0 Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
5. Select **Chrome Extension** as the Application type
6. Enter your Extension ID from step 1
7. Add authorized JavaScript origins:
   - `chrome-extension://YOUR_EXTENSION_ID`
8. Click **Create**

### 3. Update Extension Configuration

1. Copy the Client ID from the OAuth 2.0 credentials
2. Update `manifest.json` oauth2 section:
```json
"oauth2": {
  "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
  "scopes": [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
  ]
}
```

### 4. Enable Required APIs

In Google Cloud Console, enable these APIs:
- Google Identity Toolkit API
- Google+ API (for user info)

### 5. Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** user type
3. Fill in required fields:
   - App name: Veo 3 Prompt Assistant
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
5. Add test users if in testing mode

## Testing

1. Reload the extension in Chrome
2. Click the extension icon
3. Click "Sign In" button
4. Complete Google authentication
5. User avatar should appear in the header

## Troubleshooting

### "Invalid Client" Error
- Ensure the Extension ID in Google Cloud matches your actual extension ID
- Wait a few minutes for OAuth client to propagate

### "Unauthorized" Error
- Check that all required APIs are enabled
- Verify OAuth consent screen is configured

### No Response on Sign In
- Check browser console for errors
- Ensure manifest.json has correct client_id
- Verify extension has "identity" permission

## Security Notes

- The OAuth token is stored in Chrome's secure storage
- Tokens are automatically refreshed by Chrome
- User data is stored locally in the extension
- No sensitive data is sent to external servers