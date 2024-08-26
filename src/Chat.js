import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ChatWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  height: 100vh;
  background-color: #1e1e2e;
  font-family: 'Arial', sans-serif;
  color: #fff;
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const MessageBubble = styled.div`
  max-width: 75%;
  padding: 15px;
  margin: 10px 0;
  background-color: ${({ isUser }) => (isUser ? '#4a4aad' : '#333344')};
  color: #fff;
  border-radius: ${({ isUser }) => (isUser ? '20px 20px 0 20px' : '20px 20px 20px 0')};
  align-self: ${({ isUser }) => (isUser ? 'flex-end' : 'flex-start')};
  word-wrap: break-word;
`;

const InputContainer = styled.div`
  display: flex;
  padding: 15px;
  background-color: #292943;
  border-top: 1px solid #444;
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
`;

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const storedMessages = JSON.parse(localStorage.getItem('messages'));
    const storedChatHistory = JSON.parse(localStorage.getItem('chatHistory'));
    if (storedMessages) setMessages(storedMessages);
    if (storedChatHistory) setChatHistory(storedChatHistory);
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('messages', JSON.stringify(messages));
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  }, [messages, chatHistory]);

  const onSend = async () => {
    if (input.trim() === '') return;

    const context = chatHistory.slice(-12);
    const newMessage = {
      text: input,
      isUser: true,
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setChatHistory((prevHistory) => [...prevHistory, `\nMe: ${input}`]);

    setInput(''); // Clear the input box after sending the message

    try {
      const response = await fetch(`https://v1.api.buzzchat.site/ember/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "B-Key": "625a32fff8a54832bbdb43e749b7c9c1",
        },
        body: JSON.stringify({
          content: `\nChatHistory:${context.join('')} \nMe: ${input} \nBase: "You are Bereavemently. An AI meant to help people overcome the struggles of loss and mourning and to navigate these difficulties" \nEmber:`,
        }),
      });

      const data = await response.json();
      const reply = data.message;

      const emberReply = {
        text: reply,
        isUser: false,
      };

      setMessages((prevMessages) => [...prevMessages, emberReply]);
      setChatHistory((prevHistory) => [
        ...prevHistory,
        `\nEmber: ${reply}`
      ]);

    } catch (error) {
      console.error('Error with AI API:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: "Sorry, something went wrong.", isUser: false }
      ]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSend();
    }
  };

  return (
    <ChatWrapper>
      <MessagesContainer>
        {messages.map((msg, index) => (
          <MessageBubble key={index} isUser={msg.isUser}>
            {msg.text}
          </MessageBubble>
        ))}
      </MessagesContainer>
      <InputContainer>
        <TextInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
        />
        <SendButton onClick={onSend}>Send</SendButton>
      </InputContainer>
    </ChatWrapper>
  );
};

export default Chat;
