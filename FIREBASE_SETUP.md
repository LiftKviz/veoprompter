# Firebase Setup Guide for Veo 3 Prompt Assistant

This guide will help you set up Firebase for global prompt management.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `veo3-prompt-assistant`
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Google** sign-in provider
3. Add your domain (e.g., `your-domain.com`) to authorized domains
4. Add `localhost` for local testing

## Step 3: Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose "Start in production mode"
4. Select your preferred location
5. Click "Done"

## Step 4: Set Up Security Rules

1. In Firestore, go to **Rules** tab
2. Replace the default rules with the content from `firestore.rules`
3. Update the admin email addresses in the rules:
   ```javascript
   && request.auth.token.email in [
     'your-admin-email@gmail.com',  // Replace with your email
     'another-admin@gmail.com'       // Add more admin emails
   ];
   ```
4. Click "Publish"

## Step 5: Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" > Web app icon (</>)
4. Enter app nickname: `veo3-extension`
5. Don't enable hosting
6. Copy the configuration object

## Step 6: Update Configuration Files

### Update Extension Config (`src/firebase-config.js`):
```javascript
export const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### Update Admin Dashboard (`admin-dashboard/admin.js`):
```javascript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## Step 7: Build and Test

1. Build the Firebase service:
   ```bash
   node build-firebase.js
   ```

2. Test the extension locally:
   - Load the extension in Chrome
   - It should automatically try to connect to Firebase
   - If no Firebase config, it falls back to local prompts.txt

3. Test the admin dashboard:
   - Open `admin-dashboard/index.html` in your browser
   - Sign in with your Google account
   - Add/edit/delete prompts

## Step 8: Import Existing Prompts

1. Open the admin dashboard
2. Sign in as admin
3. Click "Import" button
4. Upload a JSON file with your prompts in this format:
   ```json
   {
     "version": "1.0",
     "prompts": [
       {
         "category": "ads",
         "title": "Product Launch Teaser",
         "prompt": "Your prompt content here...",
         "youtubeLink": "https://youtube.com/watch?v=...",
         "order": 1
       }
     ]
   }
   ```

## Step 9: Deploy Admin Dashboard (Optional)

### Option A: Firebase Hosting
```bash
cd admin-dashboard
firebase init hosting
firebase deploy
```

### Option B: Netlify
1. Drag the `admin-dashboard` folder to [Netlify](https://app.netlify.com/)
2. Your dashboard will be live at the provided URL

### Option C: GitHub Pages
1. Push `admin-dashboard` folder to a GitHub repo
2. Enable GitHub Pages in repo settings

## How It Works

### For Extension Users:
- Extension automatically connects to Firebase
- Gets real-time prompt updates
- Falls back to local prompts if Firebase unavailable
- Caches prompts locally for offline use

### For Admins:
- Use web dashboard to manage prompts
- Changes are instantly synced to all users
- Full CRUD operations (Create, Read, Update, Delete)
- Export/import functionality for backups

## Security Features

- **Public Read**: Anyone can view prompts (for extension users)
- **Admin Write**: Only specified admin emails can modify prompts
- **Real-time Sync**: Changes appear instantly across all users
- **Offline Support**: Extension works even without internet

## Troubleshooting

### Extension doesn't connect to Firebase:
1. Check if `firebase-config.js` has correct credentials
2. Verify Firebase project is active
3. Check browser console for errors

### Admin dashboard authentication fails:
1. Ensure your email is in the Firestore rules
2. Check if Google sign-in is enabled
3. Verify domain is in authorized domains

### Prompts don't sync:
1. Check Firestore security rules
2. Ensure internet connection
3. Look for quota limits in Firebase console

## Going Live

1. Update Firebase config in both files
2. Build extension: `node build-firebase.js`
3. Test thoroughly
4. Submit extension to Chrome Web Store
5. Deploy admin dashboard to your preferred hosting

Your users will now automatically receive prompt updates without needing to update the extension!