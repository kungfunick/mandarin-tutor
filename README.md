# Mandarin Conversation Tutor - Enhanced Version

An interactive Mandarin Chinese learning application with advanced speech recognition, comprehensive debug logging, and error correction features.

## What's New

### 1. **Comprehensive Logging System**
- All console output is now captured to downloadable log files
- Increased log capacity from 1,000 to 5,000 entries
- Detailed timestamps and log levels
- Session duration tracking
- Console hijacking feature captures everything automatically

### 2. **Advanced Settings Panel**
- Fine-tune speech recognition settings:
  - Continuous mode toggle
  - Interim results toggle
  - Max alternatives (1-10)
  - Language selection
- Browser compatibility information
- Logging controls (moved from debug panel)

### 3. **Debug UI Toggle**
- Enable/disable debug mode from Settings
- Hides/shows the Advanced Settings button in header
- Controls visibility of blue debug info boxes
- Console logging can be toggled independently

### 4. **Enhanced Speech Recognition**
- Settings saved to localStorage and loaded automatically
- More granular control over recognition parameters
- Better logging of speech events and audio levels

### 5. **Error Correction Mode**
- New setting to enable AI-powered error correction
- AI highlights errors in your Chinese with special formatting:
  - `[error: wrong → correct]` - Shows mistakes with corrections
  - `[correct: good usage]` - Highlights good usage
  - `<correction>suggestion</correction>` - Provides suggestions
- Color-coded corrections in message bubbles
- Gentle, encouraging feedback

### 6. **Improved UI**
- Send button now uses an icon instead of Chinese characters
- Better visual hierarchy
- Collapsible sections in Advanced Settings
- More intuitive controls

## Installation

```bash
# Install dependencies
npm install
# or
yarn install

# Start development server
npm run dev
# or
yarn dev
```

## Usage

### Basic Setup
1. Click the Settings gear icon
2. Select your AI provider (Claude, OpenAI, Gemini, or custom)
3. Enter your API key
4. Choose difficulty level
5. Enable/disable features as needed

### Debug & Logging
1. Open Settings
2. Toggle "Show debug UI panels" on/off
3. When enabled, click the Advanced Settings (sliders icon) in header
4. Enable "File Logging" to capture all console output
5. Use the app normally
6. Click "Download Log" to get a comprehensive debug file

### Error Correction
1. Go to Settings
2. Check "Enable error correction highlighting"
3. The AI will now highlight errors and provide gentle corrections
4. Corrections appear with color coding:
   - Red strikethrough = error
   - Green = correction
   - Blue = good usage
   - Yellow = suggestion

### Speech Recognition Advanced Settings
1. Enable debug UI in Settings
2. Click Advanced Settings (sliders icon)
3. Expand "Speech Recognition Settings"
4. Adjust settings:
   - Continuous mode: Keep listening until manually stopped
   - Interim results: Show live transcription as you speak
   - Max alternatives: Number of alternative transcriptions (higher = more accurate but slower)
   - Language: Change if having detection issues

### Microphone Tips
- Noise Gate: Increase if background noise triggers recording
- Min Speech Level: Increase if you need to speak louder
- Check console for "🗣️ SPEECH" markers to verify detection
- Ideal distance: 6-12 inches from microphone

## File Structure

```
mandarin-tutor/
├── src/
│   ├── components/
│   │   ├── AdvancedSettings.jsx (NEW)
│   │   ├── CustomProviderModal.jsx
│   │   ├── Header.jsx (UPDATED)
│   │   ├── HistoryPanel.jsx
│   │   ├── InputArea.jsx (UPDATED - icon send button)
│   │   ├── MandarinTutor.jsx (UPDATED)
│   │   ├── MessageBubble.jsx (UPDATED - correction support)
│   │   └── SettingsPanel.jsx (UPDATED)
│   ├── hooks/
│   │   ├── useLocalStorage.js
│   │   ├── useSpeechRecognition.js (UPDATED - settings loading)
│   │   └── useTextToSpeech.js
│   ├── services/
│   │   └── aiService.js (UPDATED - correction mode)
│   ├── utils/
│   │   └── logger.js (COMPLETELY REWRITTEN)
│   ├── App.jsx
│   ├── index.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Troubleshooting

### Speech Recognition Issues
1. Enable File Logging in Advanced Settings
2. Click microphone and speak
3. Download the log file
4. Look for:
   - "🎤 Speech recognition started" - confirms mic is working
   - "🔊 Audio capture started" - confirms audio is being captured
   - "🎵 Sound detected" - confirms sound is heard
   - "💬 Speech detected" - confirms speech is recognized
   - Audio level readings with "🗣️ SPEECH" markers

### Single Character Display
- This issue should be resolved with the updated transcript handling
- The log file will show accumulated vs current transcript
- Look for "✅ SAVED" markers in logs to see what was captured

### AI Not Correcting Errors
- Make sure "Enable error correction highlighting" is checked in Settings
- The AI needs clear errors to correct - try making deliberate mistakes
- Check log file for "correction mode: true" when sending messages

## API Key Management
- All API keys are stored locally in your browser
- Never shared or transmitted except to the AI provider you selected
- Clear browser data to remove stored keys

## Browser Compatibility
- Best experience: Chrome, Edge, or Safari
- Speech Recognition: Chrome/Edge (best), Safari (good), Firefox (limited)
- All features tested on latest browsers

## License
MIT

## Support
For issues or questions, check the log file first - it contains detailed information about what's happening in the app.
