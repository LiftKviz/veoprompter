# Veo 3 Prompt Assistant Chrome Extension

A Chrome extension that helps you discover, manage, and modify prompts for Veo 3 video creation.

## Features

- **Browse Prompts**: Organized by categories (Ads, Storytelling, Tutorial, Vlogging)
- **Copy Prompts**: One-click copy to clipboard
- **Modify Prompts**: Use GPT API to intelligently modify prompts
- **Save Prompts**: Save favorite prompts to "My Prompts" category
- **YouTube Previews**: Links to example videos for inspiration

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Add Your OpenAI API Key
- Build and load the extension
- Click the ⚙️ settings icon
- Add your OpenAI API key from https://platform.openai.com/api-keys

### 3. Edit Prompts
Edit `src/data/prompts.txt` to add/modify prompts:
```
category|title|prompt text|youtube_link(optional)
```

## Build Options

### Option 1: Simple Build (Recommended for WSL)
```bash
node simple-build.js
```
Creates a basic working extension in `dist/` folder.

### Option 2: Full React Build
```bash
npm run build
```
May have path issues in WSL environment.

## Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `dist` folder
5. The extension icon should appear in your toolbar

## Usage

1. Click the extension icon
2. Browse categories or go to "My Prompts"
3. Click on any prompt to expand
4. Use the action buttons:
   - 📋 **Copy**: Copy prompt to clipboard
   - ✏️ **Modify**: Use GPT to modify the prompt
   - ▶️ **Preview**: Open YouTube example (if available)
   - ⭐ **Save**: Add to your personal collection

## File Structure

```
src/
├── components/          # React components
│   ├── common/         # Header, Settings, Toast
│   └── prompt/         # CategoryGrid, PromptList, PromptCard
├── data/
│   └── prompts.txt     # Editable prompts database
├── services/
│   └── gptService.ts   # OpenAI API integration
├── types/              # TypeScript definitions
└── utils/              # Helper functions

public/
├── manifest.json       # Chrome extension manifest
├── popup.html         # Extension popup HTML
└── icons/             # Extension icons
```

## Development

- **Add prompts**: Edit `src/data/prompts.txt`
- **Modify styling**: Edit CSS files in component folders
- **Add features**: Extend React components in `src/components/`

## Troubleshooting

### Build Issues
- Use `node simple-build.js` for WSL environments
- Check file paths don't contain spaces or special characters

### Extension Not Loading
- Verify `dist/manifest.json` exists
- Check Chrome developer console for errors
- Ensure all required files are in `dist/` folder

### GPT Modifications Not Working
- Add your OpenAI API key in settings
- Check internet connection
- Verify API key has sufficient credits

## API Integration

The extension uses OpenAI's GPT-3.5-turbo model for prompt modifications. Your API key is stored locally in Chrome's storage and never leaves your browser except for API calls to OpenAI.