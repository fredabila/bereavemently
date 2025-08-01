# Bereavemently - AI Grief Support Chat

## Overview

Bereavemently is an AI-powered grief support application that provides compassionate conversation and emotional support for people dealing with loss and bereavement. The application includes both text and voice-based interactions with our specialized AI grief counselor.

## Features

- **AI Grief Counseling**: Specialized AI responses for grief and loss support
- **Voice Input**: Speak naturally and have your words transcribed in real-time
- **Audio Visualization**: Visual feedback while recording your voice
- **Text-to-Speech**: Hear the AI's responses in a natural-sounding voice
- **Customizable Voice Settings**: Adjust pitch, speaking rate, and voice type
- **Pause/Resume**: Control your recording session
- **Auto-Play**: Have AI responses automatically read aloud
- **Journal Entries**: Automatic journaling of conversations for reflection
- **Self-Care Prompts**: Personalized self-care recommendations
- **Fallback API Support**: Robust API fallback system for reliable AI responses

## Setup

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Gemini API Key for fallback functionality
# Get your API key from: https://makersuite.google.com/app/apikey
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```

**Note**: The application uses a primary AI service with token-based authentication, but includes a fallback to the Gemini API when token generation fails. The Gemini API key is required for this fallback functionality to work properly.

### Fallback API System

The application implements a robust fallback system for AI responses:

1. **Primary Method**: Uses token-based authentication with Google's AI Platform
2. **Fallback Method**: Automatically switches to Gemini API with API key when token generation fails
3. **Same Input Parameters**: Both methods use identical input parameters and prompt structure
4. **Error Handling**: Graceful degradation with user-friendly error messages
5. **Response Formatting**: Maintains consistent response format regardless of which API is used

This ensures reliable AI responses even when the primary authentication method encounters issues.

## Features

- **Voice Input**: Speak naturally and have your words transcribed in real-time
- **Audio Visualization**: Visual feedback while recording your voice
- **Text-to-Speech**: Hear the AI's responses in a natural-sounding voice
- **Customizable Voice Settings**: Adjust pitch, speaking rate, and voice type
- **Pause/Resume**: Control your recording session
- **Auto-Play**: Have AI responses automatically read aloud

## How to Use

1. **Accessing the Feature**:
   - Click the microphone icon in the chat interface
   - For Free tier users, this will redirect to the subscription page
   - Standard and Premium users have full access

2. **Recording Your Voice**:
   - Click the large microphone button to start recording
   - Speak clearly into your device's microphone
   - Your words will be transcribed in real-time and displayed
   - Click the stop button (replaces microphone) when finished

3. **Playback Controls**:
   - Toggle auto-play with the speaker icon
   - Manually play the latest AI response with the play button
   - Pause and resume recording as needed

4. **Voice Settings**:
   - Click the gear icon to access voice settings
   - Choose from different voice types
   - Adjust speaking rate (speed)
   - Modify pitch to suit your preference

## Compatibility

- Works best on modern browsers: Chrome, Firefox, Safari, Edge
- Requires microphone access permission
- Headphones recommended for the best experience

## Privacy

- Audio processing happens on your device
- Voice data is not stored permanently
- Transcribed text is processed like regular chat messages

## Troubleshooting

- If you don't see your words being transcribed, check your microphone settings
- If you can't hear the AI response, ensure your device's volume is turned up
- If the feature isn't working, try refreshing the page or using a different browser

## Feedback

We're continuously improving this feature. If you have suggestions or encounter any issues, please reach out through the feedback form in the app. 