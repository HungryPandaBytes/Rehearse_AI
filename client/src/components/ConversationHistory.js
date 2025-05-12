import React, { useRef, useEffect } from 'react';
import {
  Box,
  Text,
  Flex,
  useColorModeValue,
  keyframes
} from '@chakra-ui/react';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 0.8; }
  100% { opacity: 0.6; }
`;

const ConversationHistory = ({ conversations, currentTranscription }) => {
  const containerRef = useRef(null);
  const userBg = useColorModeValue('blue.50', 'blue.900');
  const assistantBg = useColorModeValue('gray.50', 'gray.700');
  const userColor = useColorModeValue('blue.800', 'blue.100');
  const assistantColor = useColorModeValue('gray.800', 'gray.100');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [conversations, currentTranscription]);

  return (
    <Box 
      ref={containerRef}
      p={4} 
      h="100%" 
      overflowY="auto"
      css={{
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: useColorModeValue('gray.300', 'gray.600'),
          borderRadius: '4px',
        },
      }}
    >
      {conversations.map((message, index) => (
        <Flex
          key={index}
          justify={message.role === 'user' ? 'flex-end' : 'flex-start'}
          mb={4}
          animation={`${fadeIn} 0.3s ease-out`}
        >
          <Box
            maxW="80%"
            bg={message.role === 'user' ? userBg : assistantBg}
            color={message.role === 'user' ? userColor : assistantColor}
            p={4}
            borderRadius="lg"
            boxShadow="sm"
            borderWidth="1px"
            borderColor={borderColor}
            position="relative"
            _before={{
              content: '""',
              position: 'absolute',
              top: '50%',
              [message.role === 'user' ? 'right' : 'left']: '-8px',
              transform: 'translateY(-50%)',
              borderStyle: 'solid',
              borderWidth: '8px',
              borderColor: `transparent ${message.role === 'user' ? userBg : 'transparent'} transparent ${message.role === 'user' ? 'transparent' : assistantBg}`,
            }}
          >
            <Text 
              fontSize="md" 
              lineHeight="1.5"
              whiteSpace="pre-wrap"
            >
              {message.content}
            </Text>
          </Box>
        </Flex>
      ))}
      
      {currentTranscription && (
        <Flex justify="flex-end" mb={4}>
          <Box
            maxW="80%"
            bg={userBg}
            color={userColor}
            p={4}
            borderRadius="lg"
            boxShadow="sm"
            borderWidth="1px"
            borderColor={borderColor}
            position="relative"
            animation={`${pulse} 2s infinite`}
            _before={{
              content: '""',
              position: 'absolute',
              top: '50%',
              right: '-8px',
              transform: 'translateY(-50%)',
              borderStyle: 'solid',
              borderWidth: '8px',
              borderColor: 'transparent blue.50 transparent transparent',
            }}
          >
            <Text 
              fontSize="md" 
              lineHeight="1.5"
              whiteSpace="pre-wrap"
            >
              {currentTranscription}
            </Text>
          </Box>
        </Flex>
      )}
    </Box>
  );
};

export default ConversationHistory;