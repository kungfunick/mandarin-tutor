/**
 * Enhanced Speech Recognition Hook
 * Optimized for Mandarin Chinese with better tone recognition
 * Handles single characters and short phrases better
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({
    status: 'idle',
    lastResult: '',
    confidence: 0,
    alternatives: []
  });

  const recognitionRef = useRef(null);
  const noiseGateRef = useRef(15);
  const minSpeechLevelRef = useRef(25);
  const restartTimeoutRef = useRef(null);
  const resultsRef = useRef([]);
  const silenceTimeoutRef = useRef(null);

  // Check browser support
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Initialize recognition
  const initRecognition = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition not supported in this browser');
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Configure for Mandarin Chinese
    recognition.lang = 'zh-CN';
    
    // KEY SETTINGS FOR BETTER SINGLE CHARACTER RECOGNITION:
    // - continuous: true allows for ongoing speech capture
    // - interimResults: true gives us partial results as user speaks
    recognition.continuous = true;
    recognition.interimResults = true;
    
    // Request maximum alternatives for better tone matching
    recognition.maxAlternatives = 5;

    recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      setIsListening(true);
      setError(null);
      resultsRef.current = [];
      setDebugInfo(prev => ({ ...prev, status: 'listening' }));
    };

    recognition.onend = () => {
      console.log('🔇 Speech recognition ended');
      setIsListening(false);
      setDebugInfo(prev => ({ ...prev, status: 'stopped' }));
      
      // Clear any pending timeouts
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // Don't show error for expected cases
      if (event.error === 'no-speech') {
        setDebugInfo(prev => ({ ...prev, status: 'no speech detected' }));
        return;
      }
      if (event.error === 'aborted') {
        return;
      }
      
      setError(`Recognition error: ${event.error}`);
      setIsListening(false);
      setDebugInfo(prev => ({ ...prev, status: `error: ${event.error}` }));
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      const allAlternatives = [];

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        
        // Collect all alternatives for debugging and potential matching
        for (let j = 0; j < result.length; j++) {
          allAlternatives.push({
            text: result[j].transcript,
            confidence: result[j].confidence,
            isFinal: result.isFinal
          });
        }

        if (result.isFinal) {
          // For final results, pick the best match
          // The first alternative is usually the best, but we store all for debugging
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // Update debug info with alternatives
      setDebugInfo(prev => ({
        ...prev,
        status: 'processing',
        lastResult: finalTranscript || interimTranscript,
        confidence: allAlternatives[0]?.confidence || 0,
        alternatives: allAlternatives.slice(0, 5) // Show top 5 alternatives
      }));

      // For single character practice, we want to capture even brief utterances
      // Use interim results but wait a moment before finalizing
      const currentTranscript = finalTranscript || interimTranscript;
      
      if (currentTranscript) {
        // Clear existing silence timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }

        // For short inputs (1-2 characters), finalize quickly
        // For longer inputs, wait a bit longer
        const waitTime = currentTranscript.length <= 2 ? 500 : 1000;

        if (finalTranscript) {
          // It's already final, use it immediately
          console.log('📝 Final transcript:', finalTranscript);
          setTranscript(finalTranscript.trim());
        } else {
          // Set a timeout to finalize interim results
          silenceTimeoutRef.current = setTimeout(() => {
            if (interimTranscript) {
              console.log('📝 Interim transcript finalized:', interimTranscript);
              setTranscript(interimTranscript.trim());
            }
          }, waitTime);
        }
      }
    };

    recognition.onspeechstart = () => {
      console.log('🗣️ Speech detected');
      setDebugInfo(prev => ({ ...prev, status: 'speech detected' }));
    };

    recognition.onspeechend = () => {
      console.log('🔇 Speech ended');
      setDebugInfo(prev => ({ ...prev, status: 'speech ended' }));
    };

    return recognition;
  }, [isSupported]);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition not supported');
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }

    // Clear previous transcript
    setTranscript('');
    setError(null);
    resultsRef.current = [];

    // Create new recognition instance
    const recognition = initRecognition();
    if (recognition) {
      recognitionRef.current = recognition;
      
      try {
        recognition.start();
      } catch (e) {
        console.error('Failed to start recognition:', e);
        setError('Failed to start speech recognition');
      }
    }
  }, [initRecognition, isSupported]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }
    
    // Clear timeouts
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    
    setIsListening(false);
  }, []);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    resultsRef.current = [];
    setDebugInfo(prev => ({ 
      ...prev, 
      lastResult: '', 
      confidence: 0,
      alternatives: []
    }));
  }, []);

  // Adjust noise gate (for compatibility, not used with Web Speech API)
  const adjustNoiseGate = useCallback((value) => {
    noiseGateRef.current = value;
    console.log('Noise gate adjusted to:', value);
  }, []);

  // Adjust minimum speech level
  const adjustMinSpeechLevel = useCallback((value) => {
    minSpeechLevelRef.current = value;
    console.log('Min speech level adjusted to:', value);
  }, []);

  // Get alternatives for the current result (useful for tone practice)
  const getAlternatives = useCallback(() => {
    return debugInfo.alternatives;
  }, [debugInfo.alternatives]);

  // Check if a specific character/word was recognized (checks alternatives too)
  const checkForMatch = useCallback((target) => {
    const alternatives = debugInfo.alternatives || [];
    
    // Check main transcript
    if (transcript.includes(target)) {
      return { matched: true, confidence: 'high', source: 'primary' };
    }
    
    // Check alternatives
    for (const alt of alternatives) {
      if (alt.text.includes(target)) {
        return { 
          matched: true, 
          confidence: alt.confidence > 0.8 ? 'high' : alt.confidence > 0.5 ? 'medium' : 'low',
          source: 'alternative'
        };
      }
    }
    
    return { matched: false, confidence: 'none', source: null };
  }, [transcript, debugInfo.alternatives]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    error,
    debugInfo,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    adjustNoiseGate,
    adjustMinSpeechLevel,
    getAlternatives,
    checkForMatch
  };
};

export default useSpeechRecognition;