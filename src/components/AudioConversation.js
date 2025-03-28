import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMicrophone,
  faStop,
  faPause,
  faPlay,
  faVolumeUp,
  faVolumeOff,
  faSpinner,
  faExclamationTriangle,
  faCheckCircle,
  faCog
} from '@fortawesome/free-solid-svg-icons';
import { 
  convertTextToSpeech, 
  playAudio, 
  createSpeechRecognition, 
  visualizeAudio 
} from '../utils/audioUtils';

// Styled Components
const AudioContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding: 15px;
  width: 100%;
  background-color: ${({ theme }) => theme.secondary || '#303040'};
  border-radius: 12px;
  margin-bottom: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  
  @media (max-width: 480px) {
    padding: 12px 10px;
    gap: 10px;
  }
`;

const ButtonsContainer = styled.div.attrs({
  className: 'audio-controls'
})`
  display: flex;
  align-items: center;
  gap: 15px;
  width: 100%;
  justify-content: center;
`;

const AudioButton = styled.button.attrs(props => ({
  className: props.size === 'large' ? 'audio-button-large' : 'audio-button'
}))`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ size }) => size === 'large' ? '60px' : '45px'};
  height: ${({ size }) => size === 'large' ? '60px' : '45px'};
  border-radius: 50%;
  background: ${({ theme, primary }) => primary ? theme.primary || '#5a5abf' : 'rgba(255, 255, 255, 0.1)'};
  border: none;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;

  &:hover {
    transform: scale(1.05);
    background: ${({ theme, primary }) => primary ? 
      (theme.gradient || `linear-gradient(135deg, ${theme.primary || '#5a5abf'}, #6a6acf)`) : 
      'rgba(255, 255, 255, 0.2)'
    };
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  svg {
    font-size: ${({ size }) => size === 'large' ? '24px' : '18px'};
  }
`;

const PulseAnimation = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  animation: ${({ isRecording }) => isRecording ? 'pulse 1.5s infinite' : 'none'};
  background: rgba(255, 0, 0, 0.2);
  
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.3);
      opacity: 0.3;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const StatusText = styled.div`
  text-align: center;
  color: #f2f2f2;
  font-size: 14px;
  margin-top: 5px;
  min-height: 20px;
  font-weight: 500;
  opacity: ${({ visible }) => visible ? '1' : '0'};
  transition: opacity 0.3s ease;
  
  @media (max-width: 480px) {
    font-size: 12px;
    margin-top: 3px;
    min-height: 18px;
  }
`;

const CanvasContainer = styled.div`
  width: 100%;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 5px;
  
  @media (max-width: 480px) {
    height: 40px;
    margin-top: 3px;
  }
`;

const VisualizerCanvas = styled.canvas.attrs({
  className: 'audio-visualizer'
})`
  width: 100%;
  height: 60px;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.2);
`;

const TranscriptionContainer = styled.div`
  width: 100%;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  margin-top: 10px;
  font-size: 14px;
  color: #f2f2f2;
  max-height: 100px;
  overflow-y: auto;
  transition: all 0.3s ease;
  opacity: ${({ visible }) => visible ? '1' : '0'};
  max-height: ${({ visible }) => visible ? '100px' : '0'};
  padding: ${({ visible }) => visible ? '12px' : '0'};
  margin-top: ${({ visible }) => visible ? '10px' : '0'};
  
  @media (max-width: 480px) {
    font-size: 13px;
    padding: ${({ visible }) => visible ? '10px' : '0'};
    max-height: ${({ visible }) => visible ? '80px' : '0'};
  }
`;

const SettingsButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: color 0.2s ease;
  
  &:hover {
    color: white;
  }
  
  @media (max-width: 480px) {
    top: 8px;
    right: 8px;
  }
`;

const SettingsPanel = styled.div.attrs({
  className: 'settings-panel'
})`
  position: absolute;
  top: 40px;
  right: 12px;
  background-color: ${({ theme }) => theme.bubbleColor || '#282838'};
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  padding: 15px;
  width: 250px;
  z-index: 100;
  display: ${({ visible }) => visible ? 'block' : 'none'};
`;

const SettingGroup = styled.div`
  margin-bottom: 15px;
  
  @media (max-width: 480px) {
    margin-bottom: 12px;
  }
`;

const SettingLabel = styled.label`
  display: block;
  color: #f2f2f2;
  font-size: 14px;
  margin-bottom: 5px;
  
  @media (max-width: 480px) {
    font-size: 13px;
    margin-bottom: 4px;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 10px;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 14px;
  appearance: none;
  position: relative;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.primary || '#5a5abf'};
  }
  
  @media (max-width: 480px) {
    padding: 6px 8px;
    font-size: 13px;
  }
`;

const RangeInput = styled.input`
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  outline: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${({ theme }) => theme.primary || '#5a5abf'};
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${({ theme }) => theme.primary || '#5a5abf'};
    cursor: pointer;
    border: none;
  }
`;

const RangeValue = styled.div`
  display: flex;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  margin-top: 5px;
`;

