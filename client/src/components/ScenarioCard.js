import React from 'react';
import {
  Box,
  Heading,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaCheckCircle } from 'react-icons/fa';

const ScenarioCard = ({ scenario, isSelected, onSelect }) => {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const selectedBg = useColorModeValue('brand.50', 'brand.900');
  const selectedBorder = 'brand.500';

  return (
    <Box
      borderWidth="2px"
      borderRadius="lg"
      borderColor={isSelected ? selectedBorder : borderColor}
      bg={isSelected ? selectedBg : 'white'}
      p={5}
      cursor="pointer"
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-2px)', bg: hoverBg }}
      onClick={onSelect}
      position="relative"
      overflow="hidden"
    >
      {isSelected && (
        <Box position="absolute" top={3} right={3} color="brand.500">
          <FaCheckCircle size={20} />
        </Box>
      )}
      
      <Heading as="h3" size="md" mb={3}>
        {scenario.title}
      </Heading>
      
      <Text color="gray.600">
        {scenario.description}
      </Text>
    </Box>
  );
};

export default ScenarioCard;