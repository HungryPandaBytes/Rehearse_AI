import React from 'react';
import { Box } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import Header from './components/Header';
import SetupScreen from './components/SetupScreen';
import PracticeScreen from './components/PracticeScreen';
import FeedbackScreen from './components/FeedbackScreen';
import { SocketProvider } from './contexts/SocketContext';
import { SessionProvider } from './contexts/SessionContext';

function App() {
  const [currentScreen, setCurrentScreen] = useState('setup');

  return (
    <SocketProvider>
      <SessionProvider>
        <Box maxW="1200px" mx="auto" px={4} py={6} minH="100vh">
          <Header />
          
          {currentScreen === 'setup' && (
            <SetupScreen onStartSession={() => setCurrentScreen('practice')} />
          )}
          
          {currentScreen === 'practice' && (
            <PracticeScreen 
              onEndSession={() => setCurrentScreen('feedback')} 
            />
          )}
          
          {currentScreen === 'feedback' && (
            <FeedbackScreen
              onNewSession={() => setCurrentScreen('setup')}
            />
          )}
        </Box>
      </SessionProvider>
    </SocketProvider>
  );
}

export default App;