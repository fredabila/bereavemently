import React, { useState, useEffect, useRef } from "react";
import styled, { ThemeProvider, css } from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faUndoAlt,
  faMicrophone,
  faBook,
  faTimes,
  faPlus,
  faImage,
  faSmile,
  faHeart,
  faQuoteLeft,
  faLightbulb,
  faHandHoldingHeart,
  faSpinner
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { db, auth } from "./firebase"; // Your Firebase config
import { doc, getDoc, updateDoc, serverTimestamp, collection, setDoc, getDocs, query, orderBy, addDoc, where } from "firebase/firestore";
import axios from 'axios';
import { toast } from 'react-toastify';
import genToken from './utils/genToken';
import AudioConversation from './components/AudioConversation';
import { AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

// --- Subscription Data & Logic (Fetch from Backend) ---
const subscriptionPlans = {
  Free: {
    dailyMessageLimit: 25,
    theme: {
      backgroundColor: "#1e1e2e",
      bubbleColor: "#333344",
      primary: "#4a4aad",
      secondary: "#292943",
      textColor: "#fff",
    },
  },
  Standard: {
    dailyMessageLimit: 100,
    theme: {
      backgroundColor: "#181820",
      bubbleColor: "#282838",
      primary: "#5a5abf",
      secondary: "#303040",
      textColor: "#f2f2f2",
      gradient: "linear-gradient(135deg, #4a4aad, #6a6acf)",
    },
  },
  Premium: {
    dailyMessageLimit: Infinity,
    theme: {
      backgroundColor: "#12121a",
      bubbleColor: "#222230",
      primary: "#7a7acf",
      secondary: "#262636",
      textColor: "#f8f8f8",
      gradient: "linear-gradient(135deg, #6a6acf, #8a8cdf)",
      texture: "url('/images/subtle-noise.png')", // Replace with your texture
    },
  },
};

// --- Styled Components with Dynamic Styling ---

const ChatWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  height: calc(100vh - 80px); /* Account for header height */
  background-color: ${({ theme }) => theme.backgroundColor};
  color: ${({ theme }) => theme.textColor};
  font-family: "Arial", sans-serif;
  overflow: hidden;
  transition: background-color 0.3s ease;
  position: relative;
  z-index: 10;
  margin-top: 0; /* No extra margin needed with spacer div */

  @media (max-width: 600px) {
    height: calc(100vh - 64px); /* Account for smaller header on mobile */
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 20px;
  padding-top: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.primary};
    border-radius: 10px;
  }

  @media (max-width: 600px) {
    padding: 10px;
    padding-top: 20px;
  }
`;

const MessageBubble = styled.div.attrs(props => ({
  className: props.isUser ? 'user-message' : 'ai-message'
}))`
  position: relative;
  max-width: 75%;
  padding: ${({ isUser }) => (isUser ? "12px 16px" : "20px 16px 12px")};
  margin: ${({ isUser }) => (isUser ? "8px 0" : "24px 0 8px")};
  color: #fff;
  border-radius: ${({ isUser }) =>
    isUser ? "20px 20px 0 20px" : "20px 20px 20px 0"};
  align-self: ${({ isUser }) => (isUser ? "flex-end" : "flex-start")};
  word-wrap: break-word;
  box-sizing: border-box;

  &::before {
    content: ${({ isUser }) => (isUser ? '""' : '"AI Response"')};
    position: absolute;
    top: -20px;
    left: 16px;
    font-size: 12px;
    color: #888;
    font-style: italic;
  }

  background-color: ${({ theme, isUser }) =>
    isUser ? theme.primary : theme.bubbleColor};

  ${({ theme, isUser }) =>
    isUser &&
    theme.gradient &&
    css`
      background: ${theme.gradient};
    `}

  ${({ theme }) =>
    theme.texture &&
    css`
      background-image: ${theme.texture};
    `}

  @media (max-width: 600px) {
    max-width: 90%;
    padding: 10px 12px;
    font-size: 15px;
  }

  @media (max-width: 480px) {
    max-width: 95%;
    padding: 8px 10px;
    font-size: 14px;
    margin: ${({ isUser }) => (isUser ? "6px 0" : "20px 0 6px")};
  }
`;

const MessageImage = styled.img`
  max-width: 100%;
  border-radius: 12px;
  margin: 4px 0;
`;

const SuggestionChips = styled.div.attrs({
  className: 'suggestion-chips'
})`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;

  @media (max-width: 480px) {
    gap: 6px;
    margin-top: 8px;
  }
`;

const SuggestionChip = styled.button.attrs({
  className: 'suggestion-chip'
})`
  background-color: rgba(255, 255, 255, 0.15);
  color: ${({ theme }) => theme.textColor};
  border: none;
  border-radius: 20px;
  padding: 8px 14px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.25);
  }
  
  svg {
    margin-right: 6px;
    font-size: 0.8rem;
  }
`;

const QuoteBlock = styled.div`
  border-left: 3px solid ${({ theme }) => theme.primary};
  padding-left: 12px;
  margin: 12px 0;
  font-style: italic;
  opacity: 0.9;
`;

const EmojiContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 8px;
`;

const EmojiButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.2);
    opacity: 1;
  }
`;

const IconButton = styled.button`
  background-color: ${({ bgColor, theme }) =>
    bgColor ? bgColor : theme.primary};
  border: none;
  border-radius: 50%;
  padding: 10px;
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
  margin-left: ${({ marginLeft }) => marginLeft || "0"};
  width: 45px;
  height: 45px;

  &:hover {
    background-color: ${({ hoverColor, theme }) =>
      hoverColor ? hoverColor : theme.primary};
    opacity: 0.9;
  }

  @media (max-width: 600px) {
    width: 40px;
    height: 40px;
  }
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 15px;
  background-color: ${({ theme }) => theme.secondary};
  border-top: 1px solid #444;
  box-sizing: border-box;

  @media (max-width: 600px) {
    padding: 10px;
  }

  @media (max-width: 480px) {
    padding: 8px;
  }
`;

const TextInput = styled.input`
  flex-grow: 1;
  padding: 15px;
  border-radius: 30px;
  border: none;
  outline: none;
  font-size: 1rem;
  color: ${({ theme }) => theme.textColor};
  background-color: ${({ theme }) => theme.bubbleColor};
  margin-right: 15px;
  box-sizing: border-box;

  @media (max-width: 600px) {
    padding: 10px;
    margin-right: 10px;
  }
