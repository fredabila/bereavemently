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
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { db, auth } from "./firebase"; // Your Firebase config
import { doc, getDoc, updateDoc, serverTimestamp, collection, setDoc, getDocs, query, orderBy, addDoc, where } from "firebase/firestore";
import axios from 'axios';
import { toast } from 'react-toastify';
import genToken from './utils/genToken';

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
  height: 100vh;
  background-color: ${({ theme }) => theme.backgroundColor};
  color: ${({ theme }) => theme.textColor};
  font-family: "Arial", sans-serif;
  overflow: hidden;
  transition: background-color 0.3s ease;

  @media (max-width: 600px) {
    height: 100vh;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 20px;
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
  }
`;

const MessageBubble = styled.div`
  max-width: 75%;
  padding: 12px 16px;
  margin: 8px 0;
  color: #fff;
  border-radius: ${({ isUser }) =>
    isUser ? "20px 20px 0 20px" : "20px 20px 20px 0"};
  align-self: ${({ isUser }) => (isUser ? "flex-end" : "flex-start")};
  word-wrap: break-word;
  box-sizing: border-box;

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
    padding: 10px;
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
  padding: 15px;
  background-color: ${({ theme }) => theme.secondary};
  border-top: 1px solid #444;
  box-sizing: border-box;
  justify-content: space-between;

  @media (max-width: 600px) {
    padding: 10px;
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
  margin-left: 10px;
  box-sizing: border-box;

  &:hover {
    background-color: #c0392b;
  }

  @media (max-width: 600px) {
    padding: 10px 20px;
    font-size: 0.9rem;
    margin-left: 5px;
  }
`;

const TypingIndicator = styled.div`
  color: ${({ theme }) => theme.textColor};
  font-size: 0.9rem;
  margin-left: 10px;
  margin-bottom: 5px;
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
`;

const JournalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: white;
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
`;

const JournalThemeTag = styled.span`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
`;

const stripHtmlTags = (str) => {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = str;
  return tempDiv.textContent || tempDiv.innerText || "";
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

  const startSpeechRecognition = () => {
    if (currentPlan === "Free") {
      navigate("/subscribe");
    } else {
      if (speechRecognitionRef.current) {
        setIsSpeechRecognizing(true);
        speechRecognitionRef.current.start();
      } else {
        alert("Speech recognition is not supported in your browser.");
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
      alert(
        "You have exceeded your daily message limit. Please upgrade to continue."
      );
      return;
    }

    const context = chatHistory.slice(-12); // Get last 12 messages for context
    const newMessage = { text: input, isUser: true };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setChatHistory((prevHistory) => [...prevHistory, `\nMe: ${input}`]);
    setInput("");
    setShowTemplates(false);
    setIsTyping(true);

    setDailyMessageCount(dailyMessageCount + 1);

    if (user) {
      const userDocRef = doc(db, "bereavementlyUsers", user.uid);
      await updateDoc(userDocRef, {
        requestNo: dailyMessageCount + 1,
        lastRequestDate: serverTimestamp(),
      });
    }

    try {
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
          )} \nMe: ${input} \nBase: "You are Bereavemently. An AI meant to help people overcome the struggles of loss and mourning and to navigate these difficulties" \nBereavemently:`,
        }),
      });

      const data = await response.json();
      const reply = stripHtmlTags(data.message);

      setMessages((prevMessages) => [
        ...prevMessages,
        { text: reply, isUser: false },
      ]);
      setChatHistory((prevHistory) => [
        ...prevHistory,
        `\nBereavemently: ${reply}`,
      ]);

      if (reply.includes("feel") || reply.includes("emotion") || reply.includes("grief")) {
        await generateJournalEntry({
          userMessage: input,
          aiResponse: reply,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error with AI API:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: "Sorry, something went wrong. Please try again later.",
          isUser: false,
        },
      ]);
    } finally {
      setIsTyping(false);
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
    }
  };

  useEffect(() => {
    if (showJournal) {
      loadJournalEntries();
    }
  }, [showJournal]);

  // Helper function to extract emotions from text
  const extractEmotions = (text) => {
    const emotionKeywords = {
      grief: ["loss", "grief", "missing", "gone"],
      anger: ["angry", "frustrated", "upset"],
      sadness: ["sad", "depressed", "down"],
      hope: ["hope", "better", "future"],
      anxiety: ["worried", "anxious", "nervous"],
      acceptance: ["accepting", "understand", "peace"]
    };

    const foundEmotions = [];
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
        foundEmotions.push(emotion);
      }
    }
    return foundEmotions;
  };

  // Update the journal modal rendering
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

  return (
    <ThemeProvider theme={subscriptionPlans[currentPlan].theme}>
      <ChatWrapper>
        <MessagesContainer>
          {showTemplates && (
            <ChatTemplatesContainer>
              {chatTemplates.map((template, index) => (
                <ChatTemplateButton
                  key={index}
                  onClick={() => setInput(template)}
                >
                  {template}
                </ChatTemplateButton>
              ))}
            </ChatTemplatesContainer>
          )}
          {messages.map((message, index) => (
            <MessageBubble key={index} isUser={message.isUser}>
              {message.text}
            </MessageBubble>
          ))}
          <div ref={messagesEndRef} />
        </MessagesContainer>
        {isTyping && (
          <TypingIndicator>Bereavemently is typing...</TypingIndicator>
        )}
        <InputContainer>
          <IconButton
            onClick={startSpeechRecognition}
            disabled={limitExceeded || isSpeechRecognizing}
          >
            <FontAwesomeIcon icon={faMicrophone} />
          </IconButton>
          <JournalButton onClick={() => setShowJournal(true)} marginLeft="10px">
            <FontAwesomeIcon icon={faBook} />
          </JournalButton>
        </InputContainer>
        {!limitExceeded && (
          <InputContainer>
            <TextInput
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={limitExceeded}
              style={{ marginLeft: 10 }}
            />
            <IconButton onClick={onSend} disabled={limitExceeded}>
              <FontAwesomeIcon icon={faPaperPlane} />
            </IconButton>
            <IconButton
              onClick={resetChat}
              bgColor="#e74c3c"
              hoverColor="#c0392b"
              marginLeft="10px"
            >
              <FontAwesomeIcon icon={faUndoAlt} />
            </IconButton>
          </InputContainer>
        )}
        {limitExceeded && (
          <div style={{ padding: "20px", textAlign: "center", color: "#fff" }}>
            <p>You have reached your daily message limit.</p>
            <button onClick={() => navigate("/subscribe")}>
              Upgrade to send more messages
            </button>
          </div>
        )}
      </ChatWrapper>
      {showJournal && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 999
            }}
            onClick={() => setShowJournal(false)}
          />
          <JournalModal>
            <JournalHeader>
              <h2>Emotional Journey Journal</h2>
              <button
                onClick={() => setShowJournal(false)}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-white" />
              </button>
            </JournalHeader>

            <div className="mb-6">
              <div className="flex gap-4 items-center mb-4">
                <input
                  type="text"
                  placeholder="Search journal entries..."
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg 
                           text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                           focus:ring-indigo-500"
                />
                <button
                  className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 
                           transition-colors"
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>
            </div>

            {journalEntries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">
                  No journal entries yet. Your journey will be documented here as you chat.
                </p>
              </div>
            ) : (
              renderJournalEntries()
            )}
          </JournalModal>
        </>
      )}
    </ThemeProvider>
  );
};

export default Chat;
