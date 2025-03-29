// Audio Configuration
const defaultConfig = {
  languageCode: 'en-US',
  name: 'en-US-Neural2-F',
  audioEncoding: 'MP3',
  pitch: 0,
  speakingRate: 1,
};

/**
 * Cleans text by removing special characters and normalizing whitespace
 * @param {string} text - Text to clean
 * @returns {string} - Cleaned text
 */
export const cleanText = (text) => {
  return text
    .replace(/[^\w\s.,!?-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Creates an audio context for visualization and processing
 * @returns {AudioContext} - The created AudioContext
 */
export const createAudioContext = () => {
  return new (window.AudioContext || window.webkitAudioContext)();
};

/**
 * Converts text to speech using Google Text-to-Speech API
 * @param {string} text - Text to convert to speech
 * @param {Object} config - Configuration options for text-to-speech
 * @returns {Promise<string>} - Audio data URL
 */
export const convertTextToSpeech = async (text, config = {}) => {
  if (!text || text.trim() === '') {
    console.error('Empty text provided to text-to-speech');
    return ''; // Return empty string for empty text
  }
  
  const mergedConfig = { ...defaultConfig, ...config };
  const cleanedText = cleanText(text);
  
  // Limit text length to prevent API errors
  const maxLength = 5000;
  const truncatedText = cleanedText.length > maxLength 
    ? cleanedText.substring(0, maxLength) + '...' 
    : cleanedText;

  const url = `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=AIzaSyCoMJX5afK5Ic0F5UQVHyfrbx6apQAAVWA`;
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      input: {
        text: truncatedText,
      },
      voice: {
        languageCode: mergedConfig.languageCode,
        name: mergedConfig.name,
      },
      audioConfig: {
        audioEncoding: mergedConfig.audioEncoding,
        effectsProfileId: ['handset-class-device'],
        pitch: mergedConfig.pitch,
        speakingRate: mergedConfig.speakingRate,
      },
    }),
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Text-to-speech request failed: ${response.status}`, errorText);
      throw new Error(`Text-to-speech request failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.audioContent) {
      console.error('No audio content in response:', data);
      throw new Error('No audio content in response');
    }

    return `data:audio/mp3;base64,${data.audioContent}`;
  } catch (error) {
    console.error('Error converting text to speech:', error);
    
    // Return a fallback empty audio data URL
    return '';
  }
};

/**
 * Plays audio from a data URL and returns a promise that resolves when playback is complete
 * @param {string} audioUri - Audio data URL
 * @param {function} onStart - Callback when audio starts playing
 * @param {function} onEnd - Callback when audio ends
 * @returns {Promise<HTMLAudioElement>} - Promise that resolves with the audio element when playback is complete
 */
export const playAudio = (audioUri, onStart = () => {}, onEnd = () => {}) => {
  return new Promise((resolve, reject) => {
    if (!audioUri) {
      reject(new Error('No audio URI provided'));
      return;
    }
    
    const audio = new Audio(audioUri);
    
    audio.oncanplaythrough = () => {
      audio.play()
        .then(() => {
          onStart();
        })
        .catch(error => {
          console.error('Error playing audio:', error);
          reject(error);
        });
    };
    
    audio.onended = () => {
      onEnd();
      resolve(audio);
    };
    
    audio.onerror = (error) => {
      console.error('Audio playback error:', error);
      reject(error);
    };
  });
};

/**
 * Creates an enhanced speech recognition instance with silence detection
 * @param {Object} options - Configuration options
 * @param {string} options.language - Language code (e.g., 'en-US')
 * @param {number} options.silenceThreshold - Time in ms to consider silence as end of speech
 * @param {number} options.briefPauseThreshold - Time in ms to detect brief pauses (but not end speech)
 * @param {function} options.onResult - Callback for interim and final results
 * @param {function} options.onSilence - Callback when silence (speech completion) is detected
 * @param {function} options.onBriefPause - Callback when a brief pause is detected
 * @param {function} options.onError - Callback when an error occurs
 * @returns {Object} - Enhanced speech recognition controller
 */
