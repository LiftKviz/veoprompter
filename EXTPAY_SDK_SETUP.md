# ExtPay SDK Setup Guide

## Recommended Setup: Bundle the SDK

### Step 1: Download ExtPay SDK

Download the ExtPay SDK from one of these sources:

1. **From GitHub (Recommended)**:
   ```bash
   curl -o dist/extpay.js https://raw.githubusercontent.com/Glench/ExtPay/main/dist/ExtPay.js
   ```

2. **From ExtensionPay.com**:
   - Go to https://extensionpay.com/sdk/ExtPay.js
   - Save the file as `dist/extpay.js`

3. **Via NPM (Already installed)**:
   ```bash
   cp node_modules/extpay/dist/ExtPay.js dist/extpay.js
   ```

### Step 2: Update Your HTML Files

Add ExtPay SDK before other scripts in `dist/popup.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Veo 3 Prompt Assistant</title>
    <link rel="stylesheet" href="popup.css">
</head>
<body>
    <div id="root"></div>
    
    <!-- Load ExtPay SDK first -->
    <script src="extpay.js"></script>
    
    <!-- Then load your app -->
    <script src="popup.js"></script>
</body>
</html>
```

### Step 3: Update Background Script

Create or update `dist/background.js`:

```javascript
// Import ExtPay (it's already loaded as a global)
const extpay = ExtPay('veo-3-prompter');
extpay.startBackground();

// Listen for payment events
extpay.onPaid.addListener((user) => {
    console.log('User paid:', user);
    // Notify all extension pages
    chrome.runtime.sendMessage({
        type: 'PAYMENT_STATUS_CHANGED',
        user: user
    });
});

// Your existing background code...
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        userLibrary: {
            savedPrompts: [],
            customTags: {},
            lastUpdated: new Date().toISOString()
        }
    });
});
```

## Alternative Setup: CDN (Not Recommended for Production)

If you want to test quickly, you can load from CDN (only for development):

1. Add to manifest.json permissions:
```json
"host_permissions": [
    "https://extensionpay.com/*",
    "https://raw.githubusercontent.com/*"
]
```

2. Load dynamically in background.js:
```javascript
// NOT RECOMMENDED - Just for testing
fetch('https://extensionpay.com/sdk/ExtPay.js')
    .then(response => response.text())
    .then(script => {
        eval(script); // Security risk - avoid in production
        const extpay = ExtPay('veo-3-prompter');
        extpay.startBackground();
    });
```

## Why Bundle is Recommended

1. **Security**: No external script loading, passes Chrome Web Store review
2. **Performance**: No network requests, instant loading
3. **Reliability**: Works offline, no CDN dependencies
4. **Manifest V3**: Complies with CSP restrictions

## Verification

After setup, test in the browser console:

```javascript
// In popup or background console
typeof ExtPay !== 'undefined' // Should return true
ExtPay('veo-3-prompter') // Should create extpay instance
```

## File Structure After Setup

```
dist/
├── manifest.json        # Updated with web_accessible_resources
├── extpay.js           # ExtPay SDK (bundled)
├── background.js       # Uses ExtPay
├── popup.html          # Loads extpay.js
├── popup.js            # Your app code
└── extpay-loader.js    # Helper for initialization
```

## Next Steps

1. Download ExtPay SDK to `dist/extpay.js`
2. Update `dist/popup.html` to load it
3. Test the extension
4. Configure plans on ExtensionPay.com

## Troubleshooting

- **ExtPay is not defined**: Make sure extpay.js loads before other scripts
- **CSP errors**: Use bundled version, not CDN
- **Payment not working**: Check extension ID matches ExtensionPay dashboard