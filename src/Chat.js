// src/Chat.js
import React, { useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #fff;
  min-height: 100vh;
`;

const MessagesContainer = styled.div`
  width: 100%;
  max-width: 600px;
  margin-bottom: 20px;
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 10px;
  background-color: #f8f8f8;
`;

const Message = styled.div`
  margin-bottom: 10px;
  padding: 10px;
  background-color: ${({ isUser }) => (isUser ? '#007bff' : '#e9ecef')};
  color: ${({ isUser }) => (isUser ? 'white' : 'black')};
  border-radius: 10px;
  align-self: ${({ isUser }) => (isUser ? 'flex-end' : 'flex-start')};
  max-width: 80%;
`;

const InputContainer = styled.div`
  display: flex;
  width: 100%;
  max-width: 600px;
`;

const Input = styled.input`
  flex-grow: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-right: 10px;
`;

const Button = styled.button`
  padding: 10px 20px;
  color: white;
  background-color: #007bff;
  border: none;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (input.trim() === '') return;

    // Add user message
    const newMessages = [...messages, { text: input, isUser: true }];
    setMessages(newMessages);

    // Call AI API (replace 'your-api-url' with the actual API endpoint)
    try {
      const response = await axios.post('your-api-url', { message: input });
      setMessages([...newMessages, { text: response.data.reply, isUser: false }]);
    } catch (error) {
      console.error('Error with AI API:', error);
      setMessages([...newMessages, { text: "Sorry, something went wrong.", isUser: false }]);
    }

    setInput('');
  };

  return (
    <ChatContainer>
      <MessagesContainer>
        {messages.map((msg, index) => (
          <Message key={index} isUser={msg.isUser}>{msg.text}</Message>
        ))}
      </MessagesContainer>
      <InputContainer>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <Button onClick={handleSend}>Send</Button>
      </InputContainer>
    </ChatContainer>
  );
};

export default Chat;
