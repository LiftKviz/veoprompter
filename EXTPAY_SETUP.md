# ExtPay Integration Setup Guide

This guide explains how to configure ExtPay for monetizing the Veo 3 Prompt Assistant Chrome Extension.

## Overview

ExtPay has been integrated to provide:
- **Premium Features**: AI prompt modification and unlimited saves
- **Usage Limits**: 3 AI modifications/day and 10 saved prompts for free users
- **Subscription Management**: Automatic payment processing via Stripe
- **Feature Gates**: Seamless upgrade prompts throughout the UI

## 🔧 Setup Steps

### 1. Register Your Extension

1. Go to [ExtensionPay.com](https://extensionpay.com)
2. Sign up and create a new extension
3. Note your **Extension ID** (e.g., `veo-3-prompt-assistant`)

### 2. Update Extension ID

Replace the placeholder in `src/services/paymentService.ts`:

```typescript
private readonly EXTENSION_ID = 'your-actual-extension-id-here';
```

### 3. Configure Payment Plans

Create plans on ExtensionPay dashboard:

#### Recommended Plans:
- **Premium Monthly**: $4.99/month
  - Unlimited AI modifications
  - Unlimited saved prompts
  - Priority support
  
- **Premium Yearly**: $49.99/year (17% savings)
  - All monthly features
  - Best value option

### 4. Chrome Web Store Setup

Add ExtPay domain to your extension's manifest permissions:
- ✅ Already added: `https://extensionpay.com/*`

### 5. Test Payment Flow

1. Build the extension: `npm run build`
2. Load the extension in Chrome
3. Try accessing premium features
4. Verify payment page opens correctly

## 💳 Payment Features Implemented

### Feature Gates

The following features are now gated behind premium subscriptions:

| Feature | Free Users | Premium Users |
|---------|------------|---------------|
| AI Prompt Modification | 3/day | Unlimited |
| Saved Prompts | 10 total | Unlimited |
| Advanced Search | ✅ Free | ✅ Included |
| Custom Categories | ❌ Premium Only | ✅ Included |

### Usage Tracking

- Daily limits reset at midnight
- Storage managed via Chrome Storage API
- Real-time usage counters in UI

### UI Components

1. **Subscription Status Banner**: Shows current plan and usage
2. **Payment Gates**: Graceful premium feature blocking
3. **Upgrade Prompts**: Context-aware upgrade suggestions

## 🎨 User Experience

### Free User Flow:
1. Use basic features normally
2. Hit usage limits with clear messaging
3. See premium feature previews (disabled buttons)
4. Click upgrade → ExtPay payment page

### Premium User Flow:
1. All features unlocked immediately
2. Usage counters show "unlimited"
3. Premium badge in status banner
4. Manage subscription via ExtPay

## 🔐 Security & Privacy

- API keys remain client-side encrypted
- No payment data stored in extension
- ExtPay handles all payment processing
- Subscription status cached locally

## 📊 Analytics & Monitoring

ExtPay provides dashboard analytics for:
- Conversion rates
- User acquisition costs
- Churn analysis
- Revenue tracking

## 🛠️ Development Testing

### Test Different User States:

```javascript
// In browser console (for testing):

// Simulate free user at limit
chrome.storage.local.set({
  'usage_gpt_modification_' + new Date().toDateString(): 3
});

// Clear usage for testing
chrome.storage.local.clear();
```

### Debug Payment Service:

```javascript
// Test payment service methods
paymentService.getUser().then(console.log);
paymentService.isPremiumUser().then(console.log);
paymentService.getRemainingUsage('gpt_modification').then(console.log);
```

## 🚀 Deployment Checklist

- [ ] Update Extension ID in paymentService.ts
- [ ] Configure payment plans on ExtensionPay.com
- [ ] Test payment flow end-to-end
- [ ] Verify feature gates work correctly
- [ ] Test usage limit enforcement
- [ ] Update Chrome Web Store listing with pricing info
- [ ] Monitor conversion rates post-launch

## 💰 Revenue Optimization Tips

1. **Free Trial Value**: Let users experience AI modifications before limiting
2. **Strategic Limits**: Current limits (3/day, 10 saves) encourage upgrades without being too restrictive
3. **Clear Value Prop**: Premium features are clearly marked and explained
4. **Smooth Upgrade**: One-click upgrade flow reduces friction

## 🐛 Troubleshooting

### Common Issues:

1. **Extension ID not found**: Update the ID in paymentService.ts
2. **Payment page won't open**: Check host permissions in manifest.json
3. **Usage tracking fails**: Verify Chrome Storage API permissions
4. **Features not unlocking**: Check ExtPay webhook configuration

### Debug Commands:

```bash
# Build and test
npm run build

# Check bundle includes ExtPay
npm list extpay

# Type checking
npm run typecheck
```

## 📈 Next Steps

After successful integration:

1. Monitor user feedback on pricing
2. A/B test different upgrade prompts
3. Consider usage analytics integration
4. Implement referral programs
5. Add more premium features based on user requests

---

For support, contact:
- ExtPay: [support@extensionpay.com](mailto:support@extensionpay.com)
- Extension issues: Create GitHub issue