export const createEnhancedSpeechRecognition = ({
  language = 'en-US',
  silenceThreshold = 2500, // Longer silence for message completion
  briefPauseThreshold = 1000, // Brief pause detection
  onResult = () => {},
  onSilence = () => {},
  onBriefPause = () => {}, // New callback for brief pauses
  onError = () => {},
  onStart = () => {},
  onEnd = () => {}
}) => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.error('Speech recognition not supported in this browser');
    onError(new Error('Speech recognition not supported'));
    return null;
  }
  
  // Use the appropriate constructor
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  // Configure recognition
  recognition.lang = language;
  recognition.continuous = true;
  recognition.interimResults = true;
  
  let silenceTimer = null;
  let briefPauseTimer = null;
  let lastResult = '';
  let isSpeaking = false;
  let isListening = false;
  
  recognition.onstart = () => {
    isListening = true;
    onStart();
  };
  
  recognition.onend = () => {
    isListening = false;
    onEnd();
  };
  
  recognition.onresult = (event) => {
    const result = Array.from(event.results)
      .map(result => result[0].transcript)
      .join(' ');
    
    const isFinal = event.results[event.results.length - 1].isFinal;
    
    // Reset silence timer and brief pause timer whenever we get a result
    clearTimeout(silenceTimer);
    clearTimeout(briefPauseTimer);
    
    // If we're getting results, the user is speaking
    if (!isSpeaking) {
      isSpeaking = true;
    }
    
    onResult({
      transcript: result,
      isFinal: isFinal
    });
    
    // Set up brief pause detection timer
    briefPauseTimer = setTimeout(() => {
      if (isSpeaking) {
        // This is a brief pause, not a completion
        onBriefPause();
      }
    }, briefPauseThreshold);
    
    // Set up silence timer for message completion
    silenceTimer = setTimeout(() => {
      if (isSpeaking) {
        isSpeaking = false;
        clearTimeout(briefPauseTimer); // Clear brief pause timer
        onSilence(lastResult || result);
      }
    }, silenceThreshold);
    
    if (isFinal) {
      lastResult = result;
    }
  };
  
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    onError(new Error(event.error));
  };
  
  return {
    start() {
      try {
        if (!isListening) {
          recognition.start();
        }
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        onError(error);
      }
    },
    stop() {
      try {
        if (isListening) {
          recognition.stop();
          clearTimeout(silenceTimer);
          clearTimeout(briefPauseTimer);
        }
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    },
    abort() {
      try {
        recognition.abort();
        clearTimeout(silenceTimer);
        clearTimeout(briefPauseTimer);
      } catch (error) {
        console.error('Error aborting speech recognition:', error);
      }
    },
    isListening: () => isListening
  };
};

/**
 * Get available voice models for synthesis
 * @returns {Array<Object>} - Array of voice models
 */
export const getVoiceModels = () => {
  return [
    { id: 'en-US-Neural2-F', name: 'US English - Female (Neural)', gender: 'female' },
    { id: 'en-US-Neural2-M', name: 'US English - Male (Neural)', gender: 'male' },
    { id: 'en-GB-Neural2-B', name: 'British English - Male', gender: 'male' },
    { id: 'en-GB-Neural2-C', name: 'British English - Female', gender: 'female' },
    { id: 'en-AU-Neural2-B', name: 'Australian English - Male', gender: 'male' },
    { id: 'en-AU-Neural2-C', name: 'Australian English - Female', gender: 'female' }
  ];
};

/**
 * Create a modern audio visualizer with customizable effects
 * @param {HTMLCanvasElement} canvas - Canvas element to draw on
 * @param {AudioContext} audioContext - Audio context 
 * @param {Object} options - Visualization options
 * @returns {Object} - Visualizer controller
 */
