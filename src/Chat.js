import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";

const ChatWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  height: 100vh;
  background-color: #1e1e2e;
  font-family: "Arial", sans-serif;
  color: #fff;

  @media (max-width: 600px) {
    height: 100%;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

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

  @media (max-width: 600px) {
    max-width: 90%;
    padding: 10px;
  }
`;

const InputContainer = styled.div`
  display: flex;
  padding: 15px;
  background-color: #292943;
  border-top: 1px solid #444;

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

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
  }, []);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }, [messages, chatHistory]);

  const onSend = async () => {
    if (input.trim() === "") return;

    const context = chatHistory.slice(-12);
    const newMessage = { text: input, isUser: true };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setChatHistory((prevHistory) => [...prevHistory, `\nMe: ${input}`]);
    setInput("");
    setShowTemplates(false);
    setIsTyping(true);

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
      const reply = data.message;

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
    localStorage.removeItem("messages");
    localStorage.removeItem("chatHistory");
    setShowTemplates(true);
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
      {isTyping && <TypingIndicator>Bereavemently is typing...</TypingIndicator>}
      <InputContainer>
        <TextInput
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
        />
        <SendButton onClick={onSend}>Send</SendButton>
        <ResetButton onClick={resetChat}>Reset Chat</ResetButton>
      </InputContainer>
    </ChatWrapper>
  );
};

export default Chat;
