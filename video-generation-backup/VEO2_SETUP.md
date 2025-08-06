# Veo 2 Video Generation Setup Guide

## Important: Browser Limitations

Chrome extensions cannot directly use Node.js modules like `@google/genai`. Therefore, video generation must be done through a separate Node.js script.

## Setup Instructions

### Step 1: Get Your Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create API Key"
3. Copy your API key (starts with `AIza...`)

### Step 2: Set Up Node.js Environment

1. **Create a new folder** for video generation:
   ```bash
   mkdir veo2-generator
   cd veo2-generator
   ```

2. **Initialize npm and install the SDK**:
   ```bash
   npm init -y
   npm install @google/genai
   ```

3. **Create a file named `generate.js`** and paste the script from the extension

### Step 3: Generate Videos

1. **In the Chrome Extension**:
   - Browse and customize your prompts
   - Click "🎬 Generate Video" on any prompt
   - Click "📋 Show Generation Script"
   - Copy the provided script

2. **In your Node.js folder**:
   - Paste the script into `generate.js`
   - Run: `node generate.js`
   - The video will be saved as `veo2_generated_video.mp4`

## Alternative: Use the Standalone Generator

We've included `veo2_generator.js` which you can use directly:

```bash
# Set your API key as environment variable
export GEMINI_API_KEY="your-api-key-here"

# Run the generator
node veo2_generator.js
```

## Troubleshooting

### "API request failed"
- This is expected in the Chrome extension due to CORS restrictions
- Always use the Node.js script method instead

### "Module not found"
- Make sure you've run `npm install @google/genai`
- Check that you're in the correct directory

### "Invalid API key"
- Ensure your API key is from Google AI Studio (Gemini)
- Check that Veo 2 is available in your region

## Notes

- Veo 2 is currently in limited preview
- Video generation can take several minutes
- The script polls every 10 seconds for completion
- Maximum generation time is 20 minutes

## Future Updates

Once browser-based APIs become available or CORS restrictions are lifted, we'll update the extension to generate videos directly without needing Node.js.