export const createVisualizer = (canvas, audioContext, options = {}) => {
  const opts = {
    barWidth: 4,
    barSpacing: 1,
    barColor: '#7a7acf',
    barGradient: true,
    barMinHeight: 3,
    responsive: true,
    smoothing: 0.8,
    fftSize: 1024,
    ...options
  };
  
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = opts.fftSize;
  analyser.smoothingTimeConstant = opts.smoothing;
  
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  const canvasCtx = canvas.getContext('2d');
  
  let animationFrame = null;
  let isActive = false;
  
  const fitCanvas = () => {
    if (!opts.responsive) return;
    
    const devicePixelRatio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    
    canvasCtx.scale(devicePixelRatio, devicePixelRatio);
  };
  
  if (opts.responsive) {
    window.addEventListener('resize', fitCanvas);
    fitCanvas();
  }
  
  const draw = () => {
    if (!isActive) return;
    
    animationFrame = requestAnimationFrame(draw);
    
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    
    analyser.getByteFrequencyData(dataArray);
    
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    
    const effectiveWidth = WIDTH / (window.devicePixelRatio || 1);
    const effectiveHeight = HEIGHT / (window.devicePixelRatio || 1);
    
    const barsCount = Math.floor(effectiveWidth / (opts.barWidth + opts.barSpacing));
    const barWidth = opts.barWidth;
    const frequencyStep = Math.floor(bufferLength / barsCount);
    
    for (let i = 0; i < barsCount; i++) {
      const freqIndex = i * frequencyStep;
      let value = 0;
      
      // Average multiple frequency values for smoother visualization
      for (let j = 0; j < frequencyStep && freqIndex + j < bufferLength; j++) {
        value += dataArray[freqIndex + j];
      }
      
      value = value / frequencyStep;
      
      // Scale the bar height
      const barHeight = Math.max(
        opts.barMinHeight, 
        (value / 255) * effectiveHeight
      );
      
      const x = i * (barWidth + opts.barSpacing);
      
      // Create gradient if enabled and ensure barHeight is valid to prevent non-finite errors
      if (opts.barGradient && isFinite(barHeight) && barHeight > 0) {
        try {
          const gradient = canvasCtx.createLinearGradient(0, effectiveHeight, 0, effectiveHeight - barHeight);
          gradient.addColorStop(0, opts.barColor);
          gradient.addColorStop(1, lightenColor(opts.barColor, 30));
          canvasCtx.fillStyle = gradient;
        } catch (error) {
          // Fallback to solid color if gradient creation fails
          console.error('Gradient creation failed:', error);
          canvasCtx.fillStyle = opts.barColor;
        }
      } else {
        canvasCtx.fillStyle = opts.barColor;
      }
      
      // Only draw if we have valid dimensions
      if (isFinite(x) && isFinite(barHeight) && barWidth > 0 && barHeight > 0) {
        canvasCtx.fillRect(x, effectiveHeight - barHeight, barWidth, barHeight);
      }
    }
  };
  
  // Helper function to lighten a color
  const lightenColor = (color, percent) => {
    try {
      // Default to a fallback color if the input is invalid
      if (!color || typeof color !== 'string' || !color.startsWith('#')) {
        color = '#7a7acf'; // Default fallback color
      }
      
      // Ensure percent is a valid number
      percent = isFinite(percent) ? Math.min(100, Math.max(0, percent)) : 30;
      
      const num = parseInt(color.replace('#', ''), 16);
      // Check if we have a valid number
      if (!isFinite(num)) return color;
      
      const amt = Math.round(2.55 * percent);
      const R = (num >> 16) + amt;
      const G = (num >> 8 & 0x00FF) + amt;
      const B = (num & 0x0000FF) + amt;
      
      return '#' + (
        0x1000000 + 
        (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
        (B < 255 ? B < 1 ? 0 : B : 255)
      ).toString(16).slice(1);
    } catch (error) {
      console.error('Error in lightenColor:', error);
      return color; // Return original color on error
    }
  };
  
  return {
    connect(source) {
      source.connect(analyser);
      return this;
    },
    start() {
      isActive = true;
      draw();
      return this;
    },
    stop() {
      isActive = false;
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      return this;
    },
    update(newOptions) {
      Object.assign(opts, newOptions);
      if (opts.responsive) {
        fitCanvas();
      }
      return this;
    },
    getAnalyser() {
      return analyser;
    }
  };
}; 