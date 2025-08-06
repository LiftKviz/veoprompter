# Veo 3 Prompt Assistant - Tester Installation Guide

## 📥 How to Install the Extension (Manual)

### Step 1: Download & Extract
1. Download the `veo3-prompt-assistant-v1.4.0.zip` file
2. Extract it to a folder on your computer (e.g., Desktop/veo3-extension)
3. You should see files like `manifest.json`, `popup.html`, etc.

### Step 2: Install in Chrome
1. Open **Chrome** browser
2. Go to `chrome://extensions/` (copy/paste this in address bar)
3. Turn ON **"Developer mode"** (toggle in top-right corner)
4. Click **"Load unpacked"** button
5. Select the extracted folder (the one with `manifest.json`)
6. The extension should now appear in your extensions list

### Step 3: Pin the Extension
1. Click the **puzzle piece icon** in Chrome toolbar
2. Find **"Veo 3 Prompt Assistant"**
3. Click the **pin icon** to keep it visible

---

## 🚀 Getting Started

### First-Time Setup
1. **Click the extension icon** (purple play button with "3")
2. **Add your OpenAI API key**:
   - Click the ⚙️ settings button
   - Enter your OpenAI API key
   - This enables prompt modification features

### Basic Usage
1. **Browse prompts** by category (Ads, Storytelling, etc.)
2. **Copy prompts** to use in Veo 3
3. **Modify prompts** with AI assistance
4. **Build sequences** for multi-scene videos

---

## 🎬 Key Features to Test

### ✅ Core Functionality
- [ ] Browse all 21 prompt categories
- [ ] Copy prompts to clipboard
- [ ] Modify prompts with custom instructions
- [ ] Save prompts to "My Prompts"

### ✅ Sequence Builder
- [ ] Add prompts to sequence
- [ ] Use "Add Next Scene" to continue sequences
- [ ] Modify individual scenes in sequence
- [ ] Copy sequence scenes
- [ ] Save complete sequences

### ✅ Advanced Features
- [ ] Search functionality
- [ ] Firebase real-time updates (prompts load from cloud)
- [ ] Settings panel (API key management)

---

## 🐛 What to Look For

### Test These Areas:
1. **Performance**: Does it load quickly?
2. **UI/UX**: Is it intuitive and easy to use?
3. **Functionality**: Do all buttons work as expected?
4. **Error Handling**: What happens with invalid API keys?
5. **Mobile/Responsive**: Does it work on different screen sizes?

### Common Issues:
- **"API key required"**: You need to add your OpenAI API key in settings
- **Empty prompts**: Check your internet connection (prompts load from Firebase)
- **Modification fails**: Verify your OpenAI API key has GPT-4 access

---

## 📝 Feedback Needed

Please test and provide feedback on:

### Usability
- Is the interface intuitive?
- Are the buttons and actions clear?
- Any confusing or frustrating aspects?

### Features
- Which features do you use most?
- What's missing that you'd want?
- Any bugs or unexpected behavior?

### Performance
- How fast does it load?
- Are modifications responsive?
- Any lag or slowness?

---

## 🆘 Troubleshooting

### Extension Won't Load
- Make sure you extracted the ZIP file completely
- Check that `manifest.json` is in the folder you selected
- Try reloading the extension in `chrome://extensions/`

### No Prompts Showing
- Check your internet connection
- Try refreshing the extension
- The prompts load from Firebase (cloud database)

### Modifications Not Working
- Add your OpenAI API key in settings (⚙️ button)
- Make sure your API key has GPT-4 access
- Check your OpenAI account has credits

### Need Help?
Contact me with:
- What you were trying to do
- What happened vs. what you expected
- Screenshots if possible
- Any error messages

---

## 🎯 Testing Scenarios

### Scenario 1: First-Time User
1. Install extension
2. Browse prompts without API key
3. Try to modify (should show API key needed)
4. Add API key and retry

### Scenario 2: Sequence Creation
1. Pick a prompt from Ads category
2. Add to sequence
3. Go to Sequences tab
4. Add next scene with "Add Next Scene"
5. Modify one of the scenes
6. Copy individual scenes

### Scenario 3: Power User
1. Search for specific prompts
2. Modify multiple prompts
3. Build complex sequences
4. Save sequences for later
5. Use "My Prompts" section

---

Thank you for testing! Your feedback helps make this extension better for everyone. 🙏