/**
 * AudioConversation component for integrating voice chat capability
 */
const AudioConversation = ({ 
  theme = {}, 
  onSendMessage, 
  isBotSpeaking,
  setIsBotSpeaking,
  currentPlan = 'Standard',
  latestAiMessage = ''
}) => {
  // State variables
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [audioSettings, setAudioSettings] = useState({
    speechRate: 1,
    pitch: 0,
    voiceName: 'en-US-Chirp3-HD-Puck',
    volume: 1
  });
  const [showSettings, setShowSettings] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [autoPlay, setAutoPlay] = useState(true);

  // Refs
  const canvasRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioAnalyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processingTimeoutRef = useRef(null);

  // Create speech recognition on mount
  useEffect(() => {
    recognitionRef.current = createSpeechRecognition();
    
    if (recognitionRef.current) {
      // Setup recognition events
      recognitionRef.current.onstart = () => {
        setIsRecording(true);
        setStatus('Listening...');
      };
      
      recognitionRef.current.onend = () => {
        if (!isPaused) {
          setIsRecording(false);
        }
        
        if (transcription && !isPaused) {
          setStatus('Processing...');
          setIsProcessing(true);
          
          // Set a timeout to prevent UI from being stuck if processing takes too long
          processingTimeoutRef.current = setTimeout(() => {
            setIsProcessing(false);
            setStatus('');
          }, 10000);
        } else if (!isPaused) {
          setStatus('');
        }
      };
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
          
        setTranscription(transcript);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Error: ${event.error}`);
        setIsRecording(false);
        setIsPaused(false);
        setStatus('');
      };
    }
    
    // Clean up on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Load available voices on mount
  useEffect(() => {
    const loadVoices = async () => {
      try {
        const synth = window.speechSynthesis;
        await new Promise(resolve => {
          if (synth.getVoices().length > 0) {
            resolve();
          } else {
            synth.onvoiceschanged = resolve;
          }
        });
        
        const voices = synth.getVoices();
        setAvailableVoices(voices);
      } catch (error) {
        console.error('Error loading voices:', error);
      }
    };
    
    loadVoices();
  }, []);

  // Effect to start audio visualization when recording
  useEffect(() => {
    if (isRecording && !audioContextRef.current && canvasRef.current) {
      startAudioVisualization();
    }
    
    return () => {
      if (audioAnalyserRef.current) {
        audioAnalyserRef.current.disconnect();
      }
    };
  }, [isRecording]);

  // Effect to speak AI response when it changes
  useEffect(() => {
    if (latestAiMessage && autoPlay && !isBotSpeaking) {
      speakAiResponse(latestAiMessage);
    }
  }, [latestAiMessage, autoPlay]);

  /**
   * Start the audio visualization
   */
  const startAudioVisualization = async () => {
    try {
      if (!canvasRef.current) return;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      audioAnalyserRef.current = visualizeAudio(canvasRef.current, source, audioContextRef.current);
    } catch (error) {
      console.error('Error starting audio visualization:', error);
      setError('Could not access microphone');
    }
  };

  /**
   * Start recording audio
   */
  const startRecording = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not supported in your browser');
      return;
    }
    
    try {
      setTranscription('');
      setError(null);
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setError('Error starting speech recognition');
    }
  };

  /**
   * Stop recording audio
   */
  const stopRecording = async () => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
      setIsPaused(false);
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (transcription) {
        // Send transcription to chat
        await sendTranscriptionToChat();
      }
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  };

  /**
   * Toggle pause/resume recording
   */
  const togglePause = () => {
    if (isRecording) {
      if (!isPaused) {
        recognitionRef.current.stop();
        setIsPaused(true);
        setStatus('Paused');
      } else {
        setIsPaused(false);
        setStatus('Resuming...');
        setTimeout(() => {
          recognitionRef.current.start();
        }, 200);
      }
    }
  };

  /**
   * Send transcription to chat for processing
   */
  const sendTranscriptionToChat = async () => {
    if (!transcription.trim()) return;
    
    try {
      setIsProcessing(true);
      
      // Call the onSendMessage callback with the transcription
      if (onSendMessage) {
        await onSendMessage(transcription);
      }
      
      setTranscription('');
    } catch (error) {
      console.error('Error sending transcription to chat:', error);
      setError('Error processing your message');
    } finally {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      setIsProcessing(false);
      setStatus('');
    }
  };

  /**
   * Speak the AI response
   */
  const speakAiResponse = async (text) => {
    if (!text || isBotSpeaking) return;
    
    try {
      setIsBotSpeaking(true);
      setStatus('Converting to speech...');
      
      const audioConfig = {
        languageCode: 'en-US',
        name: audioSettings.voiceName,
        pitch: audioSettings.pitch,
        speakingRate: audioSettings.speechRate
      };
      
      const audioUri = await convertTextToSpeech(text, audioConfig);
      if (!audioUri) {
        throw new Error('Failed to generate speech');
      }
      
      setStatus('Speaking...');
      await playAudio(audioUri);
    } catch (error) {
      console.error('Error speaking AI response:', error);
      setError('Error playing audio response');
    } finally {
      setIsBotSpeaking(false);
      setStatus('');
    }
  };

  /**
   * Toggle auto play for AI responses
   */
  const toggleAutoPlay = () => {
    setAutoPlay(!autoPlay);
  };

  /**
   * Update audio settings
   */
  const handleSettingChange = (setting, value) => {
    setAudioSettings({
      ...audioSettings,
      [setting]: value
    });
  };

  return (
    <AudioContainer theme={theme}>
      {/* Settings Button */}
      <SettingsButton onClick={() => setShowSettings(!showSettings)}>
        <FontAwesomeIcon icon={faCog} />
      </SettingsButton>
      
      {/* Settings Panel */}
      <SettingsPanel theme={theme} visible={showSettings}>
        <SettingGroup>
          <SettingLabel>Voice</SettingLabel>
          <Select 
            value={audioSettings.voiceName}
            onChange={(e) => handleSettingChange('voiceName', e.target.value)}
            theme={theme}
          >
            <option value="en-US-Chirp3-HD-Puck">Chirp (Female)</option>
            <option value="en-US-Journey-HD-Puck">Journey (Male)</option>
            <option value="en-US-Neural2-J">Calm Voice (Male)</option>
            <option value="en-US-Neural2-F">Warm Voice (Female)</option>
            <option value="en-GB-Neural2-B">British (Male)</option>
            <option value="en-GB-Neural2-C">British (Female)</option>
          </Select>
        </SettingGroup>
        
        <SettingGroup>
          <SettingLabel>Speech Rate</SettingLabel>
          <RangeInput 
            type="range" 
            min="0.5" 
            max="1.5" 
            step="0.1" 
            value={audioSettings.speechRate}
            onChange={(e) => handleSettingChange('speechRate', parseFloat(e.target.value))}
            theme={theme}
          />
          <RangeValue>
            <span>Slow</span>
            <span>{audioSettings.speechRate.toFixed(1)}x</span>
            <span>Fast</span>
          </RangeValue>
        </SettingGroup>
        
        <SettingGroup>
          <SettingLabel>Pitch</SettingLabel>
          <RangeInput 
            type="range" 
            min="-5" 
            max="5" 
            step="1" 
            value={audioSettings.pitch}
            onChange={(e) => handleSettingChange('pitch', parseInt(e.target.value))}
            theme={theme}
          />
          <RangeValue>
            <span>Low</span>
            <span>{audioSettings.pitch > 0 ? `+${audioSettings.pitch}` : audioSettings.pitch}</span>
            <span>High</span>
          </RangeValue>
        </SettingGroup>
      </SettingsPanel>

      {/* Audio Visualization */}
      <CanvasContainer>
        <VisualizerCanvas 
          ref={canvasRef} 
          width="600" 
          height="60"
        />
      </CanvasContainer>
      
      {/* Status and Error Messages */}
      <StatusText visible={status || error}>
        {error ? (
          <span style={{ color: '#ff6b6b' }}>
            <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '5px' }} />
            {error}
          </span>
        ) : status}
      </StatusText>
      
      {/* Transcription Display */}
      <TranscriptionContainer visible={!!transcription.trim()}>
        {transcription}
      </TranscriptionContainer>
      
      {/* Control Buttons */}
      <ButtonsContainer>
        {/* Auto Play Toggle */}
        <AudioButton 
          onClick={toggleAutoPlay}
          theme={theme}
        >
          <FontAwesomeIcon icon={autoPlay ? faVolumeUp : faVolumeOff} />
        </AudioButton>

        {/* Play AI Response */}
        <AudioButton 
          onClick={() => latestAiMessage && speakAiResponse(latestAiMessage)}
          disabled={!latestAiMessage || isBotSpeaking}
          theme={theme}
        >
          <FontAwesomeIcon icon={faPlay} />
        </AudioButton>
        
        {/* Record Button */}
        <AudioButton 
          size="large"
          primary
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isBotSpeaking || isProcessing}
          theme={theme}
        >
          {isProcessing ? (
            <FontAwesomeIcon icon={faSpinner} spin />
          ) : (
            <FontAwesomeIcon icon={isRecording ? faStop : faMicrophone} />
          )}
          {isRecording && <PulseAnimation isRecording={true} />}
        </AudioButton>
        
        {/* Pause/Resume Button */}
        <AudioButton 
          onClick={togglePause}
          disabled={!isRecording || isProcessing}
          theme={theme}
        >
          <FontAwesomeIcon icon={isPaused ? faPlay : faPause} />
        </AudioButton>
        
        {/* Success Indicator when processed */}
        <AudioButton 
          theme={theme}
          disabled={true}
          style={{ opacity: isProcessing ? 0 : 1 }}
        >
          <FontAwesomeIcon icon={faCheckCircle} />
        </AudioButton>
      </ButtonsContainer>
    </AudioContainer>
  );
};

export default AudioConversation; 