import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMicrophone,
  faVolumeUp,
  faStop,
  faPause,
  faPlay,
  faHeadphones,
  faSliders,
  faXmark,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';

import { 
  convertTextToSpeech, 
  playAudio,
  createAudioContext,
  createEnhancedSpeechRecognition,
  createVisualizer,
  getVoiceModels
} from '../utils/audioUtils';

// ========= Styled Components =========

const Container = styled(motion.div)`
  position: relative;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  background: ${({ theme }) => theme.secondary || '#232333'};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  margin-bottom: 16px;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const VisualizerContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100px;
  background: rgba(0, 0, 0, 0.15);
  overflow: hidden;
  
  @media (max-width: 768px) {
    height: 80px;
  }
  
  @media (max-width: 480px) {
    height: 60px;
  }
`;

const VisualizerCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const StateIndicator = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  
  svg {
    margin-right: 8px;
  }
  
  @media (max-width: 480px) {
    top: 8px;
    left: 8px;
    padding: 4px 8px;
    font-size: 12px;
    border-radius: 12px;
  }
`;

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  gap: 16px;
  
  @media (max-width: 480px) {
    padding: 12px;
    gap: 12px;
  }
`;

const MainButton = styled(motion.button)`
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  background: ${({ theme, active }) => 
    active ? 
    (theme.gradient || `linear-gradient(135deg, ${theme.primary || '#4a6cf7'}, ${theme.primary || '#4a6cf7'}cc)`) : 
    'rgba(255, 255, 255, 0.08)'
  };
  color: white;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: ${({ active }) => 
    active ? 
    '0 4px 20px rgba(0, 0, 0, 0.3)' : 
    '0 2px 10px rgba(0, 0, 0, 0.1)'
  };
  
  &:hover {
    transform: ${({ disabled }) => disabled ? 'none' : 'scale(1.05)'};
    background: ${({ theme, active, disabled }) => 
      disabled ? 'rgba(255, 255, 255, 0.08)' : 
      active ? 
      (theme.gradient || `linear-gradient(135deg, ${theme.primary || '#4a6cf7'}, ${theme.primary || '#4a6cf7'}cc)`) : 
      'rgba(255, 255, 255, 0.15)'
    };
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: 480px) {
    width: 56px;
    height: 56px;
    font-size: 20px;
  }
`;

const SecondaryButton = styled(motion.button)`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    transform: ${({ disabled }) => disabled ? 'none' : 'scale(1.05)'};
    background: rgba(255, 255, 255, 0.15);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
    font-size: 14px;
  }
`;

const TranscriptionBox = styled.div`
  margin: 0 16px 16px;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.15);
  color: white;
  font-size: 14px;
  line-height: 1.4;
  min-height: 60px;
  max-height: 80px;
  overflow-y: auto;
  opacity: ${({ visible }) => visible ? 1 : 0};
  transition: opacity 0.3s ease;
  
  @media (max-width: 480px) {
    margin: 0 12px 12px;
    padding: 10px 12px;
    min-height: 50px;
    max-height: 70px;
    font-size: 13px;
  }
`;

const SettingsButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.7);
  }
  
  @media (max-width: 480px) {
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
  }
`;

const SettingsPanel = styled(motion.div)`
  position: absolute;
  top: 56px;
  right: 16px;
  width: 280px;
  background: ${({ theme }) => theme.bubbleColor || '#2a2a3a'};
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 100;
  overflow: hidden;
  
  @media (max-width: 768px) {
    width: 260px;
    right: 12px;
  }
  
  @media (max-width: 480px) {
    width: calc(100% - 24px);
    top: 48px;
    right: 12px;
  }
`;

const SettingsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  h3 {
    font-size: 16px;
    font-weight: 500;
    color: white;
    margin: 0;
  }
  
  button {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      color: white;
    }
  }
`;

const SettingsContent = styled.div`
  padding: 16px;
`;

const SettingGroup = styled.div`
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SettingLabel = styled.label`
  display: block;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 14px;
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg fill='white' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.primary || '#4a6cf7'};
  }
