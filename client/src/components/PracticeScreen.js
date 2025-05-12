import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  IconButton
} from '@chakra-ui/react';
import { FaMicrophone, FaMicrophoneSlash, FaStop } from 'react-icons/fa';
import ConversationHistory from './ConversationHistory';
import { useSocket } from '../contexts/SocketContext';
import { useSession } from '../contexts/SessionContext';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import axios from 'axios';

const PracticeScreen = ({ onEndSession }) => {
  const { socket, isConnected } = useSocket();
  const { 
    selectedScenario, 
    conversationHistory, 
    setConversationHistory,
    addMessage 
  } = useSession();
  const { 
    isRecording, 
    startRecording, 
    stopRecording, 
    getAudioChunkBase64,
    setDataAvailableCallback,
    error: audioError 
  } = useAudioRecorder();
  const [initialPrompt, setInitialPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const toast = useToast();
  
  // Fetch initial prompt on component mount
  useEffect(() => {
    const fetchInitialPrompt = async () => {
      try {
        const response = await axios.post('/api/start_session', {
          scenario: selectedScenario
        });
        
        setInitialPrompt(response.data.initial_prompt);
        
        // Add to conversation history
        setConversationHistory([{
          role: 'assistant',
          content: response.data.initial_prompt
        }]);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching initial prompt:', error);
        toast({
          title: 'Error',
          description: 'Failed to load initial prompt. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setIsLoading(false);
      }
    };

    if (selectedScenario) {
      fetchInitialPrompt();
    }
  }, [selectedScenario, setConversationHistory, toast]);

  // Set up audio data handling
  useEffect(() => {
    const handleAudioData = async (chunk) => {
      if (!socket || !chunk) return;

      try {
        const audioBase64 = await getAudioChunkBase64(chunk);
        if (audioBase64) {
          socket.emit('audio_data', {
            audio: audioBase64,
            scenario: selectedScenario,
            conversation_history: conversationHistory,
            is_final: false
          });
        }
      } catch (error) {
        console.error('Error processing audio chunk:', error);
        // Don't show error to user for intermediate chunks
      }
    };

    setDataAvailableCallback(handleAudioData);
  }, [socket, selectedScenario, conversationHistory, getAudioChunkBase64, setDataAvailableCallback]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Handle transcription event
    const handleTranscription = (data) => {
      if (data.is_final) {
        addMessage('user', data.text);
        setCurrentTranscription('');
      } else {
        setCurrentTranscription(data.text);
      }
    };

    // Handle AI response event
    const handleAIResponse = (data) => {
      addMessage('assistant', data.text);
      setIsProcessing(false);
      
      // Use the browser's text-to-speech API
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(data.text);
        window.speechSynthesis.speak(utterance);
      }
    };

    // Handle error event
    const handleError = (data) => {
      console.error('Socket error:', data.message);
      toast({
        title: 'Error',
        description: data.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsProcessing(false);
    };

    // Register event listeners
    socket.on('transcription', handleTranscription);
    socket.on('ai_response', handleAIResponse);
    socket.on('error', handleError);

    // Clean up event listeners on unmount
    return () => {
      socket.off('transcription', handleTranscription);
      socket.off('ai_response', handleAIResponse);
      socket.off('error', handleError);
    };
  }, [socket, addMessage, toast]);

  // Handle recording toggle
  const handleToggleRecording = async () => {
    if (isRecording) {
      stopRecording();
      setIsProcessing(true);
      
      // Send final audio chunk
      if (socket) {
        socket.emit('audio_data', {
          audio: '',  // Empty audio for final chunk
          scenario: selectedScenario,
          conversation_history: conversationHistory,
          is_final: true
        });
      }
    } else {
      startRecording();
      setCurrentTranscription('');
    }
  };

  // Handle end session
  const handleEndSession = () => {
    // Cancel any ongoing recording
    if (isRecording) {
      stopRecording();
    }
    
    // Stop any ongoing speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Send end session event to server
    if (socket) {
      socket.emit('end_session', {
        scenario: selectedScenario,
        conversation_history: conversationHistory
      });
    }
    
    // Navigate to feedback screen
    onEndSession();
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="brand.500" mb={4} />
        <Text>Preparing your practice session...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Flex 
        direction="column" 
        h={{ base: 'calc(100vh - 200px)', md: 'calc(100vh - 150px)' }}
      >
        <Box mb={4}>
          <Heading as="h2" size="lg" mb={3}>
            {selectedScenario === 'software_engineer' 
              ? 'Software Engineer Status Update' 
              : 'Insurance Sales Pitch'}
          </Heading>
          
          {!isConnected && (
            <Alert status="warning" mb={4}>
              <AlertIcon />
              <AlertTitle>Connection issue!</AlertTitle>
              <AlertDescription>
                Not connected to the server. Reconnecting...
              </AlertDescription>
            </Alert>
          )}
          
          {audioError && (
            <Alert status="error" mb={4}>
              <AlertIcon />
              <AlertTitle>Microphone error!</AlertTitle>
              <AlertDescription>
                {audioError}. Please check your microphone permissions.
              </AlertDescription>
            </Alert>
          )}
        </Box>
        
        <Box 
          flex="1" 
          borderWidth="1px" 
          borderRadius="lg" 
          overflow="hidden" 
          mb={4}
        >
          <ConversationHistory 
            conversations={conversationHistory} 
            currentTranscription={currentTranscription}
          />
        </Box>

        <Flex 
          alignItems="center" 
          justifyContent="space-between"
          p={4}
          borderWidth="1px"
          borderRadius="lg"
          bg="white"
        >
          <Flex alignItems="center">
            <IconButton
              icon={isRecording ? <FaMicrophoneSlash /> : <FaMicrophone />}
              colorScheme={isRecording ? "red" : "brand"}
              size="lg"
              isRound
              mr={4}
              onClick={handleToggleRecording}
              isDisabled={isProcessing || !isConnected || !!audioError}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            />
            
            {isRecording && (
              <Box display="flex" alignItems="center">
                <Box 
                  w="12px" 
                  h="12px" 
                  borderRadius="full" 
                  bg="red.500" 
                  mr={2}
                  animation="pulse 1.5s infinite"
                />
                <Text fontWeight="medium">Recording...</Text>
              </Box>
            )}
            
            {isProcessing && (
              <Box display="flex" alignItems="center">
                <Spinner size="sm" mr={2} />
                <Text fontWeight="medium">Processing...</Text>
              </Box>
            )}
          </Flex>
          
          <Button
            leftIcon={<FaStop />}
            colorScheme="gray"
            onClick={handleEndSession}
            isDisabled={isProcessing}
          >
            End Session
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default PracticeScreen;