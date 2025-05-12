import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import App from './App';

// Custom theme
const theme = extendTheme({
  colors: {
    brand: {
      50: '#e6f1ff',
      100: '#c2d9ff',
      200: '#9ec0ff',
      300: '#7aa8ff',
      400: '#5690ff',
      500: '#4a6fff', // Primary color
      600: '#3256d9',
      700: '#1e3eb3',
      800: '#0d288c',
      900: '#001466',
    },
  },
  fonts: {
    heading: '"Inter", sans-serif',
    body: '"Inter", sans-serif',
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);