`;

const SendButton = styled.button`
  background-color: ${({ theme }) => theme.primary};
  border: none;
  border-radius: 30px;
  padding: 15px 25px;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  box-sizing: border-box;

  &:hover {
    opacity: 0.9;
  }

  @media (max-width: 600px) {
    padding: 10px 20px;
    font-size: 0.9rem;
  }
`;

const ResetButton = styled.button`
  background-color: #e74c3c;
  border: none;
  border-radius: 30px;
  padding: 15px 25px;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 10px;
  box-sizing: border-box;
  width: 100%;

  &:hover {
    background-color: #c0392b;
  }

  @media (max-width: 600px) {
    padding: 12px 20px;
    font-size: 0.9rem;
  }
  
  @media (max-width: 480px) {
    padding: 10px 15px;
    font-size: 0.85rem;
    margin-top: 8px;
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 10px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.bubbleColor};
  align-self: flex-start;
  width: 60px;
  
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${({ theme }) => theme.textColor};
    margin: 0 3px;
    animation: typing-dot 1.4s infinite ease-in-out;
  }
  
  .dot:nth-child(1) {
    animation-delay: 0s;
  }
  
  .dot:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .dot:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  @keyframes typing-dot {
    0%, 60%, 100% {
      transform: translateY(0);
    }
    30% {
      transform: translateY(-6px);
    }
  }
`;

const ChatTemplatesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 15px;

  @media (max-width: 600px) {
    justify-content: center;
  }
`;

const ChatTemplateButton = styled.button`
  background-color: ${({ theme }) => theme.bubbleColor};
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 10px 15px;
  margin: 5px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${({ theme }) => theme.primary};
  }
`;

const JournalButton = styled(IconButton)`
  background-color: ${({ theme }) => theme.secondary};
  margin-left: 10px;
`;

const JournalModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${({ theme }) => theme.backgroundColor || '#1a1a1a'};
  padding: 20px;
  overflow-y: auto;
  z-index: 1000;
  color: white;

  @media (min-width: 768px) {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 800px;
    height: 90vh;
    border-radius: 20px;
  }
  
  @media (max-width: 480px) {
    padding: 15px 10px;
  }
`;

const JournalHeader = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: white;
    margin-bottom: 8px;
  }
  
  p {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 12px;
  }
  
  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    
    h2 {
      margin-bottom: 0;
    }
    
    p {
      margin-bottom: 0;
    }
  }
  
  @media (max-width: 480px) {
    padding-bottom: 15px;
    margin-bottom: 15px;
    
    h2 {
      font-size: 1.3rem;
    }
    
    p {
      font-size: 0.85rem;
    }
  }
`;

const JournalEntry = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  
  @media (max-width: 480px) {
    padding: 15px;
    margin-bottom: 15px;
    
    h3 {
      font-size: 1.1rem !important;
    }
    
    h4 {
      font-size: 1rem !important;
    }
    
    p {
      font-size: 0.9rem !important;
    }
  }
`;

const JournalThemeTag = styled.span`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  
  @media (max-width: 480px) {
    padding: 3px 10px;
    font-size: 0.8rem;
  }
`;

const SafetyBanner = styled.div`
  background-color: rgba(255, 255, 255, 0.1);
  border-left: 4px solid ${({ theme }) => theme.primary};
  padding: 12px 16px;
  margin: 10px 0;
  border-radius: 4px;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textColor};
  
  @media (max-width: 480px) {
    padding: 10px 12px;
    font-size: 0.85rem;
    margin: 8px 0;
  }
`;

const ToolbarContainer = styled.div`
  display: flex;
  overflow-x: auto;
  padding: 8px 4px;
  background-color: ${({ theme }) => theme.secondary};
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  
  &::-webkit-scrollbar {
    height: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.primary};
    border-radius: 3px;
  }
`;

const ToolbarButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  border-radius: 8px;
  margin-right: 8px;
  background-color: ${({ active, theme }) => active ? theme.primary : 'rgba(255, 255, 255, 0.1)'};
  border: none;
  color: ${({ theme }) => theme.textColor};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ active, theme }) => active ? theme.primary : 'rgba(255, 255, 255, 0.2)'};
  }
`;

const MicButton = styled(ToolbarButton)`
  background-color: ${({ theme, active }) => active ? theme.primary : 'rgba(255, 255, 255, 0.1)'};
  color: ${({ active }) => active ? 'white' : 'inherit'};
  
  &:hover {
    background-color: ${({ theme, active }) => active ? theme.primary : 'rgba(255, 255, 255, 0.2)'};
  }
  
  ${({ theme, active }) =>
    active && theme.gradient &&
    css`
      background: ${theme.gradient};
    `}
`;

const SelfCareCard = styled.div`
  background: linear-gradient(to right, ${({ theme }) => theme.primary}88, ${({ theme }) => theme.primary}33);
  border-radius: 16px;
  padding: 16px;
  margin: 20px 0;
  align-self: center;
  max-width: 90%;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  
  h3 {
    margin-bottom: 12px;
    font-size: 1.1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
  }
  
  p {
    margin-bottom: 10px;
    line-height: 1.6;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, color 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

const SelfCarePrompt = styled.div`
  background-color: ${({ theme }) => theme.secondary || '#303040'};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  @media (max-width: 480px) {
    padding: 12px;
    margin-bottom: 12px;
  }
`;

const SelfCareHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  
  svg {
    margin-right: 10px;
    color: ${({ theme }) => theme.primary || '#5a5abf'};
  }
  
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: white;
    flex: 1;
  }
`;

const SelfCareContent = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
  
  @media (max-width: 480px) {
    font-size: 13px;
    line-height: 1.4;
    margin-bottom: 12px;
  }
`;

const SelfCareActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const SelfCareButton = styled.button`
  background-color: ${({ theme }) => theme.primary || '#5a5abf'};
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

const SelfCareSkipButton = styled.button`
  background-color: transparent;
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

const TemplatesWrapper = styled.div`
  padding: 20px;
  text-align: center;
  
  h2 {
    font-size: 24px;
    margin-bottom: 24px;
    color: white;
    font-weight: 600;
  }
`;

const TemplatesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
`;

const TemplateCard = styled.div`
  background-color: ${({ theme }) => theme.bubbleColor || '#282838'};
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    background-color: ${({ theme }) => theme.secondary || '#303040'};
  }

  @media (max-width: 480px) {
    padding: 12px;
  }
`;

const TemplateIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.primary || '#5a5abf'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  
  svg {
    color: white;
    font-size: 16px;
  }
`;

const TemplateTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: white;
`;

