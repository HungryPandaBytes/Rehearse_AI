import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Button,
  useToast,
  Spinner,
  Center
} from '@chakra-ui/react';
import ScenarioCard from './ScenarioCard';
import { useSession } from '../contexts/SessionContext';
import axios from 'axios';

const SetupScreen = ({ onStartSession }) => {
  const { setSelectedScenario, resetSession } = useSession();
  const [scenarios, setScenarios] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const toast = useToast();

  // Fetch available scenarios
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const response = await axios.get('/api/scenarios');
        setScenarios(response.data.scenarios);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching scenarios:', error);
        toast({
          title: 'Error',
          description: 'Failed to load scenarios. Please check if the server is running.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setIsLoading(false);
        return; // Stop execution after error
      }
    };

    resetSession();
    fetchScenarios();
  }, []); // Empty dependency array since we only want this to run once on mount

  // Handle scenario selection
  const handleSelectScenario = (scenarioId) => {
    setSelected(scenarioId);
  };

  // Start a session with the selected scenario
  const handleStartSession = async () => {
    if (!selected || isStarting) return; // Prevent duplicate requests

    setIsStarting(true);
    
    try {
      // Start a new session with the selected scenario
      await axios.post('/api/start_session', { scenario: selected });
      
      // Update the session context
      setSelectedScenario(selected);
      
      // Navigate to the practice screen
      onStartSession();
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: 'Error',
        description: 'Failed to start session. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <Center h="50vh">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  return (
    <Box>
      <Heading as="h2" size="lg" mb={6}>
        Choose Your Scenario
      </Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
        {scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            isSelected={selected === scenario.id}
            onSelect={() => handleSelectScenario(scenario.id)}
          />
        ))}
      </SimpleGrid>
      
      <Button
        colorScheme="brand"
        size="lg"
        isDisabled={!selected}
        onClick={handleStartSession}
        isLoading={isStarting}
        loadingText="Preparing..."
        width={{ base: "full", md: "auto" }}
      >
        Start Practice Session
      </Button>
    </Box>
  );
};

export default SetupScreen;