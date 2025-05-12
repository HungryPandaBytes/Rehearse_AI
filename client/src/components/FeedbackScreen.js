import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Flex,
  Icon,
  Spinner,
  Center,
  useToast
} from '@chakra-ui/react';
import { FaArrowLeft, FaDownload, FaClipboard } from 'react-icons/fa';
import { useSocket } from '../contexts/SocketContext';
import { useSession } from '../contexts/SessionContext';

const FeedbackScreen = ({ onNewSession }) => {
  const { socket } = useSocket();
  const { feedback, setFeedback, selectedScenario } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  // Set up socket event listener for receiving feedback
  useEffect(() => {
    if (!socket) return;

    // Handle session feedback event
    const handleSessionFeedback = (data) => {
      setFeedback(data.feedback);
      setIsLoading(false);
    };

    // Register event listener
    socket.on('session_feedback', handleSessionFeedback);

    // Clean up event listener on unmount
    return () => {
      socket.off('session_feedback', handleSessionFeedback);
    };
  }, [socket, setFeedback]);

  // Handle download feedback as text file
  const handleDownloadFeedback = () => {
    if (!feedback) return;

    const element = document.createElement('a');
    const file = new Blob([feedback], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `feedback-${selectedScenario}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Handle copy feedback to clipboard
  const handleCopyFeedback = () => {
    if (!feedback) return;

    navigator.clipboard.writeText(feedback)
      .then(() => {
        toast({
          title: 'Copied to clipboard',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      })
      .catch((error) => {
        console.error('Error copying to clipboard:', error);
        toast({
          title: 'Failed to copy',
          description: 'Please try again',
          status: 'error',
          duration: 2000,
          isClosable: true,
        });
      });
  };

  if (isLoading) {
    return (
      <Center h="50vh" flexDirection="column">
        <Spinner size="xl" color="brand.500" mb={4} />
        <Text>Generating your feedback...</Text>
      </Center>
    );
  }

  return (
    <Box>
      <Heading as="h2" size="lg" mb={6}>
        Session Feedback
      </Heading>
      
      <Box 
        borderWidth="1px" 
        borderRadius="lg" 
        p={6} 
        bg="white" 
        mb={8}
        boxShadow="sm"
      >
        <Box mb={6}>
          <Heading as="h3" size="md" mb={3}>
            {selectedScenario === 'software_engineer' 
              ? 'Your Status Update Performance' 
              : 'Your Sales Pitch Performance'}
          </Heading>
          
          <Text color="gray.700" whiteSpace="pre-line">
            {feedback}
          </Text>
        </Box>
      </Box>
      
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Button
          leftIcon={<Icon as={FaArrowLeft} />}
          colorScheme="brand"
          variant="outline"
          onClick={onNewSession}
        >
          Start New Session
        </Button>
        
        <Button
          leftIcon={<Icon as={FaDownload} />}
          colorScheme="brand"
          variant="outline"
          onClick={handleDownloadFeedback}
        >
          Download Feedback
        </Button>
        
        <Button
          leftIcon={<Icon as={FaClipboard} />}
          colorScheme="brand"
          variant="outline"
          onClick={handleCopyFeedback}
        >
          Copy to Clipboard
        </Button>
      </SimpleGrid>
    </Box>
  );
};

export default FeedbackScreen;