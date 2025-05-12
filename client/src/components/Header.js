import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';

const Header = () => {
  return (
    <Box as="header" textAlign="center" mb={10}>
      <Heading as="h1" size="2xl" color="brand.500" mb={3}>
        Role-Play Practice App
      </Heading>
      <Text fontSize="lg" color="gray.600">
        Practice your communication skills with AI feedback
      </Text>
    </Box>
  );
};

export default Header;