import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faUndoAlt } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { db, auth } from "./firebase"; // Replace with your Firebase config
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

// Subscription Logic (You need to get this data from the backend)
const DAILY_MESSAGE_LIMIT = 25; // For Free Plan users
const ChatWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  height: 100vh;
  background-color: #1e1e2e;
  font-family: "Arial", sans-serif;
  color: #fff;
  overflow: hidden; /* Ensures no content flows outside the container */

  @media (max-width: 600px) {
    height: 100vh; /* Fixes the height to full screen */
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-sizing: border-box; /* Ensure padding is included in the height/width */

  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background-color: #4a4aad;
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
  background-color: ${({ isUser }) => (isUser ? "#4a4aad" : "#333344")};
  color: #fff;
  border-radius: ${({ isUser }) =>
    isUser ? "20px 20px 0 20px" : "20px 20px 20px 0"};
  align-self: ${({ isUser }) => (isUser ? "flex-end" : "flex-start")};
  word-wrap: break-word;
  box-sizing: border-box;

  @media (max-width: 600px) {
    max-width: 90%;
    padding: 10px;
  }
`;

const IconButton = styled.button`
  background-color: ${({ bgColor }) => bgColor || "#4a4aad"};
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
    background-color: ${({ hoverColor }) => hoverColor || "#5a5abf"};
  }

  @media (max-width: 600px) {
    width: 40px;
    height: 40px;
  }
`;

const InputContainer = styled.div`
  display: flex;
  padding: 15px;
  background-color: #292943;
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
  color: #fff;
  background-color: #3c3c5b;
  margin-right: 15px;
  box-sizing: border-box;

  @media (max-width: 600px) {
    padding: 10px;
    margin-right: 10px;
  }
`;

const SendButton = styled.button`
  background-color: #4a4aad;
  border: none;
  border-radius: 30px;
  padding: 15px 25px;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  box-sizing: border-box;

  &:hover {
    background-color: #5a5abf;
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
  color: #aaa;
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
  background-color: #3c3c5b;
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 10px 15px;
  margin: 5px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #5a5abf;
  }
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
  const [dailyMessageCount, setDailyMessageCount] = useState(0); // Tracks messages sent today
  const [limitExceeded, setLimitExceeded] = useState(false); // Whether the daily limit is exceeded
  const user = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDocRef = doc(db, "bereavementlyUsers", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();

          // Daily Reset Logic:
          const lastRequestDate = userData.lastRequestDate
            ? userData.lastRequestDate.toDate()
            : new Date(0); // Get last request date or set to epoch if not available
          const today = new Date();

          if (
            lastRequestDate.getDate() !== today.getDate() ||
            lastRequestDate.getMonth() !== today.getMonth() ||
            lastRequestDate.getFullYear() !== today.getFullYear()
          ) {
            // It's a new day - reset requestNo to 0
            await updateDoc(userDocRef, { requestNo: 0 });
            setDailyMessageCount(0);
            setLimitExceeded(false); // Reset limit exceeded flag
          } else {
            // If it's the same day, use existing requestNo
            setDailyMessageCount(userData.requestNo || 0);

            // Determine if limit is exceeded based on subscription type
            if (
              userData.subscriptionType === "Free" &&
              userData.requestNo >= 25
            ) {
              setLimitExceeded(true);
            } else if (
              userData.subscriptionType === "Standard" &&
              userData.requestNo >= 100
            ) {
              setLimitExceeded(true);
            }
          }
        }
      }
    };

    fetchUserData();
  }, [user]);
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Get stored messages and chat history from local storage on load
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

    // Fetch daily message count (from backend or local storage)
    const storedMessageCount = JSON.parse(
      localStorage.getItem("dailyMessageCount")
    );
    setDailyMessageCount(storedMessageCount || 0);
  }, []);

  // Save messages and chat history in local storage
  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    localStorage.setItem(
      "dailyMessageCount",
      JSON.stringify(dailyMessageCount)
    );

    // Check if the daily message limit is exceeded
    if (dailyMessageCount >= DAILY_MESSAGE_LIMIT) {
      setLimitExceeded(true);
    }
  }, [messages, chatHistory, dailyMessageCount]);

  const onSend = async () => {
    if (input.trim() === "") return;

    // Check if daily limit is exceeded before sending the message
    if (limitExceeded) {
      alert(
        "You have exceeded your daily message limit. Please upgrade to continue."
      );
      return;
    }

    const context = chatHistory.slice(-12);
    const newMessage = { text: input, isUser: true };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setChatHistory((prevHistory) => [...prevHistory, `\nMe: ${input}`]);
    setInput("");
    setShowTemplates(false);
    setIsTyping(true);

    // Increment the daily message count and check limit
    setDailyMessageCount(dailyMessageCount + 1);
    if (dailyMessageCount + 1 >= DAILY_MESSAGE_LIMIT) {
      setLimitExceeded(true);
    }
    if (user) {
      const userDocRef = doc(db, "bereavementlyUsers", user.uid);
      await updateDoc(userDocRef, {
        requestNo: dailyMessageCount + 1,
        lastRequestDate: serverTimestamp(), // Update last request timestamp
      });
    }
    try {
      const response = await fetch("https://v1.api.buzzchat.site/ember/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "B-Key": "625a32fff8a54832bbdb43e749b7c9c1", // Replace with your API key
        },
        body: JSON.stringify({
          content: `\nChatHistory:${context.join(
            ""
          )} \nMe: ${input} \nBase: "You are Bereavemently. An AI meant to help people overcome the struggles of loss and mourning and to navigate these difficulties" \nBereavemently:`,
        }),
      });

      const data = await response.json();
      const reply = stripHtmlTags(data.message); // Sanitize the response

      setMessages((prevMessages) => [
        ...prevMessages,
        { text: reply, isUser: false },
      ]);
      setChatHistory((prevHistory) => [
        ...prevHistory,
        `\nBereavemently: ${reply}`,
      ]);
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
    setDailyMessageCount(0); // Reset daily message count
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
  ];

  return (
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

      {/* Disable Input when the limit is exceeded */}
      <InputContainer>
        <TextInput
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={limitExceeded}
        />
        <IconButton
          onClick={onSend}
          bgColor="#4a4aad"
          hoverColor="#5a5abf"
          disabled={limitExceeded}
        >
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

      {limitExceeded && (
        <TypingIndicator>
          You have reached your daily message limit. Please upgrade to continue.
          <button onClick={() => navigate("/subscribe")}>Upgrade</button>
        </TypingIndicator>
      )}
    </ChatWrapper>
  );
};

export default Chat;