`;

const SliderContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const Slider = styled.input`
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.2);
  outline: none;
  margin: 8px 0;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${({ theme }) => theme.primary || '#4a6cf7'};
    cursor: pointer;
  }
  
  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${({ theme }) => theme.primary || '#4a6cf7'};
    cursor: pointer;
    border: none;
  }
`;

const SliderLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

const WaveAnimation = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40px;
  overflow: hidden;
  opacity: ${({ visible }) => visible ? 0.2 : 0};
  transition: opacity 0.5s ease;
  
  &:before, &:after {
    content: '';
    position: absolute;
    left: 0;
    width: 200%;
    height: 100%;
    background-repeat: repeat-x;
    animation-duration: 10s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    background: linear-gradient(45deg, transparent, transparent 25%, rgba(255, 255, 255, 0.2) 25%, rgba(255, 255, 255, 0.2) 50%, transparent 50%, transparent 75%, rgba(255, 255, 255, 0.2) 75%);
    background-size: 20px 20px;
  }
  
  &:before {
    bottom: 10px;
    animation-name: wave;
  }
  
  &:after {
    bottom: 0;
    animation-name: wave-reverse;
    animation-duration: 7s;
  }
  
  @keyframes wave {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  
  @keyframes wave-reverse {
    0% { transform: translateX(-50%); }
    100% { transform: translateX(0); }
  }
`;

const PulseRing = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  
  &:before, &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 50%;
    background: ${({ theme }) => theme.primary || '#4a6cf7'};
    opacity: 0.4;
    animation: pulse 2s infinite;
  }
  
  &:after {
    animation-delay: 0.5s;
  }
  
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 0.4;
    }
    70% {
      transform: scale(1.3);
      opacity: 0;
    }
    100% {
      transform: scale(1.3);
      opacity: 0;
    }
  }
