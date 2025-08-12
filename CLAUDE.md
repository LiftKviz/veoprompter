# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VeoPrompter is a Chrome extension for discovering, managing, and modifying prompts for Google Veo 3 (now Google Flow) video creation. It includes React-based popup UI, Firebase integration, payment processing, and AI-powered prompt modification.

## Key Commands

### Development
```bash
npm run dev           # Start webpack in watch mode for development
npm run build         # Build production-ready extension
npm run lint          # Run ESLint on TypeScript files
npm run typecheck     # Run TypeScript type checking
npm run format        # Format code with Prettier
```

### Alternative Build (for WSL compatibility)
```bash
node simple-build.js  # Basic build for WSL environments (creates dist/ folder)
```

### Testing & Loading
1. Build the extension: `npm run build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist` folder

## Architecture Overview

### Core Components

#### Extension Structure
- **Manifest V3**: Chrome extension using service workers and content scripts
- **React Popup**: Main UI in `src/popup/` using React 18 with TypeScript
- **Content Script**: Injects ✨ Improve and 🔄 Change buttons into Veo 3/Flow pages (`src/content/index.ts`)
- **Background Service Worker**: Handles API calls, message passing, and GPT service integration (`src/background/index.ts`)

#### Service Layer
- **GPT Service** (`src/services/gptService.ts`): OpenAI GPT-4o integration with SSASAC framework for prompt modification
- **Firebase Service** (`src/services/firebaseService.js`): Real-time prompt synchronization with Firestore
- **Payment Service** (`src/services/paymentService.ts`): ExtPay integration for premium subscriptions
- **Auth Service** (`src/services/authService.js`): Google OAuth authentication

#### Data Management
- **Prompts Database**: 47+ professional templates in `src/data/prompts.txt`
- **Knowledge Base**: Video production terminology in `src/data/knowledge-base.json`
- **Chrome Storage**: API keys and user preferences stored encrypted
- **Firebase Firestore**: Cloud storage for prompts and user data

### Key Features

#### Prompt Management
- SSASAC Framework: Subject, Scene, Action, Style, Audio, Camera methodology
- Categories: Ads, Storytelling, Tutorial, Vlogging, Street Interview, Tech Influencer, Mobile Game
- AI Modification: GPT-4o powered prompt enhancement with professional video production standards
- My Prompts: Personal library with cloud sync

#### Direct Veo 3/Flow Integration
- **✨ Improve Button**: Automatically enhances existing prompts with cinematic details
- **🔄 Change Button**: Opens modal for user-directed prompt modifications
- **Smart Detection**: Multiple textarea selectors for reliable button injection
- **Professional Styling**: Gradient buttons with hover effects positioned at bottom-right of textarea
- **Modal Interface**: Dark-themed change instruction modal with keyboard shortcuts (ESC to close)
- **Real-time Feedback**: Toast notifications for success/error states during AI processing

#### Security
- **API Key Encryption**: AES-GCM 256-bit encryption for stored API keys
- **CSP Compliance**: Strict Content Security Policy in manifest
- **Firebase Rules**: User data isolation and access control
- **Input Validation**: XSS protection and sanitization

#### Payment Integration
- **ExtPay Service**: Subscription management with Stripe
- **Tiers**: Free (3 modifications/day) and Premium (unlimited)
- **Feature Gates**: Usage limits and premium feature access control

## Component Dependencies

### React Components (`src/components/`)
- **common/**: Header, Settings, Toast, SubscriptionStatus, PaymentGate
- **prompt/**: CategoryGrid, PromptList, PromptCard

### Build Configuration
- **Webpack**: Main build tool with TypeScript loader
- **Path Aliases**: `@/` maps to `src/` for clean imports
- **CSS Extraction**: MiniCssExtractPlugin for styles
- **Code Splitting**: Vendor bundle separation

## Firebase Setup

If Firebase integration is needed:
1. Update `src/firebase-config.js` with your Firebase project credentials
2. Set up Firestore security rules from `firestore.rules`
3. Configure admin emails in security rules
4. Deploy admin dashboard from `admin-dashboard/` folder

## API Keys Required

- **OpenAI API Key**: For GPT-4o prompt modifications
- **Google OAuth Client ID**: Already configured in manifest.json
- **Firebase Config**: Optional, for cloud prompt management
- **ExtPay Extension ID**: `veo-3-prompter` (for payments)

## Important Files

- `webpack.config.js`: Build configuration with WSL compatibility fixes
- `public/manifest.json`: Chrome extension manifest with permissions
- `src/data/prompts.txt`: Prompt templates database (pipe-delimited)
- `CHANGELOG.md`: Comprehensive version history with all changes

## Development Notes

- The extension supports both popup and side panel modes
- Content scripts inject into Google Flow/Veo 3 pages for direct integration
- Simple build script available for WSL environments with path issues
- All prompts use professional SSASAC framework for video production
- Firebase is optional - extension falls back to local prompts.txt if not configured