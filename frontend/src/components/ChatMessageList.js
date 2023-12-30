// ChatMessageList.js
import React from 'react';
import ChatMessage from './ChatMessage';
import { Card } from 'react-bootstrap';

const userMessageStyle = {
  alignSelf: 'flex-end', // Align to the right
  backgroundColor: '#007BFF', // Example background color for user messages
  color: '#fff', // Text color for user messages
};

const chatbotMessageStyle = {
  alignSelf: 'flex-start', // Align to the left
  backgroundColor: '#28A745', // Example background color for chatbot messages
  color: '#fff', // Text color for chatbot messages
};

const ChatMessageList = ({ messages, updateResearchInfo, isSave=true }) => {

  return (
    <Card style={{ overflowY: 'auto', height: '550px', marginTop: '10px' }}>
      <Card.Body> 
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            message={message.content}
            isUser={message.role == 'user' ? true : false}
            style={message.role == 'user' ? userMessageStyle : chatbotMessageStyle}
            updateResearchInfo={updateResearchInfo}
            isSave={isSave}
          />
        ))}
      </Card.Body>
    </Card>
  );
};

export default ChatMessageList;