`;

// ========= Component Implementation =========

const AudioConversation = ({
  theme,
  onSendMessage,
  latestAiMessage,
  setIsBotSpeaking
}) => {
  // State for conversation flow
  const [conversationState, setConversationState] = useState('idle'); // idle, listening, processing, speaking
  const [transcription, setTranscription] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // State for audio settings
  const [voiceSettings, setVoiceSettings] = useState({
    voice: 'en-US-Neural2-F',
    pitch: 0,
    speed: 1.0
  });
  
  // Refs for audio processing
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const visualizerRef = useRef(null);
  const micStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  const speakingTimeoutRef = useRef(null);
  
  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      // Stop microphone stream if active
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
        micStreamRef.current = null;
      }
      
      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      
      // Clear any pending timeouts
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
      }
      
      // Stop visualizer
      if (visualizerRef.current) {
        visualizerRef.current.stop();
      }
      
      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  // Effect to handle microphone audio input
  useEffect(() => {
    if (isActive && (conversationState === 'listening' || conversationState === 'speaking')) {
      initializeMicrophone();
    } else {
      // Stop microphone stream if not needed
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
        micStreamRef.current = null;
      }
    }
  }, [isActive, conversationState]);
  
  // Effect to start listening when active
  useEffect(() => {
    if (isActive) {
      if (conversationState === 'idle') {
        startListening();
      }
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setConversationState('idle');
    }
  }, [isActive]);
  
  // Effect to handle new AI messages
  useEffect(() => {
    console.log('Latest AI message received:', latestAiMessage);
    console.log('Current conversation state:', conversationState);
    
    if (isActive && latestAiMessage && conversationState === 'processing') {
      console.log('Processing AI response for speech...');
      speakAiResponse(latestAiMessage);
    }
  }, [latestAiMessage, conversationState, isActive]);
  
  // Initialize audio context and microphone stream
  const initializeMicrophone = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = createAudioContext();
      }
      
      // Skip if stream already exists
      if (micStreamRef.current) return;
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      micStreamRef.current = stream;
      
      // Setup audio visualization
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      if (!visualizerRef.current && canvasRef.current) {
        // Validate theme color and provide a fallback
        const safeBarColor = (theme?.primary && typeof theme.primary === 'string') 
          ? theme.primary 
          : '#4a6cf7';  // Fallback color
        
        try {
          visualizerRef.current = createVisualizer(canvasRef.current, audioContextRef.current, {
            barColor: safeBarColor,
            fftSize: 512,
            smoothing: 0.85
          });
          
          visualizerRef.current.connect(source).start();
        } catch (error) {
          console.error('Error creating audio visualizer:', error);
          // Continue without visualizer if it fails to initialize
        }
      }
    } catch (error) {
      console.error('Error initializing microphone:', error);
      setIsActive(false);
    }
  };
  
  // Speech recognition functions
  const startListening = () => {
    console.log('Starting listening...');
    
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    
    // Only clear transcription when starting a completely new listening session
    if (conversationState !== 'listening') {
      setTranscription('');
    }
    
    setConversationState('listening');
    
    recognitionRef.current = createEnhancedSpeechRecognition({
      silenceThreshold: 2500, // Increase silence threshold to 2.5 seconds to handle brief pauses
      briefPauseThreshold: 1000, // Brief pause threshold of 1 second (new parameter)
      onResult: ({ transcript, isFinal }) => {
        setTranscription(transcript);
        if (isFinal) {
          console.log('Final transcript received:', transcript);
        }
      },
      onBriefPause: () => {
        // Do nothing on brief pause, just keep the current transcription
        console.log('Brief pause detected, continuing to listen...');
      },
      onSilence: (transcript) => {
        console.log('Long silence detected, transcript:', transcript);
        if (transcript && transcript.trim()) {
          handleTranscriptionComplete(transcript);
        } else {
          // If no transcript was captured but silence was detected,
          // restart listening after a short delay
          setTimeout(() => {
            if (isActive && conversationState === 'listening') {
              console.log('No speech detected, restarting listening...');
              startListening();
            }
          }, 500);
        }
      },
      onError: (error) => {
        console.error('Speech recognition error:', error);
        setConversationState('idle');
        
        // Try to restart listening after error
        setTimeout(() => {
          if (isActive) {
            console.log('Restarting listening after error...');
            startListening();
          }
        }, 1000);
      },
      onStart: () => {
        console.log('Speech recognition started');
      },
      onEnd: () => {
        console.log('Speech recognition ended');
      }
    });
    
    recognitionRef.current.start();
  };
  
  // Handle completed transcription
  const handleTranscriptionComplete = (text) => {
    if (!text || !text.trim()) return;
    
    console.log('Transcription complete, sending message:', text);
    
    // Stop listening
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Set state to processing
    setConversationState('processing');
    
    // Send message to parent component
    if (onSendMessage) {
      onSendMessage(text);
    }
  };
  
  // Speak AI response
  const speakAiResponse = async (text) => {
    try {
      console.log('Speaking AI response:', text);
      setConversationState('speaking');
      setIsBotSpeaking(true);
      
      const audioData = await convertTextToSpeech(text, {
        name: voiceSettings.voice,
        pitch: voiceSettings.pitch,
        speakingRate: voiceSettings.speed
      });
      
      if (audioData) {
        await playAudio(
          audioData,
          () => {
            console.log('Started speaking');
          },
          () => {
            console.log('Finished speaking');
            setIsBotSpeaking(false);
            
            // Delay before starting to listen again
            speakingTimeoutRef.current = setTimeout(() => {
              if (isActive) {
                console.log('AI response complete, starting to listen again...');
                startListening();
              }
            }, 1000);
          }
        );
      } else {
        console.error('No audio data received from text-to-speech');
        setConversationState('idle');
        setIsBotSpeaking(false);
        
        // Try to restart listening if no audio data
        setTimeout(() => {
          if (isActive) {
            console.log('No audio data, restarting listening...');
            startListening();
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error speaking AI response:', error);
      setConversationState('idle');
      setIsBotSpeaking(false);
      
      // Try to restart listening after error
      setTimeout(() => {
        if (isActive) {
          console.log('Error in speaking, restarting listening...');
          startListening();
        }
      }, 1000);
    }
  };
  
  // Toggle active state
  const toggleActive = () => {
    if (conversationState === 'speaking') {
      // Stop speaking if active
      setIsActive(false);
      setIsBotSpeaking(false);
      setConversationState('idle');
    } else {
      setIsActive(!isActive);
    }
  };
  
  // Update voice settings
  const handleSettingsChange = (key, value) => {
    setVoiceSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Render state indicator text
  const renderStateText = () => {
    switch (conversationState) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Processing...';
      case 'speaking':
        return 'Speaking...';
      default:
        return 'Ready';
    }
  };
  
  // Render state indicator icon
  const renderStateIcon = () => {
    switch (conversationState) {
      case 'listening':
        return <FontAwesomeIcon icon={faMicrophone} />;
      case 'processing':
        return <FontAwesomeIcon icon={faSpinner} spin />;
      case 'speaking':
        return <FontAwesomeIcon icon={faVolumeUp} />;
      default:
        return <FontAwesomeIcon icon={faHeadphones} />;
    }
  };
  
  // Voice model options
  const voiceOptions = getVoiceModels();
  
  return (
    <Container
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <VisualizerContainer>
        <VisualizerCanvas ref={canvasRef} />
        <WaveAnimation visible={conversationState === 'speaking'} />
        
        <StateIndicator>
          {renderStateIcon()}
          {renderStateText()}
        </StateIndicator>
        
        <SettingsButton onClick={() => setShowSettings(prev => !prev)}>
          <FontAwesomeIcon icon={faSliders} />
        </SettingsButton>
      </VisualizerContainer>
      
      <ControlsContainer>
        <MainButton
          active={isActive}
          onClick={toggleActive}
          whileTap={{ scale: 0.95 }}
          disabled={conversationState === 'processing'}
        >
          {conversationState === 'speaking' ? (
            <FontAwesomeIcon icon={faStop} />
          ) : isActive ? (
            <FontAwesomeIcon icon={faStop} />
          ) : (
            <FontAwesomeIcon icon={faMicrophone} />
          )}
          
          {isActive && conversationState === 'listening' && <PulseRing theme={theme} />}
        </MainButton>
      </ControlsContainer>
      
      <TranscriptionBox visible={!!transcription}>
        {transcription}
      </TranscriptionBox>
      
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <SettingsHeader>
              <h3>Voice Settings</h3>
              <button onClick={() => setShowSettings(false)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </SettingsHeader>
            
            <SettingsContent>
              <SettingGroup>
                <SettingLabel htmlFor="voice-select">Voice</SettingLabel>
                <Select
                  id="voice-select"
                  value={voiceSettings.voice}
                  onChange={(e) => handleSettingsChange('voice', e.target.value)}
                  theme={theme}
                >
                  {voiceOptions.map(voice => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name}
                    </option>
                  ))}
                </Select>
              </SettingGroup>
              
              <SettingGroup>
                <SettingLabel>Speech Speed</SettingLabel>
                <SliderContainer>
                  <Slider
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={voiceSettings.speed}
                    onChange={(e) => handleSettingsChange('speed', parseFloat(e.target.value))}
                    theme={theme}
                  />
                  <SliderLabels>
                    <span>Slow</span>
                    <span>Normal</span>
                    <span>Fast</span>
                  </SliderLabels>
                </SliderContainer>
              </SettingGroup>
              
              <SettingGroup>
                <SettingLabel>Pitch</SettingLabel>
                <SliderContainer>
                  <Slider
                    type="range"
                    min="-10"
                    max="10"
                    step="1"
                    value={voiceSettings.pitch}
                    onChange={(e) => handleSettingsChange('pitch', parseInt(e.target.value))}
                    theme={theme}
                  />
                  <SliderLabels>
                    <span>Low</span>
                    <span>Normal</span>
                    <span>High</span>
                  </SliderLabels>
                </SliderContainer>
              </SettingGroup>
            </SettingsContent>
          </SettingsPanel>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default AudioConversation; 