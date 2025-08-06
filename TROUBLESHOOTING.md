# Authentication Troubleshooting Guide

## Issue: Sign In Button Does Nothing

The most likely cause is missing OAuth configuration. Here's how to fix it:

### Quick Test (No OAuth Setup Required)

I've created a simple test version that doesn't require OAuth setup:

1. **Reload the extension** in Chrome (`chrome://extensions/` → click refresh button)
2. **Open the extension** popup
3. **Open browser console** (F12 → Console tab)
4. **Click the Sign In button**
5. **Check console for messages** like "SimpleAuthModule: Sign in button clicked"

This version will create a mock user to test the UI flow.

### Full OAuth Setup (For Production)

#### Step 1: Get Extension ID
1. Go to `chrome://extensions/`
2. Enable Developer mode
3. Your extension ID will be shown (32-character string)

#### Step 2: Create OAuth Client
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `videoprompter-d6a18`
3. Go to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Choose **Chrome Extension**
6. Enter your Extension ID from Step 1
7. Copy the generated Client ID

#### Step 3: Update Manifest
Replace the client_id in `dist/manifest.json`:
```json
"oauth2": {
  "client_id": "YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com",
  "scopes": [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
  ]
}
```

#### Step 4: Switch Back to Real Auth
Update `dist/popup.html`:
```html
<!-- Change this line -->
<script src="auth-module-simple.js"></script>
<!-- Back to -->
<script src="auth-module.js"></script>
```

### Common Error Messages

#### Console: "Chrome Identity API not available"
- **Cause**: Missing `identity` permission
- **Fix**: Check `manifest.json` has `"identity"` in permissions array

#### Console: "Invalid client"
- **Cause**: Wrong Extension ID or Client ID
- **Fix**: Double-check both IDs match exactly

#### Console: "Sign in button clicked" but nothing happens
- **Cause**: OAuth not configured
- **Fix**: Complete OAuth setup steps above

#### No console messages at all
- **Cause**: Script not loading or DOM not ready
- **Fix**: Check all scripts are loading in Network tab

### Debug Steps

1. **Check Extension Loaded**
   - Go to `chrome://extensions/`
   - Ensure extension is enabled
   - Check for any error messages

2. **Check Console Logs**
   - Open extension popup
   - Press F12 → Console tab
   - Look for "SimpleAuthModule" or "AuthModule" messages

3. **Check Network Tab**
   - Open F12 → Network tab
   - Reload extension popup
   - Ensure all JS files load successfully

4. **Check Storage**
   - F12 → Application tab → Storage → Extension
   - Look for any stored user data

### Test Checklist

- [ ] Extension loads without errors
- [ ] Sign In button appears in header
- [ ] Button click shows console message
- [ ] Mock user gets created (simple version)
- [ ] User avatar appears after sign in
- [ ] Sign out button works
- [ ] User data persists after popup close/reopen

### Need Help?

If the simple test version doesn't work, there may be a more fundamental issue. Check:

1. All script files exist in the `dist` folder
2. No JavaScript errors in console
3. Extension permissions are correct
4. Chrome version is recent (supports Manifest V3)