const TemplateDescription = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  line-height: 1.5;
`;

const InputWrapper = styled.div.attrs({
  className: 'input-wrapper'
})`
  display: flex;
  align-items: center;
  background-color: ${({ theme }) => theme.bubbleColor || '#282838'};
  border-radius: 24px;
  padding: 4px 4px 4px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  
  &:focus-within {
    border-color: ${({ theme }) => theme.primary || '#5a5abf'};
    box-shadow: 0 0 0 2px rgba(90, 90, 191, 0.2);
  }

  @media (max-width: 480px) {
    padding: 3px 3px 3px 12px;
  }
`;

const InputField = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: white;
  font-size: 16px;
  padding: 12px 0;
  outline: none;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const ButtonGroup = styled.div.attrs({
  className: 'button-group'
})`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;

  @media (max-width: 480px) {
    gap: 4px;
    margin-left: 4px;
  }
`;

const stripHtmlTags = (str) => {
  if (!str) return '';
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = str;
  return tempDiv.textContent || tempDiv.innerText || "";
};

const getIconComponent = (icon) => {
  if (!icon) return null;
  
  switch (icon) {
    case 'heart':
      return <FontAwesomeIcon icon={faHeart} />;
    case 'lightbulb':
      return <FontAwesomeIcon icon={faLightbulb} />;
    case 'handHoldingHeart':
      return <FontAwesomeIcon icon={faHandHoldingHeart} />;
    default:
      return null;
  }
};

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const [dailyMessageCount, setDailyMessageCount] = useState(0);
  const [limitExceeded, setLimitExceeded] = useState(false);
  const [currentPlan, setCurrentPlan] = useState("Free");
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [isSpeechRecognizing, setIsSpeechRecognizing] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [journalEntries, setJournalEntries] = useState([]);
  const [activeToolbar, setActiveToolbar] = useState(null);
  const [gifSearchTerm, setGifSearchTerm] = useState("");
  const [gifResults, setGifResults] = useState([]);
  const [isGifLoading, setIsGifLoading] = useState(false);
  const [dailyInsightShown, setDailyInsightShown] = useState(false);
  const [suggestedResponses, setSuggestedResponses] = useState([]);
  const [showSelfCarePrompt, setShowSelfCarePrompt] = useState(false);
  const [selfCareRecommendation, setSelfCareRecommendation] = useState(null);
  const [showAudioConversation, setShowAudioConversation] = useState(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [latestAiMessage, setLatestAiMessage] = useState('');

  const messagesEndRef = useRef(null);
  const speechRecognitionRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDocRef = doc(db, "bereavementlyUsers", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          console.log(userData.subscriptionType);
          setCurrentPlan(userData.subscriptionType || "Free");
          console.log(userData.subscriptionType)
          // Daily Reset Logic:
          const lastRequestDate = userData.lastRequestDate
            ? userData.lastRequestDate.toDate()
            : new Date(0);
          const today = new Date();

          if (
            lastRequestDate.getDate() !== today.getDate() ||
            lastRequestDate.getMonth() !== today.getMonth() ||
            lastRequestDate.getFullYear() !== today.getFullYear()
          ) {
            await updateDoc(userDocRef, { requestNo: 0 });
            setDailyMessageCount(0);
            setLimitExceeded(false);
          } else {
            setDailyMessageCount(userData.requestNo || 0);

            if (
              userData.subscriptionType === "Free" &&
              userData.requestNo >= 50
            ) {
              setLimitExceeded(true);
            } else if (
              userData.subscriptionType === "Standard" &&
              userData.requestNo >= 250
            ) {
              setLimitExceeded(true);
            }
          }
        }
      } else {
        // Handle user not logged in, maybe redirect to login
        navigate("/login");
      }
    });

    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      speechRecognitionRef.current = new (window.SpeechRecognition ||
        window.webkitSpeechRecognition)();
      speechRecognitionRef.current.continuous = false;

      speechRecognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log(transcript);
        setInput(input + " " + transcript); // Add recognized text to input
      };

      speechRecognitionRef.current.onend = () => {
        setIsSpeechRecognizing(false);
      };
    }

    return () => unsubscribe();
  }, [navigate]);

  // Scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleAudioConversation = () => {
    if (currentPlan === "Free") {
      navigate("/subscribe");
    } else {
      setShowAudioConversation(!showAudioConversation);
      // Reset speech recognition if user is turning off the audio conversation
      if (showAudioConversation) {
        setIsBotSpeaking(false);
      }
    }
  };

  useEffect(() => {
    const storedMessages = JSON.parse(localStorage.getItem("messages"));
    const storedChatHistory = JSON.parse(localStorage.getItem("chatHistory"));
    if (storedMessages && storedMessages.length > 0) {
      setShowTemplates(false);
      setMessages(storedMessages);
    }
    if (storedChatHistory && storedChatHistory.length > 0) {
      setShowTemplates(false);
      setChatHistory(storedChatHistory);
    }

    const storedMessageCount = JSON.parse(
      localStorage.getItem("dailyMessageCount")
    );
    setDailyMessageCount(storedMessageCount || 0);
  }, []);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    localStorage.setItem(
      "dailyMessageCount",
      JSON.stringify(dailyMessageCount)
    );

    if (dailyMessageCount >= subscriptionPlans[currentPlan].dailyMessageLimit) {
      setLimitExceeded(true);
    }
  }, [messages, chatHistory, dailyMessageCount, currentPlan]);

  const onSend = async () => {
    if (input.trim() === "") return;

    if (limitExceeded) {
      toast.error("You've reached your daily message limit. Please upgrade to continue.");
      return;
    }

    const context = chatHistory.slice(-12); // Get last 12 messages for context
    const newMessage = { type: "text", content: input, isUser: true };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setChatHistory((prevHistory) => [...prevHistory, `\nMe: ${input}`]);
    setInput("");
    setShowTemplates(false);
    setIsTyping(true);
    setSuggestedResponses([]);

    setDailyMessageCount(dailyMessageCount + 1);

    if (user) {
      const userDocRef = doc(db, "bereavementlyUsers", user.uid);
      await updateDoc(userDocRef, {
        requestNo: dailyMessageCount + 1,
        lastRequestDate: serverTimestamp(),
      });
    }

    try {
      // Check if the message contains specific grief-related keywords to enhance response
      const griefKeywords = ["loss", "died", "death", "grief", "missing", "passed away", "funeral"];
      const containsGriefKeywords = griefKeywords.some(keyword => 
        input.toLowerCase().includes(keyword)
      );
      
      // Enhanced system prompt for more compassionate responses
      const systemPrompt = containsGriefKeywords ? 
        `You are Bereavemently, a specialized AI grief counselor with expertise in helping people navigate loss and mourning. 
        Your primary focus is to provide emotional support, validation, and gentle guidance for someone experiencing grief.
        Be warm, empathetic, and human in your responses. Listen actively and respond thoughtfully.
        Occasionally (about 15% of responses), offer gentle wisdom about grief from experts or literature when relevant.
        Your goal is to help the person feel truly heard, validated, and less alone in their grief journey.` 
        : 
        "You are Bereavemently. An AI meant to help people overcome the struggles of loss and mourning and to navigate these difficulties";

      const response = await fetch("https://v1.api.buzzchat.site/ember/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "B-Key": "625a32fff8a54832bbdb43e749b7c9c1",
        },
        body: JSON.stringify({
          content: `\nChatHistory:${context.join(
            ""
          )} \nMe: ${input} \nBase: "${systemPrompt}" \nBereavemently:`,
        }),
      });

      const data = await response.json();
      const reply = stripHtmlTags(data.message);

      // Store the latest AI message for audio playback
      setLatestAiMessage(reply);

      // Check if we should include a comforting image based on user's emotional state
      const shouldIncludeImage = detectIntenseEmotion(input) && Math.random() < 0.5; // 40% chance
      
      if (shouldIncludeImage) {
        await sendComfortingImage(reply);
      } else {
        processTextResponse(reply);
      }

      // Track grief themes for journal
      if (reply.includes("feel") || reply.includes("emotion") || 
          reply.includes("grief") || reply.includes("loss") || 
          reply.includes("pain") || reply.includes("remember")) {
        await generateJournalEntry({
          userMessage: input,
          aiResponse: reply,
          timestamp: new Date().toISOString()
        });
      }
      
      // Generate suggested responses after brief delay to feel more natural
      setTimeout(() => {
        generateSuggestedResponses(reply);
      }, 1000);
      
    } catch (error) {
      console.error("Error with AI API:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          type: "text",
          content: "Sorry, something went wrong. Please try again later.",
          isUser: false,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const processTextResponse = (text) => {
    // Check if the message contains a quote to format specially
    const quoteMatch = text.match(/"([^"]+)"\s*—\s*([^"]+)/);
    
    if (quoteMatch) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { 
          type: "quote", 
          content: {
            text: quoteMatch[1],
            author: quoteMatch[2]
          },
          isUser: false
        }
      ]);
      // Store the quote text for audio playback
      setLatestAiMessage(quoteMatch[1] + ". By " + quoteMatch[2]);
    } else {
      setMessages((prevMessages) => [
        ...prevMessages,
        { type: "text", content: text, isUser: false }
      ]);
      // Store the regular text for audio playback
      setLatestAiMessage(text);
    }
    
    setChatHistory((prevHistory) => [
      ...prevHistory,
      `\nBereavemently: ${text}`
    ]);
  };

  const detectIntenseEmotion = (text) => {
    const intenseEmotionWords = [
      "overwhelmed", "devastated", "unbearable", "can't take", "too much", 
      "heartbroken", "shattered", "destroyed", "desperate", "hopeless",
      "crying", "sobbing", "tears", "lonely", "alone", "miss them", "missing"
    ];
    
    return intenseEmotionWords.some(word => text.toLowerCase().includes(word));
  };

  const sendComfortingImage = async (reply) => {
    try {
      // Use GIPHY API to find a comforting image based on keywords
      const comfortTerms = ["comfort", "healing", "calm", "peaceful nature", "hope", "gentle support"];
      const randomTerm = comfortTerms[Math.floor(Math.random() * comfortTerms.length)];
      
      const response = await axios.get(
        `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(randomTerm)}&key=AIzaSyCoMJX5afK5Ic0F5UQVHyfrbx6apQAAVWA&client_key=bereavemently&limit=5`
      );
      
      if (response.data.results && response.data.results.length > 0) {
        const randomIndex = Math.floor(Math.random() * response.data.results.length);
        const gifUrl = response.data.results[randomIndex].media_formats.gif.url;
        
        setMessages((prevMessages) => [
          ...prevMessages,
          { type: "text", content: reply, isUser: false },
          { 
            type: "gif", 
            content: gifUrl,
            caption: "I thought this image might bring you some comfort.",
            isUser: false 
          }
        ]);
      } else {
        processTextResponse(reply);
      }
    } catch (error) {
      console.error("Error sending comforting image:", error);
      processTextResponse(reply);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSend();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const resetChat = () => {
    setMessages([]);
    setChatHistory([]);
    setDailyMessageCount(0);
    localStorage.removeItem("messages");
    localStorage.removeItem("chatHistory");
    localStorage.removeItem("dailyMessageCount");
    setShowTemplates(true);
    setLimitExceeded(false);
  };

  const chatTemplates = [
    "I'm feeling lost and don't know what to do.",
    "Can you share some coping mechanisms for grief?",
    "I need help finding resources for dealing with loss.",
    "Tell me about the stages of grief.",
    "How can I support a friend who is grieving?",
    "Why does grief feel so overwhelming?",
    "Is it normal to feel angry after a loss?",
    "Can you help me understand how to move forward?",
    "How do I deal with the loneliness of losing someone?",
    "What should I do when memories become too painful?",
    "How can I keep the memory of my loved one alive?",
    "Is it okay to still feel sad after a long time?",
    "What are some healthy ways to express grief?",
    "How do I cope with the guilt I feel after a loss?",
    "What can I do when I miss someone so much it hurts?",
    "Can grief affect my physical health?",
    "How do I talk to children about death?",
    "Can you recommend any books or articles on grief?",
    "What should I do if I can't stop crying?",
    "How can I find hope during difficult times?",
    "How do I handle the first holiday season without my loved one?",
    "What are some ways to honor someone's memory?",
    "Is it normal to feel relief after a long illness ends?",
    "How do I deal with regrets or things left unsaid?",
    "What can I do when grief triggers anxiety or panic attacks?",
    "How do I navigate returning to work while grieving?",
    "What are some cultural differences in grieving processes?",
    "How can I support myself during the anniversary of a loss?",
    "What should I do if I'm having trouble sleeping due to grief?",
    "How do I handle other people's expectations about my grieving process?",
    "What are some ways to practice self-care while grieving?",
    "How do I cope with multiple losses in a short period?",
    "What can I do when I feel stuck in my grief?",
    "How do I deal with the anger I feel towards others who aren't grieving?",
    "What are some creative outlets for expressing grief?",
    "How can I find a grief support group in my area?",
    "What should I do if grief is affecting my relationships?",
    "How do I handle grief triggers in everyday life?",
    "What are some ways to find meaning after a significant loss?",
    "How can I support my children who are grieving?"
  ];

  const generateJournalEntry = async (interaction) => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const journalRef = collection(db, "bereavementlyUsers", user.uid, "journalEntries");
      
      // Query for today's entry
      const todayQuery = query(
        journalRef,
        where("date", "==", today)
      );
      
      const todaySnapshot = await getDocs(todayQuery);
      let existingEntry = null;
      let existingInteractions = [];

      if (!todaySnapshot.empty) {
        existingEntry = todaySnapshot.docs[0];
        existingInteractions = existingEntry.data().interactions || [];
      }

      // Add new interaction
      existingInteractions.push({
        userMessage: interaction.userMessage,
        aiResponse: interaction.aiResponse,
        timestamp: new Date().toISOString(),
        emotions: extractEmotions(interaction.userMessage + " " + interaction.aiResponse)
      });

      // Generate journal content based on all interactions
      const journalPrompt = `
        As an empathetic AI counselor, analyze today's grief counseling session and write a thoughtful journal entry.
        
        Today's interactions:
        ${existingInteractions.map(int => 
          `Time: ${new Date(int.timestamp).toLocaleTimeString()}
           Person: "${int.userMessage}"
           Response: "${int.aiResponse}"`
        ).join('\n\n')}

        Write a comprehensive counselor's journal entry that:
        1. Summarizes the key themes and emotions discussed
        2. Notes any significant progress or breakthroughs
        3. Identifies areas that need further attention
        4. Suggests potential approaches for future sessions
        5. Maintains a professional yet empathetic tone

        Format as JSON:
        {
          "title": "Brief, meaningful title capturing today's main theme",
          "summary": "Main journal entry text",
          "emotionalState": "Overall emotional state observed",
          "progress": "Notable progress made",
          "concerns": "Areas needing attention",
          "recommendations": "Suggested approaches for future sessions"
        }
      `;

      const journalContent = await generateAIResponse(journalPrompt);

      if (journalContent) {
        const entryData = {
          date: today,
          timestamp: serverTimestamp(),
          interactions: existingInteractions,
          ...journalContent,
          lastUpdated: new Date().toISOString()
        };

        if (existingEntry) {
          await updateDoc(existingEntry.ref, entryData);
        } else {
          await addDoc(journalRef, entryData);
        }

        // Update local journal entries state
        await loadJournalEntries();
      }

    } catch (error) {
      console.error("Error updating journal:", error);
      toast.error("Failed to update journal entry");
    }
  };

  const saveJournalEntry = async (content, type = 'ai') => {
    if (!user) return;
    
    try {
      const journalRef = collection(db, "bereavementlyUsers", user.uid, "journalEntries");
      const entry = {
        ...content,
        type,
        timestamp: serverTimestamp(),
        date: new Date().toISOString()
      };
      
      await setDoc(doc(journalRef), entry);
      await loadJournalEntries();
      toast.success("Journal entry saved successfully");
    } catch (error) {
      console.error("Error saving journal entry:", error);
      toast.error("Failed to save journal entry");
    }
  };

  const loadJournalEntries = async () => {
    if (!user) return;

    try {
      const journalRef = collection(db, "bereavementlyUsers", user.uid, "journalEntries");
      const q = query(journalRef, orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);
      
      const entries = [];
      querySnapshot.forEach((doc) => {
        entries.push({ id: doc.id, ...doc.data() });
      });
      
      setJournalEntries(entries);
    } catch (error) {
      console.error("Error loading journal entries:", error);
      toast.error("Failed to load journal entries");
    }
  };

  const generateAIResponse = async (prompt) => {
    if (!prompt) return null;
    
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
      if (!response.data || !response.data.candidates || !response.data.candidates[0]) {
        return null;
      }
      
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

        const fallbackUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY;
        
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
    }
  };

  useEffect(() => {
    if (showJournal) {
      loadJournalEntries();
    }
  }, [showJournal]);

  useEffect(() => {
    // Check if the user has already seen an insight today
    const lastInsightDate = localStorage.getItem("lastInsightDate");
    const today = new Date().toDateString();
    
    if (lastInsightDate !== today && messages.length > 5 && !dailyInsightShown) {
      generateDailyInsight();
      localStorage.setItem("lastInsightDate", today);
      setDailyInsightShown(true);
    }
  }, [messages]);

  const searchGifs = async (term) => {
    if (!term) return;
    
    setIsGifLoading(true);
    try {
      // Using Tenor API - Replace with your actual API key
      const response = await axios.get(
        `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(term)}&key=AIzaSyDTFjqNkwJLgfgvYicIjvVDZmEVRUPE0JM&client_key=bereavemently&limit=8`
      );
      
      setGifResults(response.data.results || []);
    } catch (error) {
      console.error("Error fetching GIFs:", error);
      toast.error("Failed to fetch GIFs. Please try again.");
      setGifResults([]);
    } finally {
      setIsGifLoading(false);
    }
  };

  const selectGif = (gif) => {
    const gifUrl = gif.media_formats.gif.url;
    
    setMessages((prevMessages) => [
      ...prevMessages,
      { 
        type: "gif", 
        content: gifUrl, 
        isUser: true
      }
    ]);
    
    setChatHistory((prevHistory) => [
      ...prevHistory,
      `\nMe: [shared a gif: ${gif.content_description || "image"}]`
    ]);
    
    setActiveToolbar(null);
    setGifResults([]);
    setGifSearchTerm("");
    
    // Trigger AI response to the GIF
    handleGifSent(gif.content_description || "supportive image");
  };

  const handleGifSent = async (description) => {
    setDailyMessageCount(dailyMessageCount + 1);
    setIsTyping(true);
    
    try {
      // Context for the AI to understand the user shared a GIF
      const prompt = `
        The user just shared a GIF related to "${description}". 
        Respond in a supportive and understanding way, acknowledging the emotions they may be expressing through this image.
        Keep your response focused on grief support and emotional validation.
        Be genuinely warm, empathetic, and humane in your response.
        
        Format your response as a JSON object:
        {
          "message": "your empathetic response here"
        }
      `;
      
      const response = await generateAIResponse(prompt);
      
      if (response && response.message) {
        setMessages((prevMessages) => [
          ...prevMessages, 
          { type: "text", content: response.message, isUser: false }
        ]);
        
        setChatHistory((prevHistory) => [
          ...prevHistory,
          `\nBereavemently: ${response.message}`
        ]);
        
        // Generate suggested follow-up responses
        generateSuggestedResponses(response.message);
      }
    } catch (error) {
      console.error("Error responding to GIF:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          type: "text",
          content: "I appreciate you sharing that image with me. How are you feeling today?",
          isUser: false
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateDailyInsight = async () => {
    try {
      const userMessages = messages
        .filter(msg => msg.isUser)
        .map(msg => typeof msg.content === 'string' ? msg.content : msg.text)
        .join(" ");
      
      if (userMessages.length < 50) return; // Not enough data
      
      const prompt = `
        Based on this user's messages in a grief support chat, provide a thoughtful, personalized insight about their grief journey.
        Messages: "${userMessages}"
        
        Create a short, meaningful insight that:
        1. Validates their emotions
        2. Offers gentle perspective
        3. Provides hope without diminishing their grief
        4. Is specific to their situation (not generic)
        
        Format as JSON:
        {
          "insight": "The personalized insight",
          "quote": "A relevant, comforting quote about grief/healing" 
        }
      `;
      
      const response = await generateAIResponse(prompt);
      
      if (response && response.insight) {
        setMessages(prev => [
          ...prev,
          {
            type: "insight",
            content: {
              insight: response.insight,
              quote: response.quote
            },
            isUser: false
          }
        ]);
      }
    } catch (error) {
      console.error("Error generating insight:", error);
    }
  };

  const generateSuggestedResponses = async (aiMessage) => {
    try {
      const prompt = `
        Based on this AI response in a grief support conversation, generate 3 natural, brief follow-up responses the user might want to say.
        
        AI message: "${aiMessage}"
        
        Create varied options that:
        1. Prompt further exploration of feelings
        2. Ask for practical advice
        3. Express gratitude or emotional reaction
        
        Each response should be 2-7 words and feel natural, not robotic.
        
        Format as JSON:
        {
          "options": [
            {"text": "first suggested response", "icon": "heart"},
            {"text": "second suggested response", "icon": "lightbulb"},
            {"text": "third suggested response", "icon": "handHoldingHeart"}
          ]
        }
        
        Valid icons: heart, lightbulb, handHoldingHeart
      `;
      
      const response = await generateAIResponse(prompt);
      
      if (response && response.options && response.options.length > 0) {
        setSuggestedResponses(response.options);
      } else {
        setSuggestedResponses([]);
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
      setSuggestedResponses([]);
    }
  };

  const sendSuggestedResponse = (text) => {
    setInput(text);
    setTimeout(() => onSend(), 100);
    setSuggestedResponses([]);
  };

  // Render a message based on its type
  const renderMessage = (message, index) => {
    const isUser = message.isUser;
    
    if (message.type === "gif") {
      return (
        <MessageBubble key={index} isUser={isUser} className={isUser ? "user-message" : "ai-message"}>
          {message.caption && <p className="mb-2">{message.caption}</p>}
          <MessageImage src={message.content} alt="GIF" />
        </MessageBubble>
      );
    } else if (message.type === "quote") {
      return (
        <MessageBubble key={index} isUser={isUser} className={isUser ? "user-message" : "ai-message"}>
          <QuoteBlock>
            <FontAwesomeIcon icon={faQuoteLeft} className="mr-2 opacity-60" />
            "{message.content.text}"
            <div className="mt-2 text-right font-medium">— {message.content.author}</div>
          </QuoteBlock>
        </MessageBubble>
      );
    } else if (message.type === "insight") {
      return (
        <MessageBubble key={index} isUser={isUser} className="ai-message insight-message">
          <div className="mb-3 flex items-center">
            <FontAwesomeIcon icon={faLightbulb} className="mr-2 text-yellow-300" />
            <span className="font-semibold">Daily Reflection</span>
          </div>
          <p>{message.content.insight}</p>
          {message.content.quote && (
            <QuoteBlock className="mt-4">
              <FontAwesomeIcon icon={faQuoteLeft} className="mr-2 opacity-60" />
              {message.content.quote}
            </QuoteBlock>
          )}
        </MessageBubble>
      );
    } else {
      // Default text message
      return (
        <MessageBubble key={index} isUser={isUser} className={isUser ? "user-message" : "ai-message"}>
          {message.content || message.text}
        </MessageBubble>
      );
    }
  };

  // Render GIF search interface
  const renderGifSearch = () => (
    <div className="p-3 bg-gray-800 rounded-lg mb-4">
      <div className="flex mb-3">
        <input
          type="text"
          value={gifSearchTerm}
          onChange={(e) => setGifSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchGifs(gifSearchTerm)}
          placeholder="Search for a GIF..."
          className="flex-1 px-4 py-2 bg-gray-700 text-white border-none rounded-l-lg focus:outline-none"
        />
        <button
          onClick={() => searchGifs(gifSearchTerm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-r-lg"
          disabled={isGifLoading}
        >
          {isGifLoading ? 
            <FontAwesomeIcon icon={faSpinner} spin /> : 
            "Search"
          }
        </button>
      </div>
      
      {gifResults.length > 0 && (
        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
          {gifResults.map((gif, index) => (
            <img
              key={index}
              src={gif.media_formats.tinygif.url}
              alt={gif.content_description || `GIF ${index}`}
              className="rounded cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => selectGif(gif)}
            />
          ))}
        </div>
      )}
    </div>
  );

  useEffect(() => {
    // Show self-care prompt after 15 messages or 15 minutes, whichever comes first
    if (messages.length > 0 && messages.length % 15 === 0 && !showSelfCarePrompt) {
      generateSelfCareRecommendation();
    }
    
    // Also check time-based trigger for self-care
    const selfCareTimer = setTimeout(() => {
      if (messages.length > 5 && !showSelfCarePrompt) {
        generateSelfCareRecommendation();
      }
    }, 15 * 60 * 1000); // 15 minutes
    
    return () => clearTimeout(selfCareTimer);
  }, [messages.length]);

  const generateSelfCareRecommendation = async () => {
    try {
      // Get themes from recent messages
      const recentMessages = messages.slice(-10)
        .map(msg => typeof msg.content === 'string' ? msg.content : (msg.text || ""))
        .join(" ");
      
      const prompt = `
        Based on this segment of a grief support conversation, suggest a personalized self-care activity.
        
        Recent conversation: "${recentMessages}"
        
        Generate a brief, specific self-care recommendation that would be helpful for someone dealing with grief or loss.
        The recommendation should:
        1. Be simple and achievable in 5-15 minutes
        2. Be sensitive to the person's emotional state
        3. Connect to themes in their conversation if possible
        4. Feel supportive, not dismissive of their grief
        
        Format as JSON:
        {
          "activity": "Brief title of the self-care activity",
          "description": "2-3 sentence explanation of how to do it and why it might help",
          "category": "physical, emotional, social, or mindfulness"
        }
      `;
      
      const response = await generateAIResponse(prompt);
      
      if (response && response.activity) {
        setSelfCareRecommendation(response);
        setShowSelfCarePrompt(true);
      }
    } catch (error) {
      console.error("Error generating self-care:", error);
    }
  };

  const dismissSelfCare = () => {
    setShowSelfCarePrompt(false);
    setSelfCareRecommendation(null);
  };

  const trySelfCare = () => {
    if (!selfCareRecommendation || !selfCareRecommendation.activity) {
      return;
    }
    
    // Add message to conversation acknowledging the self-care activity
    setMessages(prev => [
      ...prev,
      {
        type: "text",
        content: `I'll try the "${selfCareRecommendation.activity}" self-care activity.`,
        isUser: true
      }
    ]);
    
    // Generate encouraging response
    setIsTyping(true);
    
    setTimeout(async () => {
      try {
        const activityName = selfCareRecommendation.activity || 'self-care activity';
        
        const prompt = `
          The user has agreed to try the self-care activity: "${activityName}".
          
          Write a brief, encouraging response that:
          1. Positively reinforces their decision
          2. Offers gentle support
          3. Acknowledges that taking care of oneself during grief is important
          
          Keep it brief (2-3 sentences) and warm.
          
          Format as JSON:
          {
            "message": "your encouraging response"
          }
        `;
        
        const response = await generateAIResponse(prompt);
        
        if (response && response.message) {
          setMessages(prev => [
            ...prev,
            {
              type: "text",
              content: response.message,
              isUser: false
            }
          ]);
        }
      } catch (error) {
        console.error("Error responding to self-care:", error);
        setMessages(prev => [
          ...prev,
          {
            type: "text",
            content: "That's wonderful. Taking time for self-care is so important during difficult times. I'm here whenever you'd like to talk more.",
            isUser: false
          }
        ]);
      } finally {
        setIsTyping(false);
        setShowSelfCarePrompt(false);
        setSelfCareRecommendation(null);
      }
    }, 1000);
  };

  // Helper function to extract emotions from text
  const extractEmotions = (text) => {
    if (!text) return [];
    
    const emotionKeywords = {
      grief: ["loss", "grief", "missing", "gone"],
      anger: ["angry", "frustrated", "upset"],
      sadness: ["sad", "depressed", "down"],
      hope: ["hope", "better", "future"],
      anxiety: ["worried", "anxious", "nervous"],
      acceptance: ["accepting", "understand", "peace"]
    };

    const foundEmotions = [];
    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
        foundEmotions.push(emotion);
      }
    });
    
    return foundEmotions;
  };

  // Render journal entries for the journal modal
  const renderJournalEntries = () => (
    <div className="space-y-6">
      {journalEntries.map((entry) => (
        <JournalEntry key={entry.id}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {entry.title}
              </h3>
              <p className="text-sm text-gray-300">
                {new Date(entry.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            {entry.emotionalState && (
              <JournalThemeTag>
                {entry.emotionalState}
              </JournalThemeTag>
            )}
          </div>

          <div className="prose prose-invert max-w-none">
            <div className="mb-6">
              <p className="text-gray-200 leading-relaxed">{entry.summary}</p>
            </div>

            {entry.progress && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-2">Progress</h4>
                <p className="text-gray-200">{entry.progress}</p>
              </div>
            )}

            {entry.concerns && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-2">Areas of Focus</h4>
                <p className="text-gray-200">{entry.concerns}</p>
              </div>
            )}

            {entry.recommendations && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-2">Recommendations</h4>
                <p className="text-gray-200">{entry.recommendations}</p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                Last updated: {new Date(entry.lastUpdated).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </JournalEntry>
      ))}
    </div>
  );

  // Handle audio message submission - directly send messages without updating input field
  const handleAudioMessageSubmit = async (text) => {
    if (!text.trim()) return;
    
    // Create a new user message
    const newMessage = { type: "text", content: text, isUser: true };
    
    // Add the user message to the messages
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    
    // Add to chat history
    setChatHistory((prevHistory) => [...prevHistory, `\nMe: ${text}`]);
    
    // Reset templates and start typing indicator
    setShowTemplates(false);
    setIsTyping(true);
    setSuggestedResponses([]);
    
    // Increment message count
    setDailyMessageCount(dailyMessageCount + 1);
    
    // Update user document if logged in
    if (user) {
      const userDocRef = doc(db, "bereavementlyUsers", user.uid);
      await updateDoc(userDocRef, {
        requestNo: dailyMessageCount + 1,
        lastRequestDate: serverTimestamp(),
      });
    }
    
    try {
      // Check if the message contains specific grief-related keywords
      const griefKeywords = ["loss", "died", "death", "grief", "missing", "passed away", "funeral"];
      const containsGriefKeywords = griefKeywords.some(keyword => 
        text.toLowerCase().includes(keyword)
      );
      
      // Enhanced system prompt
      const systemPrompt = containsGriefKeywords ? 
        `You are Bereavemently, a specialized AI grief counselor with expertise in helping people navigate loss and mourning. 
        Your primary focus is to provide emotional support, validation, and gentle guidance for someone experiencing grief.
        Be warm, empathetic, and human in your responses. Listen actively and respond thoughtfully.
        Occasionally (about 15% of responses), offer gentle wisdom about grief from experts or literature when relevant.
        Your goal is to help the person feel truly heard, validated, and less alone in their grief journey.` 
        : 
        "You are Bereavemently. An AI meant to help people overcome the struggles of loss and mourning and to navigate these difficulties";
      
      // Get context from chat history
      const context = chatHistory.slice(-12);
      
      // Make API request
      const response = await fetch("https://v1.api.buzzchat.site/ember/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "B-Key": "625a32fff8a54832bbdb43e749b7c9c1",
        },
        body: JSON.stringify({
          content: `\nChatHistory:${context.join("")} \nMe: ${text} \nBase: "${systemPrompt}" \nBereavemently:`,
        }),
      });
      
      const data = await response.json();
      const reply = stripHtmlTags(data.message);
      
      // Store for audio playback
      setLatestAiMessage(reply);
      
      // Process the response
      const shouldIncludeImage = detectIntenseEmotion(text) && Math.random() < 0.5;
      
      if (shouldIncludeImage) {
        await sendComfortingImage(reply);
      } else {
        processTextResponse(reply);
      }
      
      // Track grief themes for journal
      if (reply.includes("feel") || reply.includes("emotion") || 
          reply.includes("grief") || reply.includes("loss") || 
          reply.includes("pain") || reply.includes("remember")) {
        await generateJournalEntry({
          userMessage: text,
          aiResponse: reply,
          timestamp: new Date().toISOString()
        });
      }
      
      // Generate suggested responses
      setTimeout(() => {
        generateSuggestedResponses(reply);
      }, 1000);
      
    } catch (error) {
      console.error("Error with AI API:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          type: "text",
          content: "Sorry, something went wrong. Please try again later.",
          isUser: false,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <ThemeProvider theme={subscriptionPlans[currentPlan].theme}>
      {showJournal && (
        <JournalModal
          onClose={() => setShowJournal(false)}
          theme={subscriptionPlans[currentPlan].theme}
        >
          <JournalHeader>
            <h2>Your Grief Journal</h2>
            <p>
              A personal record of your grief journey, with insights and reflections
            </p>
            <CloseButton onClick={() => setShowJournal(false)}>
              <FontAwesomeIcon icon={faTimes} />
            </CloseButton>
          </JournalHeader>
          {renderJournalEntries()}
        </JournalModal>
      )}

      <ChatWrapper theme={subscriptionPlans[currentPlan].theme}>
        {showSelfCarePrompt && selfCareRecommendation && (
          <SelfCarePrompt theme={subscriptionPlans[currentPlan].theme}>
            <SelfCareHeader>
              <FontAwesomeIcon icon={faHandHoldingHeart} />
              <h3>Self-Care Moment</h3>
              <CloseButton onClick={dismissSelfCare}>
                <FontAwesomeIcon icon={faTimes} />
              </CloseButton>
            </SelfCareHeader>
            <SelfCareContent>
              <p>{selfCareRecommendation.description || 'Try this self-care activity to help you during this difficult time.'}</p>
              <p className="mt-2 font-semibold">{selfCareRecommendation.activity}</p>
              <SelfCareActions>
                <SelfCareButton onClick={trySelfCare}>
                  Try This
                </SelfCareButton>
                <SelfCareSkipButton onClick={dismissSelfCare}>
                  Maybe Later
                </SelfCareSkipButton>
              </SelfCareActions>
            </SelfCareContent>
          </SelfCarePrompt>
        )}

        <MessagesContainer ref={messagesEndRef} theme={subscriptionPlans[currentPlan].theme}>
          {showTemplates && !messages.length ? (
            <TemplatesWrapper>
              <h2>How can Bereavemently help you today?</h2>
              <TemplatesGrid>
                {chatTemplates.map((template, index) => (
                  <TemplateCard
                  key={index}
                    onClick={() => {
                      setInput(template);
                      setShowTemplates(false);
                    }}
                    theme={subscriptionPlans[currentPlan].theme}
                  >
                    <TemplateIcon theme={subscriptionPlans[currentPlan].theme}>
                      <FontAwesomeIcon icon={faLightbulb} />
                    </TemplateIcon>
                    <TemplateTitle>{template.split(" ").slice(0, 3).join(" ")}...</TemplateTitle>
                    <TemplateDescription>{template}</TemplateDescription>
                  </TemplateCard>
                ))}
              </TemplatesGrid>
            </TemplatesWrapper>
          ) : (
            <>
              <SafetyBanner theme={subscriptionPlans[currentPlan].theme}>
                <strong>Important:</strong> This AI is designed to provide grief support, but is not a replacement for professional mental health services. If you're experiencing a crisis or emergency, please contact a mental health professional or crisis service immediately.
              </SafetyBanner>
              {messages.map((message, index) => renderMessage(message, index))}
              {isTyping && (
                <TypingIndicator theme={subscriptionPlans[currentPlan].theme}>
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </TypingIndicator>
              )}
            </>
          )}
        </MessagesContainer>

        {/* Audio Conversation Component */}
        {showAudioConversation && (
          <AnimatePresence>
            <AudioConversation
              theme={subscriptionPlans[currentPlan].theme}
              onSendMessage={handleAudioMessageSubmit}
              latestAiMessage={latestAiMessage}
              setIsBotSpeaking={setIsBotSpeaking}
            />
          </AnimatePresence>
        )}

        <InputContainer theme={subscriptionPlans[currentPlan].theme}>
          {activeToolbar === "gif" && renderGifSearch()}
          
          <InputWrapper theme={subscriptionPlans[currentPlan].theme}>
            <InputField
              placeholder={isBotSpeaking ? "Listening to AI response..." : "Type your message..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyDown}
              disabled={isBotSpeaking || isTyping}
            />

            <ButtonGroup>
          <ToolbarButton 
                type="button"
            onClick={() => setShowJournal(true)}
            title="View Journal"
          >
            <FontAwesomeIcon icon={faBook} />
          </ToolbarButton>
          
              <MicButton
                type="button"
                onClick={toggleAudioConversation}
                disabled={isTyping}
                title="Voice message"
                theme={subscriptionPlans[currentPlan].theme}
                active={showAudioConversation}
              >
                <FontAwesomeIcon icon={faMicrophone} />
              </MicButton>

              <SendButton
                type="button"
                onClick={onSend}
                disabled={!input.trim() || isTyping}
                theme={subscriptionPlans[currentPlan].theme}
              >
              <FontAwesomeIcon icon={faPaperPlane} />
              </SendButton>
            </ButtonGroup>
          </InputWrapper>

          {suggestedResponses.length > 0 && (
            <SuggestionChips>
              {suggestedResponses.map((suggestion, index) => (
                <SuggestionChip
                  key={index}
                  onClick={() => sendSuggestedResponse(suggestion.text)}
                  theme={subscriptionPlans[currentPlan].theme}
                >
                  {getIconComponent(suggestion.icon)}
                  {suggestion.text}
                </SuggestionChip>
              ))}
            </SuggestionChips>
          )}

          <ResetButton
            onClick={resetChat}
            theme={subscriptionPlans[currentPlan].theme}
          >
            <FontAwesomeIcon icon={faUndoAlt} />
            Start New Conversation
          </ResetButton>
        </InputContainer>
      </ChatWrapper>
    </ThemeProvider>
  );
};

export default Chat;
