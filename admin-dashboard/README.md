# Veo 3 Prompt Assistant - Admin Dashboard

This is the admin dashboard for managing prompts in the Veo 3 Prompt Assistant Chrome extension.

## Features

- **Add Prompts**: Create new prompts with custom fields
- **Edit Prompts**: Modify existing prompts with live preview
- **Delete Prompts**: Remove prompts with confirmation
- **Import/Export**: Bulk import/export functionality
- **Categories**: Organize prompts by category
- **Real-time Sync**: Changes appear instantly in all extensions

## Deployment

This dashboard is configured for Netlify deployment with:
- Proper headers for Firebase/Google APIs
- Security policies (CSP, XSS protection)
- Automatic redirects

### Deploy to Netlify

1. **Manual Deploy**: Drag the `admin-dashboard` folder to [Netlify](https://netlify.com)
2. **Git Deploy**: Connect your repository for automatic deployments

### Firebase Configuration

Before deployment, ensure `firebase-init.js` contains your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... other config
};
```

### Security

- Only authorized admin emails can edit prompts (configured in Firestore rules)
- All changes require Google authentication
- HTTPS enforced by Netlify
- Content Security Policy headers configured

## Files

- `index.html` - Main admin interface
- `admin.js` - Admin functionality
- `firebase-init.js` - Firebase configuration
- `prompts-data.js` - Prompt data for import
- `_headers` - Netlify headers configuration

## Usage

1. Sign in with Google (must be configured as admin in Firestore rules)
2. Add, edit, or delete prompts
3. Changes sync automatically to all extension users
4. Export data for backups