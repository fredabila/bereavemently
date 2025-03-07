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
      console.error("Error generating AI response:", error);
      toast.error("Failed to generate AI response. Please try again.");
      return null;
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
    <div className="font-sans text-gray-800 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      {/* Hero Section with Floating Elements */}
      <div className="relative min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* Background animations */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 via-purple-500/20 to-pink-500/20"
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.3 }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          />
          
          {/* Reduce number of floating elements on mobile */}
          {[...Array(window.innerWidth > 768 ? 12 : 6)].map((_, index) => (
            <motion.div
              key={index}
              className="absolute rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center"
              style={{
                width: Math.random() * (window.innerWidth > 768 ? 100 : 60) + 50,
                height: Math.random() * (window.innerWidth > 768 ? 100 : 60) + 50,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
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
              <Sparkles className="text-indigo-400/50" size={window.innerWidth > 768 ? 20 : 16} />
            </motion.div>
          ))}
        </div>

        {/* Main content */}
        <motion.div 
          className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-transparent bg-clip-text leading-tight">
            Bereavemently
          </h1>

          <p className="text-lg md:text-xl lg:text-2xl mb-8 font-light text-gray-700 leading-relaxed max-w-2xl mx-auto">
            A gentle AI companion for your journey through grief,
            <br className="hidden sm:block" />
            available whenever you need a moment of understanding.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.button
              onClick={handleStartChat}
              className="px-8 py-4 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white 
                         rounded-full shadow-lg hover:shadow-xl transition duration-300 flex items-center 
                         justify-center group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Begin Your Journey
              <Sun className="ml-2 group-hover:rotate-90 transition-transform duration-300" />
            </motion.button>

            <motion.button
              onClick={() => setShowTrialChat(true)}
              className="px-8 py-4 text-lg border-2 border-indigo-600 text-indigo-600 
                         rounded-full hover:bg-indigo-50 transition duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Try a Gentle Chat
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-b from-white to-indigo-50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2
            className="text-4xl font-bold text-center mb-16 text-indigo-600"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Healing Stories
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "In my darkest moments, Bereavemently was there to listen without judgment.",
                author: "Sarah M.",
                emotion: "Finding Light"
              },
              {
                quote: "The AI's gentle guidance helped me process my grief in ways I never expected.",
                author: "James K.",
                emotion: "Growing Stronger"
              },
              {
                quote: "Having support available 24/7 made all the difference in my healing journey.",
                author: "Emily R.",
                emotion: "Moving Forward"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-100 rounded-bl-full opacity-50" />
                <p className="text-gray-600 mb-6 relative z-10">{testimonial.quote}</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
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

      {/* Features Section with Animation */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-indigo-600 mb-4">
              Your Companion Through Grief
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Available 24/7 with understanding, empathy, and guidance
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: <Clock size={32} />,
                title: "Always Here",
                description: "Find support any time, day or night, whenever you need someone to talk to."
              },
              {
                icon: <Heart size={32} />,
                title: "Empathetic Understanding",
                description: "Experience compassionate responses tailored to your unique journey."
              },
              {
                icon: <Shield size={32} />,
                title: "Safe Space",
                description: "Share freely in a private, judgment-free environment focused on your healing."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="p-8 bg-gradient-to-br from-white to-indigo-50 rounded-2xl shadow-lg 
                           hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center 
                              text-indigo-600 mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
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

      {/* Pilot Program Section */}
      <section className="py-16 bg-gradient-to-r from-indigo-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Pilot Program</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Join our exclusive pilot program and be among the first to experience our innovative AI-powered grief support platform.
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="bg-indigo-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-indigo-700 transition-colors duration-300"
            >
              Join the Pilot Program
            </button>
          </div>
        </div>
      </section>

      {/* Elegant Footer */}
      <footer className="bg-gradient-to-b from-white to-indigo-50 pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {/* Company info */}
            <div className="col-span-1 md:col-span-2 lg:col-span-1">
              <h3 className="text-xl font-semibold text-indigo-600 mb-4">Bereavemently</h3>
              <p className="text-gray-600 mb-6">
                Providing compassionate AI support for those navigating the journey of grief and loss.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="#" 
                  className="text-indigo-600 hover:text-indigo-500 transition-colors duration-300"
                  aria-label="Twitter"
                >
                  <FontAwesomeIcon icon={faTwitter} size="lg" />
                </a>
                <a 
                  href="#" 
                  className="text-indigo-600 hover:text-indigo-500 transition-colors duration-300"
                  aria-label="LinkedIn"
                >
                  <FontAwesomeIcon icon={faLinkedin} size="lg" />
                </a>
                <a 
                  href="#" 
                  className="text-indigo-600 hover:text-indigo-500 transition-colors duration-300"
                  aria-label="Instagram"
                >
                  <FontAwesomeIcon icon={faInstagram} size="lg" />
                </a>
                <a 
                  href="#" 
                  className="text-indigo-600 hover:text-indigo-500 transition-colors duration-300"
                  aria-label="Facebook"
                >
                  <FontAwesomeIcon icon={faFacebook} size="lg" />
                </a>
              </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 col-span-1 md:col-span-2 lg:col-span-3 gap-8">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Resources</h4>
                <ul className="space-y-3">
                  <li>
                    <a href="https://missumuch.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-indigo-600 transition-colors duration-300">
                      Missumuch.com
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Company</h4>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors duration-300">
                      About Us
                    </a>
                  </li>
                  <li>
                    <a href="/privacy-policy" className="text-gray-600 hover:text-indigo-600 transition-colors duration-300">
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors duration-300">
                      Terms
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors duration-300">
                      Contact
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Contact</h4>
                <ul className="space-y-3">
                  <li>
                    <a href="mailto:Christine@missumuch.com" className="text-gray-600 hover:text-indigo-600 transition-colors duration-300">
                      Christine@missumuch.com
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-gray-500 text-sm text-center md:text-left">
                © {new Date().getFullYear()} Bereavemently. All rights reserved.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors duration-300">
                  Privacy Policy
                </a>
                <a href="#" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors duration-300">
                  Terms of Service
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