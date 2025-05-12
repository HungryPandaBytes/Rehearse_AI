import React, { createContext, useContext, useState } from 'react';

const SessionContext = createContext();

export const useSession = () => useContext(SessionContext);

export const SessionProvider = ({ children }) => {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [feedback, setFeedback] = useState(null);

  // Reset the session
  const resetSession = () => {
    setSelectedScenario(null);
    setConversationHistory([]);
    setFeedback(null);
  };

  // Add a message to the conversation history
  const addMessage = (role, content) => {
    setConversationHistory(prev => [...prev, { role, content }]);
  };

  return (
    <SessionContext.Provider 
      value={{ 
        selectedScenario, 
        setSelectedScenario,
        conversationHistory,
        setConversationHistory,
        addMessage,
        feedback,
        setFeedback,
        resetSession
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};