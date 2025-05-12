import { useState, useEffect } from 'react';

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const [recorder, setRecorder] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [error, setError] = useState(null);
  const [onDataAvailable, setOnDataAvailable] = useState(null);
  const [chunks, setChunks] = useState([]);

  // Initialize the audio recorder
  useEffect(() => {
    let mounted = true;

    const initRecorder = async () => {
      try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        
        if (mounted) {
          setMediaStream(stream);
          
          // Create MediaRecorder instance with 1-second timeslice
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm',
            audioBitsPerSecond: 128000
          });
          
          // Handle data available event
          mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              const chunk = e.data;
              setChunks(prev => [...prev, chunk]);
              if (onDataAvailable) {
                onDataAvailable(chunk);
              }
            }
          };
          
          // Handle recording stop event
          mediaRecorder.onstop = () => {
            if (chunks.length > 0) {
              const blob = new Blob(chunks, { type: 'audio/webm' });
              const url = URL.createObjectURL(blob);
              setAudioURL(url);
              setChunks([]); // Clear chunks
            }
          };
          
          setRecorder(mediaRecorder);
        }
      } catch (err) {
        console.error('Error accessing microphone:', err);
        setError(err.message);
      }
    };

    initRecorder();

    return () => {
      mounted = false;
      // Clean up media stream
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onDataAvailable, chunks]);

  // Start recording
  const startRecording = () => {
    if (recorder && recorder.state === 'inactive') {
      setChunks([]); // Clear any existing chunks
      try {
        recorder.start(1000); // Send data every 1 second
        setIsRecording(true);
        setError(null); // Clear any previous errors
      } catch (err) {
        console.error('Error starting recording:', err);
        setError('Failed to start recording. Please try again.');
      }
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (recorder && recorder.state === 'recording') {
      try {
        recorder.stop();
        setIsRecording(false);
      } catch (err) {
        console.error('Error stopping recording:', err);
        setError('Failed to stop recording. Please try again.');
      }
    }
  };

  // Convert audio chunk to base64
  const getAudioChunkBase64 = async (chunk) => {
    if (!chunk || !(chunk instanceof Blob) || chunk.size === 0) {
      console.warn('Invalid audio chunk received:', chunk);
      return null;
    }

    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(chunk);
        reader.onloadend = () => {
          if (reader.result) {
            // Remove the "data:audio/webm;base64," part
            const base64data = reader.result.split(',')[1];
            resolve(base64data);
          } else {
            reject(new Error('Failed to read audio data'));
          }
        };
        reader.onerror = (error) => {
          console.error('Error reading audio chunk:', error);
          reject(error);
        };
      });
    } catch (err) {
      console.error('Error processing audio chunk:', err);
      return null;
    }
  };

  // Set callback for when audio data is available
  const setDataAvailableCallback = (callback) => {
    setOnDataAvailable(callback);
  };

  return {
    isRecording,
    audioURL,
    startRecording,
    stopRecording,
    getAudioChunkBase64,
    setDataAvailableCallback,
    error
  };
};