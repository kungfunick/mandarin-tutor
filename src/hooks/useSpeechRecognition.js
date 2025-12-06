import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for speech recognition functionality
 * @returns {Object} Speech recognition state and controls
 */
export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const recognitionRef = useRef(null);
  const micPermissionRef = useRef(false);
  const restartTimeoutRef = useRef(null);
  const hasReceivedSpeechRef = useRef(false);
  const audioStartTimeRef = useRef(null);
  const soundDetectedRef = useRef(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const volumeCheckIntervalRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser');
      setDebugInfo('Browser does not support Speech Recognition API');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();

    // Configure recognition - try both continuous modes
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN';
    recognition.maxAlternatives = 5; // Increased for better alternatives

    recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      setIsListening(true);
      setError(null);
      hasReceivedSpeechRef.current = false;
      soundDetectedRef.current = false;
      audioStartTimeRef.current = null;
      setDebugInfo('🎤 Ready - speak in Mandarin now!');
    };

    recognition.onaudiostart = () => {
      console.log('🔊 Audio capture started');
      audioStartTimeRef.current = Date.now();
      setDebugInfo('🔊 Microphone active - I can hear audio! Speak in Mandarin...');
    };

    recognition.onaudioend = () => {
      console.log('🔇 Audio capture ended');
      const duration = audioStartTimeRef.current ? Date.now() - audioStartTimeRef.current : 0;
      console.log(`   Audio was active for ${duration}ms`);
      setDebugInfo('🔇 Audio ended - processing...');
    };

    recognition.onsoundstart = () => {
      console.log('🎵 Sound detected (hearing something!)');
      soundDetectedRef.current = true;
      setDebugInfo('🎵 Sound detected! Keep speaking...');
    };

    recognition.onsoundend = () => {
      console.log('🔕 Sound ended');
      setDebugInfo('🔕 Sound ended - checking for speech...');
    };

    recognition.onspeechstart = () => {
      console.log('💬 Speech detected (recognizing as speech!)');
      hasReceivedSpeechRef.current = true;
      setDebugInfo('💬 Speech recognized! Processing Mandarin...');
    };

    recognition.onspeechend = () => {
      console.log('💬 Speech ended');
      setDebugInfo('💬 Speech ended - finalizing transcript...');
    };

    recognition.onresult = (event) => {
      console.log('📝 Speech recognition result:', event);
      console.log(`   Total results: ${event.results.length}`);

      // Build complete transcript from all results
      let fullTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
      }

      // Log all results and alternatives
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        console.log(`   Result ${i} (final: ${result.isFinal}):`);

        for (let j = 0; j < result.length; j++) {
          console.log(`      Alt ${j} (conf: ${result[j].confidence?.toFixed(2) || 'N/A'}): "${result[j].transcript}"`);
        }
      }

      console.log(`✅ Full transcript so far: "${fullTranscript}"`);
      setTranscript(fullTranscript);
      setDebugInfo(`✅ Got: "${fullTranscript}" (keep speaking or click mic to stop)`);

      // Don't auto-stop - let user control when to stop
      // This prevents the API from cutting off early
    };

    recognition.onerror = (event) => {
      console.error('❌ Speech recognition error:', event.error, event);
      console.log(`   Sound was detected: ${soundDetectedRef.current}`);
      console.log(`   Speech was detected: ${hasReceivedSpeechRef.current}`);

      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }

      let errorMessage = '';
      let debugMessage = '';

      switch (event.error) {
        case 'not-allowed':
          errorMessage = 'Microphone access denied.';
          debugMessage = 'ERROR: Permission denied. Check browser settings.';
          setIsListening(false);
          break;
        case 'no-speech':
          // If we detected sound but no speech, it might be a language issue
          if (soundDetectedRef.current && !hasReceivedSpeechRef.current) {
            errorMessage = 'Sound detected but not recognized as Mandarin speech.';
            debugMessage = 'ISSUE: Hearing audio but not recognizing it as Mandarin. Try: 1) Speaking more clearly 2) Different browser 3) Check system language settings';
            console.warn('⚠️ Sound detected but speech not recognized - possible language detection issue');
            console.warn('   Try: Speaking louder/clearer, checking browser language settings, or using Chrome');
          } else if (!hasReceivedSpeechRef.current) {
            errorMessage = 'No speech detected. Speak immediately after clicking mic.';
            debugMessage = 'No speech detected. Try speaking louder or closer to mic.';
          } else {
            // Normal end after speech
            console.log('ℹ️ Natural end after speech detected');
            debugMessage = 'Finished listening (natural end)';
          }
          setIsListening(false);
          break;
        case 'audio-capture':
          errorMessage = 'Microphone error. Check connection.';
          debugMessage = 'ERROR: Cannot capture audio. Check microphone connection.';
          setIsListening(false);
          break;
        case 'network':
          errorMessage = 'Network error. Check internet connection.';
          debugMessage = 'ERROR: Network issue. Speech recognition needs internet.';
          setIsListening(false);
          break;
        case 'aborted':
          // Only log if we didn't manually stop
          if (hasReceivedSpeechRef.current && transcript) {
            console.log('ℹ️ Recognition aborted but we have transcript - this is OK');
            debugMessage = 'Stopped (got your text)';
          } else {
            console.log('ℹ️ Recognition aborted - manual stop or timeout');
            debugMessage = 'Stopped';
          }
          setIsListening(false);
          break;
        case 'language-not-supported':
          errorMessage = 'Mandarin (zh-CN) not supported.';
          debugMessage = 'ERROR: Language not supported. Try Chrome or Edge.';
          setIsListening(false);
          break;
        default:
          errorMessage = `Speech error: ${event.error}`;
          debugMessage = `Unknown error: ${event.error}`;
          setIsListening(false);
      }

      if (errorMessage) setError(errorMessage);
      if (debugMessage) setDebugInfo(debugMessage);
    };

    recognition.onend = () => {
      console.log('🛑 Speech recognition ended');
      console.log(`   Final state - Sound: ${soundDetectedRef.current}, Speech: ${hasReceivedSpeechRef.current}, Transcript: "${transcript}"`);
      setIsListening(false);

      stopVolumeMonitoring();

      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }

      if (!transcript) {
        if (soundDetectedRef.current && !hasReceivedSpeechRef.current) {
          setDebugInfo('⚠️ Heard sound but couldn\'t recognize speech. Try speaking more clearly or use Chrome.');
        } else if (!soundDetectedRef.current) {
          setDebugInfo('⚠️ No sound detected at all! Check: 1) Mic not muted 2) Correct mic selected 3) System volume');
        } else {
          setDebugInfo('Ended - no speech captured');
        }
      } else {
        setDebugInfo('✅ Complete! Text is in the input box.');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, [transcript]);

  const requestMicrophonePermission = async () => {
    try {
      console.log('🎤 Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get list of available audio devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      console.log('🎤 Available microphones:', audioInputs.map(d => `${d.label} (${d.deviceId})`));

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      // Test volume levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let maxVolume = 0;

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        if (average > maxVolume) maxVolume = average;
      };

      // Check volume for 500ms
      const volumeInterval = setInterval(checkVolume, 50);

      await new Promise(resolve => setTimeout(resolve, 500));
      clearInterval(volumeInterval);

      console.log('✅ Microphone permission granted');
      console.log(`   Peak audio level detected: ${maxVolume.toFixed(1)}/255`);

      if (maxVolume < 5) {
        console.warn('⚠️ Very low audio level detected! Microphone might be muted or too quiet.');
        setDebugInfo('⚠️ WARNING: Mic volume very low! Check system mic volume.');
      }

      stream.getTracks().forEach(track => track.stop());
      audioContext.close();

      micPermissionRef.current = true;
      return true;
    } catch (err) {
      console.error('❌ Microphone permission error:', err);
      setError('Microphone access denied.');
      setDebugInfo(`Permission error: ${err.message}`);
      return false;
    }
  };

  const startListening = async () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not available');
      setDebugInfo('Speech Recognition API not available');
      return;
    }

    if (!micPermissionRef.current) {
      console.log('🎤 Requesting permission...');
      const granted = await requestMicrophonePermission();
      if (!granted) return;
    }

    try {
      setError(null);
      setTranscript('');
      hasReceivedSpeechRef.current = false;
      soundDetectedRef.current = false;
      audioStartTimeRef.current = null;
      setDebugInfo('🎤 Starting...');

      console.log('🎤 Starting speech recognition...');
      console.log('   Language: zh-CN (Mandarin Chinese)');
      console.log('   Continuous: true');
      console.log('   Interim results: true');
      console.log('   Max alternatives: 5');

      // Start real-time volume monitoring
      await startVolumeMonitoring();

      recognitionRef.current.start();
    } catch (err) {
      console.error('❌ Error starting:', err);
      if (err.message && err.message.includes('already started')) {
        console.log('♻️ Already running, restarting...');
        recognitionRef.current.stop();
        setTimeout(() => {
          try {
            recognitionRef.current.start();
          } catch (retryErr) {
            console.error('❌ Retry failed:', retryErr);
            setError('Could not start. Try again.');
            setDebugInfo(`Error: ${retryErr.message}`);
          }
        }, 300);
      } else {
        setError('Could not start. Try again.');
        setDebugInfo(`Error: ${err.message}`);
      }
    }
  };

  const startVolumeMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = { audioContext, stream };
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      volumeCheckIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

        if (average > 1) {
          console.log(`📊 Live audio level: ${average.toFixed(1)}/255`);
        }

        if (average > 20 && !soundDetectedRef.current) {
          console.log(`✅ SOUND DETECTED! Level: ${average.toFixed(1)}`);
          soundDetectedRef.current = true;
        }
      }, 500);

      console.log('✅ Volume monitoring started');
    } catch (err) {
      console.error('❌ Volume monitoring failed:', err);
    }
  };

  const stopVolumeMonitoring = () => {
    if (volumeCheckIntervalRef.current) {
      clearInterval(volumeCheckIntervalRef.current);
      volumeCheckIntervalRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.stream.getTracks().forEach(track => track.stop());
      audioContextRef.current.audioContext.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      console.log('🛑 Manual stop requested');

      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }

      stopVolumeMonitoring();
      recognitionRef.current.stop();
    }
  };

  const resetTranscript = () => {
    setTranscript('');
    hasReceivedSpeechRef.current = false;
    soundDetectedRef.current = false;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVolumeMonitoring();
    };
  }, []);

  return {
    isListening,
    transcript,
    error,
    debugInfo,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: !!recognitionRef.current
  };
};