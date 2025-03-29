# Audio Conversation Feature

## Overview
The audio conversation feature enhances the Bereavemently application by enabling natural voice interaction with the AI. Users can speak naturally, and the AI will respond with voice synthesis, creating a more human-like conversation experience.

## Key Features

- **Automatic Conversation Flow**: Speak, wait for AI to respond, and then speak again automatically
- **Voice Input**: High-quality speech recognition with automatic silence detection
- **Text-to-Speech Output**: AI responses are read aloud with customizable voice settings
- **Visual Audio Feedback**: Dynamic audio visualization during speaking and listening
- **Voice Customization**: Select from multiple voice options and adjust speech rate and pitch
- **Mobile Responsive**: Optimized interface for desktop and mobile devices

## How to Use

1. Click the microphone icon in the chat interface to activate voice mode
2. Speak naturally - the system will listen until you pause
3. Your message will be processed and sent to the AI
4. The AI's response will be spoken back to you
5. The system will automatically listen for your next message
6. Click the stop button to exit voice mode

## Voice Settings

Access voice settings by clicking the slider icon in the top-right of the audio interface:

- **Voice Selection**: Choose from several voice options (male/female, different accents)
- **Speech Speed**: Adjust how quickly the AI speaks (0.5x to 1.5x)
- **Pitch**: Modify the tone of the voice (lower to higher)

## Technical Implementation

The audio conversation feature is built using:

- **Web Speech API**: For speech recognition (with enhanced silence detection)
- **Google Text-to-Speech API**: For high-quality voice synthesis
- **Web Audio API**: For audio visualization and processing
- **React & Framer Motion**: For the responsive UI with smooth animations

## Troubleshooting

- **Microphone Access**: Ensure your browser has permission to access your microphone
- **Speech Recognition Issues**: Try speaking clearly and at a moderate pace
- **Audio Playback Problems**: Check your device's audio output settings
- **No Response**: Ensure you have an active internet connection

## Privacy Note

Voice data is processed locally for speech recognition and sent to our secure API for the AI response. Audio data is not stored permanently, and all processing adheres to our privacy policy. 