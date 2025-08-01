import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Heart, Shield, Clock, Sparkles, Sun, Feather } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPaperPlane, faSpinner } from '@fortawesome/free-solid-svg-icons';
import {
  faTwitter,
  faLinkedin,
  faInstagram,
  faFacebook
} from '@fortawesome/free-brands-svg-icons';
import axios from 'axios';
import { toast } from 'react-toastify';
import genToken from './utils/genToken';

const LandingPage = ({ onStartChat }) => {
  const navigate = useNavigate();
  const [showTrialChat, setShowTrialChat] = useState(false);
  const [trialMessage, setTrialMessage] = useState('');
  const [trialResponses, setTrialResponses] = useState(() => {
    // Load previous responses from localStorage
    const saved = localStorage.getItem('trialResponses');
    return saved ? JSON.parse(saved) : [];
  });
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trialCount, setTrialCount] = useState(() => {
    // Load trial count from localStorage
    return parseInt(localStorage.getItem('trialCount') || '0');
  });
  const MAX_TRIAL_MESSAGES = 5;

  // Save responses and count to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('trialResponses', JSON.stringify(trialResponses));
    localStorage.setItem('trialCount', trialCount.toString());
    // Add timestamp to track when trial started
    if (trialCount === 1) {
      localStorage.setItem('trialStartDate', new Date().toISOString());
    }
  }, [trialResponses, trialCount]);

  const checkTrialExpiry = () => {
    const trialStartDate = localStorage.getItem('trialStartDate');
    if (trialStartDate) {
      const startDate = new Date(trialStartDate);
      const now = new Date();
      const daysSinceStart = (now - startDate) / (1000 * 60 * 60 * 24);
      
      // Reset trial after 30 days
      if (daysSinceStart >= 30) {
        localStorage.removeItem('trialCount');
        localStorage.removeItem('trialResponses');
        localStorage.removeItem('trialStartDate');
        setTrialCount(0);
        setTrialResponses([]);
        return false;
      }
    }
    return trialCount >= MAX_TRIAL_MESSAGES;
  };

  const handleStartChat = () => {
    onStartChat();
    navigate('/chat');
  };

  const generateAIResponse = async (prompt) => {
    setLoading(true);
    try {
      const PROJECT_ID = "buzz-chat-17759";
      const LOCATION_ID = "us-central1";
      const API_ENDPOINT = "us-central1-aiplatform.googleapis.com";
      const MODEL_ID = "gemini-1.5-flash-002";

      const url = `https://${API_ENDPOINT}/v1/projects/${PROJECT_ID}/locations/${LOCATION_ID}/publishers/google/models/${MODEL_ID}:generateContent`;

      const data = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          topP: 0.95,
          seed: 0,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "OFF" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "OFF" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "OFF" },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "OFF" },
        ],
        tools: [{ googleSearchRetrieval: {} }],
      };

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await genToken()}`,
      };

      const response = await axios.post(url, data, { headers });
      const cleanedResponse = response.data.candidates[0].content.parts[0].text
        .replace(/```json\s*|\s*```/g, "")
        .trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error("Error generating AI response with token, trying fallback with API key:", error);
      
      // Fallback to Gemini API with API key
      try {
        const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
        
        if (!GEMINI_API_KEY) {
          console.error("GEMINI_API_KEY not found in environment variables");
          toast.error("Failed to generate AI response. Please try again.");
          return null;
        }

        const fallbackUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
        
        const fallbackData = {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        };

        const fallbackHeaders = {
          'Content-Type': 'application/json',
          'X-goog-api-key': GEMINI_API_KEY
        };

        const fallbackResponse = await axios.post(fallbackUrl, fallbackData, { headers: fallbackHeaders });
        
        if (!fallbackResponse.data || !fallbackResponse.data.candidates || !fallbackResponse.data.candidates[0]) {
          console.error("Fallback API response is invalid");
          toast.error("Failed to generate AI response. Please try again.");
          return null;
        }
        
        const fallbackText = fallbackResponse.data.candidates[0].content.parts[0].text;
        const cleanedFallbackResponse = fallbackText
          .replace(/```json\s*|\s*```/g, "")
          .trim();
          
        // Try to parse as JSON, if it fails, return the text as is
        try {
          return JSON.parse(cleanedFallbackResponse);
        } catch (parseError) {
          console.warn("Fallback response is not valid JSON, returning as text");
          return { message: cleanedFallbackResponse };
        }
        
      } catch (fallbackError) {
        console.error("Fallback API also failed:", fallbackError);
        toast.error("Failed to generate AI response. Please try again.");
        return null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTrialMessage = async () => {
    if (!trialMessage.trim() || checkTrialExpiry()) return;

    setTrialResponses(prev => [...prev, {
      text: trialMessage,
      isUser: true,
      timestamp: new Date().toISOString()
    }]);
    
    setIsTyping(true);
    const userInput = trialMessage;
    setTrialMessage('');
    setTrialCount(prev => prev + 1);

    try {
      const prompt = `
        As an empathetic AI counselor, provide a warm, understanding response 
        to someone who has just shared their grief situation. Their message: "${userInput}"
        ${trialCount === MAX_TRIAL_MESSAGES - 1 ? 
          '\nThis is their last trial message, so gently encourage them to sign up for continued support.' : ''}
        
        Format your response as a JSON object with this structure:
        {
          "message": "your empathetic response here"
        }
      `;

      const response = await generateAIResponse(prompt);
      
      if (response && response.message) {
        setTrialResponses(prev => [...prev, {
          text: response.message,
          isUser: false,
          timestamp: new Date().toISOString(),
          cta: trialCount >= MAX_TRIAL_MESSAGES - 1 ? 
            'You have reached the end of your trial. Sign up to continue our conversation and access full support.' : 
            undefined
        }]);
      } else {
        setTrialResponses(prev => [...prev, {
          text: "I apologize, but I'm having trouble responding right now. Please try again.",
          isUser: false,
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setTrialResponses(prev => [...prev, {
        text: "I apologize, but I'm having trouble responding right now. Please try again.",
        isUser: false,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderTrialCounter = () => {
    if (checkTrialExpiry()) {
      return (
        <div className="text-center p-3 bg-indigo-50 rounded-lg mt-2">
          <p className="text-sm text-gray-600 mb-2">
            Trial messages limit reached
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm hover:bg-indigo-700 transition-colors"
          >
            Sign Up to Continue
          </button>
        </div>
      );
    }
    return (
      <div className="text-sm text-gray-600 text-center mt-2">
        {MAX_TRIAL_MESSAGES - trialCount} messages remaining in trial
      </div>
    );
  };

  // Update the chat input section to show trial status
  const renderChatInput = () => (
    <div className="p-4 border-t">
      <div className="flex gap-2">
        <input
          type="text"
          value={trialMessage}
          onChange={(e) => setTrialMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleTrialMessage()}
          placeholder={checkTrialExpiry() ? 
            "Trial ended. Please sign up to continue." : 
            "Share what's on your mind..."}
          className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 
                   focus:ring-indigo-300"
          disabled={checkTrialExpiry()}
        />
        <button
          onClick={handleTrialMessage}
          disabled={checkTrialExpiry()}
          className={`p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 
                    transition duration-300 ${checkTrialExpiry() ? 
                    'opacity-50 cursor-not-allowed' : ''}`}
        >
          <FontAwesomeIcon icon={isTyping ? faSpinner : faPaperPlane} spin={isTyping} />
        </button>
      </div>
      {renderTrialCounter()}
    </div>
  );

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false,
    dotsClass: 'slick-dots !bottom-[-40px]',
  };

  return (
    <div className="font-sans text-gray-800 bg-gradient-to-b from-blue-50 via-white to-indigo-50 min-h-screen">
      {/* Hero Section with Floating Elements - Enhanced */}
      <div className="relative min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 md:py-20 overflow-hidden">
        {/* Enhanced background animations */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 via-purple-500/20 to-pink-500/20"
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.3 }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          />
          
          {/* Elegant floating elements */}
          <svg className="absolute w-full h-full">
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="10" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
          </svg>
          
          {[...Array(window.innerWidth > 768 ? 14 : 7)].map((_, index) => (
            <motion.div
              key={index}
              className="absolute rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center filter"
              style={{
                width: Math.random() * (window.innerWidth > 768 ? 100 : 60) + 50,
                height: Math.random() * (window.innerWidth > 768 ? 100 : 60) + 50,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                filter: 'drop-shadow(0 0 8px rgba(129, 140, 248, 0.5))',
                boxShadow: '0 0 20px rgba(129, 140, 248, 0.2) inset',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: Math.random() * 5 + 3,
                repeat: Infinity,
                repeatType: "reverse",
                delay: Math.random() * 2,
              }}
            >
              {index % 3 === 0 && <Sparkles className="text-indigo-400/50" size={window.innerWidth > 768 ? 20 : 16} />}
              {index % 3 === 1 && <Sun className="text-purple-400/50" size={window.innerWidth > 768 ? 22 : 18} />}
              {index % 3 === 2 && <Feather className="text-pink-400/50" size={window.innerWidth > 768 ? 24 : 20} />}
            </motion.div>
          ))}
        </div>

        {/* Enhanced main content */}
        <motion.div 
          className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <motion.div
            className="mb-6 relative inline-block"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-transparent bg-clip-text leading-tight tracking-tighter">
            Bereavemently
          </h1>
            <motion.div 
              className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-70"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.5, duration: 1 }}
            />
          </motion.div>

          <p className="text-xl md:text-2xl lg:text-3xl mb-8 font-light text-gray-700 leading-relaxed max-w-3xl mx-auto">
            A <span className="italic text-indigo-700">gentle companion</span> for your journey through grief,
            <br className="hidden sm:block" />
            available whenever you need a moment of understanding.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-10">
            <motion.button
              onClick={handleStartChat}
              className="px-10 py-4 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white 
                       rounded-full shadow-xl hover:shadow-2xl transition duration-300 flex items-center 
                       justify-center group relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative z-10">Begin Your Journey</span>
              <Sun className="ml-3 relative z-10 group-hover:rotate-90 transition-transform duration-300" />
            </motion.button>

            <motion.button
              onClick={() => setShowTrialChat(true)}
              className="px-10 py-4 text-lg border-2 border-indigo-600 text-indigo-600 
                       rounded-full hover:bg-indigo-50 transition duration-300 relative overflow-hidden group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="absolute inset-0 bg-indigo-50 transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300"></span>
              <span className="relative z-10">Try a Gentle Chat</span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Testimonials Section */}
      <section className="py-24 bg-gradient-to-b from-white to-indigo-50 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 to-transparent opacity-50"></div>
        
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-700 bg-clip-text text-transparent">
            Healing Stories
            </h2>
            <div className="h-1 w-20 bg-gradient-to-r from-indigo-600 to-purple-600 mx-auto"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "In my darkest moments, Bereavemently was there to listen without judgment.",
                author: "Sarah M.",
                emotion: "Finding Light",
                color: "from-indigo-600 to-blue-600"
              },
              {
                quote: "The AI's gentle guidance helped me process my grief in ways I never expected.",
                author: "James K.",
                emotion: "Growing Stronger",
                color: "from-purple-600 to-pink-600"
              },
              {
                quote: "Having support available 24/7 made all the difference in my healing journey.",
                author: "Emily R.",
                emotion: "Moving Forward",
                color: "from-indigo-600 to-purple-600"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg relative overflow-hidden border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ 
                  y: -5, 
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
                  borderColor: "rgba(129, 140, 248, 0.5)"
                }}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${testimonial.color} rounded-bl-full opacity-10`} />
                <div className="text-4xl text-indigo-200 mb-4 font-serif">"</div>
                <p className="text-gray-700 mb-6 relative z-10 text-lg italic">{testimonial.quote}</p>
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r ${testimonial.color} bg-opacity-10`}>
                    <Heart className="text-indigo-600" size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{testimonial.author}</p>
                    <p className="text-indigo-600 text-sm">{testimonial.emotion}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Features Section with Animation */}
      <section className="py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white to-transparent z-10"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div 
            className="text-center mb-16 md:mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-indigo-600 mb-6">
              Your Companion Through Grief
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Available 24/7 with understanding, empathy, and guidance
            </p>
            <div className="h-1 w-20 bg-gradient-to-r from-indigo-600 to-purple-600 mx-auto mt-6"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {[
              {
                icon: <Clock size={32} />,
                title: "Always Here",
                description: "Find support any time, day or night, whenever you need someone to talk to.",
                gradient: "from-blue-600 to-indigo-600"
              },
              {
                icon: <Heart size={32} />,
                title: "Empathetic Understanding",
                description: "Experience compassionate responses tailored to your unique journey.",
                gradient: "from-indigo-600 to-purple-600"
              },
              {
                icon: <Shield size={32} />,
                title: "Safe Space",
                description: "Share freely in a private, judgment-free environment focused on your healing.",
                gradient: "from-purple-600 to-pink-600"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="p-8 bg-white rounded-2xl shadow-lg border border-gray-100
                           hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -5, borderColor: "rgba(129, 140, 248, 0.5)" }}
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center 
                              text-white mb-6 transform -rotate-3 shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
                <div className="mt-6 w-12 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Existing Trial Chat Modal */}
      <motion.div 
        className={`fixed md:right-4 z-50 w-full md:w-96
          ${showTrialChat ? 
            'inset-x-0 bottom-0 md:bottom-4 h-[80vh] md:h-[600px]' : 
            'bottom-4 md:bottom-4'}`}
      >
        {!showTrialChat ? (
          <div className="px-4 md:px-0">
          <button
            onClick={() => setShowTrialChat(true)}
              className="w-full md:w-auto px-6 py-4 bg-indigo-600 text-white rounded-full
                       shadow-lg hover:bg-indigo-700 transition duration-300 text-base sm:text-lg
                       flex items-center justify-center space-x-2"
          >
              <span>Tell us what brings you here today</span>
              <ChevronRight className="w-5 h-5" />
          </button>
          </div>
        ) : (
          <div className="bg-white h-full w-full md:w-auto rounded-t-xl md:rounded-lg shadow-xl 
                        flex flex-col overflow-hidden">
            {/* Chat header */}
            <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
              <h3 className="font-semibold text-lg">Chat with Bereavemently</h3>
              <button 
                onClick={() => setShowTrialChat(false)}
                className="p-2 hover:bg-indigo-700 rounded-full transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Chat messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {trialResponses.length === 0 && (
                <div className="text-center text-gray-600 mt-4">
                  <p>Welcome to Bereavemently. What brings you here today?</p>
                  <p className="text-sm mt-2">Feel free to share - this is a safe space.</p>
                </div>
              )}

              {trialResponses.map((response, index) => (
                <div
                  key={index}
                  className={`mb-4 ${response.isUser ? 'text-right' : 'text-left'}`}
                >
                  <div
                    className={`inline-block p-3 rounded-lg max-w-[80%] ${
                      response.isUser ? 
                        'bg-indigo-600 text-white' : 
                        'bg-white shadow-md'
                    }`}
                  >
                    <p>{response.text}</p>
                    {response.cta && (
                      <div className="mt-3 text-sm">
                        <p className="text-indigo-600">{response.cta}</p>
                        <button
                          onClick={() => navigate('/signup')}
                          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-sm hover:bg-indigo-700"
                        >
                          Sign Up Free
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="text-gray-500 text-sm">
                  Bereavemently is typing...
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={trialMessage}
                  onChange={(e) => setTrialMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTrialMessage()}
                  placeholder={checkTrialExpiry() ? 
                    "Trial ended. Please sign up to continue." : 
                    "Share what's on your mind..."}
                  className="flex-1 px-4 py-3 border rounded-full focus:outline-none focus:ring-2 
                           focus:ring-indigo-300 text-base"
                  disabled={checkTrialExpiry()}
                />
                <button
                  onClick={handleTrialMessage}
                  disabled={checkTrialExpiry()}
                  className={`p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 
                            transition duration-300 ${checkTrialExpiry() ? 
                            'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <FontAwesomeIcon icon={isTyping ? faSpinner : faPaperPlane} spin={isTyping} />
                </button>
              </div>
              {renderTrialCounter()}
            </div>
          </div>
        )}
      </motion.div>

      {/* Third Party In-App Purchase Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Third-Party In-App Purchases
                </h3>
                <p className="text-blue-100">
                  Some features in Bereavemently may include in-app purchases processed by third-party payment providers. 
                  Additional terms and conditions may apply. Subscription fees are handled securely through Stripe payment processing.
                </p>
              </div>
              <a 
                href="/privacy-policy" 
                className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 rounded-full font-semibold hover:bg-blue-50 transition-colors duration-300"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Pilot Program Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-50 to-blue-50 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-pattern-dots opacity-5"></div>
        
        {/* Floating elements */}
        {[...Array(6)].map((_, index) => (
          <motion.div
            key={index}
            className="absolute rounded-full bg-white shadow-md"
            style={{
              width: Math.random() * 60 + 20,
              height: Math.random() * 60 + 20,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: 0.3
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: Math.random() * 5 + 3,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        ))}
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-white/80 backdrop-blur-md p-10 md:p-16 rounded-3xl shadow-xl border border-indigo-100">
            <div className="text-center max-w-3xl mx-auto">
              <motion.h2 
                className="text-3xl md:text-4xl font-bold text-gray-900 mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  Pilot Program
                </span>
              </motion.h2>
              <motion.p 
                className="text-xl text-gray-600 mb-10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                Join our exclusive pilot program and be among the first to experience our innovative AI-powered grief support platform.
              </motion.p>
              <motion.button
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:shadow-lg hover:shadow-indigo-200 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Join the Pilot Program
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* Add CSS for the background patterns */}
      <style jsx>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        
        .bg-pattern-dots {
          background-image: radial-gradient(rgba(129, 140, 248, 0.4) 2px, transparent 2px);
          background-size: 30px 30px;
        }
      `}</style>

      {/* Enhanced Elegant Footer */}
      <footer className="bg-gradient-to-b from-white to-indigo-50 pt-20 pb-10 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent opacity-70"></div>
        <div className="absolute inset-0 bg-pattern-dots opacity-[0.03]"></div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-14">
            {/* Company info */}
            <div className="col-span-1 md:col-span-2 lg:col-span-1">
              <div className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                <h3 className="text-2xl font-bold mb-6">Bereavemently</h3>
              </div>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Providing compassionate AI support for those navigating the journey of grief and loss.
              </p>
              <div className="flex space-x-5">
                <a 
                  href="#" 
                  className="text-indigo-500 hover:text-indigo-700 transition-colors duration-300 transform hover:scale-110"
                  aria-label="Twitter"
                >
                  <FontAwesomeIcon icon={faTwitter} size="lg" />
                </a>
                <a 
                  href="#" 
                  className="text-indigo-500 hover:text-indigo-700 transition-colors duration-300 transform hover:scale-110"
                  aria-label="LinkedIn"
                >
                  <FontAwesomeIcon icon={faLinkedin} size="lg" />
                </a>
                <a 
                  href="#" 
                  className="text-indigo-500 hover:text-indigo-700 transition-colors duration-300 transform hover:scale-110"
                  aria-label="Instagram"
                >
                  <FontAwesomeIcon icon={faInstagram} size="lg" />
                </a>
                <a 
                  href="#" 
                  className="text-indigo-500 hover:text-indigo-700 transition-colors duration-300 transform hover:scale-110"
                  aria-label="Facebook"
                >
                  <FontAwesomeIcon icon={faFacebook} size="lg" />
                </a>
              </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 col-span-1 md:col-span-2 lg:col-span-3 gap-8 md:gap-10">
              <div>
                <h4 className="text-base font-semibold text-gray-900 uppercase tracking-wider mb-5">Resources</h4>
                <ul className="space-y-4">
                  <li>
                    <a href="https://missumuch.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-indigo-600 transition-colors duration-300 flex items-center">
                      <ChevronRight className="w-4 h-4 mr-2 text-indigo-400" />
                      Missumuch.com
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors duration-300 flex items-center">
                      <ChevronRight className="w-4 h-4 mr-2 text-indigo-400" />
                      Support Articles
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-base font-semibold text-gray-900 uppercase tracking-wider mb-5">Company</h4>
                <ul className="space-y-4">
                  <li>
                    <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors duration-300 flex items-center">
                      <ChevronRight className="w-4 h-4 mr-2 text-indigo-400" />
                      About Us
                    </a>
                  </li>
                  <li>
                    <a href="/privacy-policy" className="text-gray-600 hover:text-indigo-600 transition-colors duration-300 flex items-center">
                      <ChevronRight className="w-4 h-4 mr-2 text-indigo-400" />
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors duration-300 flex items-center">
                      <ChevronRight className="w-4 h-4 mr-2 text-indigo-400" />
                      Terms
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-base font-semibold text-gray-900 uppercase tracking-wider mb-5">Contact</h4>
                <ul className="space-y-4">
                  <li>
                    <a href="mailto:Christine@missumuch.com" className="text-gray-600 hover:text-indigo-600 transition-colors duration-300 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Christine@missumuch.com
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-14 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-gray-500 text-sm text-center md:text-left">
                © {new Date().getFullYear()} Bereavemently. All rights reserved.
              </p>
              <div className="flex space-x-6">
                <a href="/privacy-policy" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors duration-300">
                  Privacy Policy
                </a>
                <a href="#" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors duration-300">
                  Terms of Service
                </a>
                <a href="#" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors duration-300">
                  Cookies
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;