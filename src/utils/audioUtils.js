// Audio Configuration
const defaultConfig = {
  languageCode: 'en-US',
  name: 'en-US-Chirp3-HD-Puck',
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
 * Plays audio from a data URL
 * @param {string} audioUri - Audio data URL
 * @returns {Promise<void>}
 */
export const playAudio = async (audioUri) => {
  try {
    const audio = new Audio(audioUri);
    await audio.play();
    
    return new Promise((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = (error) => reject(error);
    });
  } catch (error) {
    console.error('Error playing audio:', error);
    throw error;
  }
};

/**
 * Creates a speech recognition instance with the specified language
 * @param {string} language - Language code (e.g., 'en-US')
 * @returns {SpeechRecognition|null} - SpeechRecognition instance or null if not supported
 */
export const createSpeechRecognition = (language = 'en-US') => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.error('Speech recognition not supported in this browser');
    return null;
  }
  
  // Use the appropriate constructor
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  // Configure recognition
  recognition.lang = language;
  recognition.continuous = false;
  recognition.interimResults = true;
  
  return recognition;
};

/**
 * Get available voices for speech synthesis
 * @returns {Promise<SpeechSynthesisVoice[]>} - Array of available voices
 */
export const getAvailableVoices = () => {
  return new Promise((resolve) => {
    // Check if speechSynthesis is available
    if (!window.speechSynthesis) {
      console.error('Speech synthesis not supported in this browser');
      resolve([]);
      return;
    }
    
    // Get voices
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
    } else {
      // Wait for voices to be loaded
      window.speechSynthesis.onvoiceschanged = () => {
        resolve(window.speechSynthesis.getVoices());
      };
    }
  });
};

/**
 * Visualize audio data on canvas
 * @param {HTMLCanvasElement} canvas - Canvas element to draw on
 * @param {AudioNode} source - Audio source node
 * @param {AudioContext} audioContext - Audio context
 * @returns {AnalyserNode} - Analyser node for cleanup
 */
export const visualizeAudio = (canvas, source, audioContext) => {
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);
  
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  const canvasCtx = canvas.getContext('2d');
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  
  const draw = () => {
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    
    requestAnimationFrame(draw);
    
    analyser.getByteFrequencyData(dataArray);
    
    canvasCtx.fillStyle = 'rgb(0, 0, 0)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
    
    const barWidth = (WIDTH / bufferLength) * 2.5;
    let barHeight;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] / 2;
      
      const gradient = canvasCtx.createLinearGradient(0, 0, 0, HEIGHT);
      gradient.addColorStop(0, '#7a7acf');
      gradient.addColorStop(1, '#4a4aad');
      
      canvasCtx.fillStyle = gradient;
      canvasCtx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
      
      x += barWidth + 1;
    }
  };
  
  draw();
  return analyser;
}; 