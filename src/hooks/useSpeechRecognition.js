import { useState, useEffect, useRef } from 'react';
import logger from '../utils/logger';

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
  const shouldKeepListeningRef = useRef(false);
  const accumulatedTranscriptRef = useRef('');
  const sessionStartTimeRef = useRef(null);
  const restartCountRef = useRef(0);
  const lastTranscriptRef = useRef('');
  const noiseGateThresholdRef = useRef(15); // Adjustable noise gate
  const minSpeechLevelRef = useRef(25); // Minimum level to consider as speech
  const significantSpeechDetectedRef = useRef(false); // Track last transcript separately

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
      const msg = '🎤 Speech recognition started';
      console.log(msg);
      logger.info(msg);
      setIsListening(true);
      setError(null);

      if (!sessionStartTimeRef.current) {
        sessionStartTimeRef.current = Date.now();
        accumulatedTranscriptRef.current = '';
        restartCountRef.current = 0;
        significantSpeechDetectedRef.current = false;
      }

      const elapsed = sessionStartTimeRef.current ? (Date.now() - sessionStartTimeRef.current) / 1000 : 0;
      const details = `Session time: ${elapsed.toFixed(1)}s, Restarts: ${restartCountRef.current}, Noise gate: ${noiseGateThresholdRef.current}, Min speech: ${minSpeechLevelRef.current}`;
      console.log(`   ${details}`);
      logger.debug(details);

      setDebugInfo(`🎤 Listening... (${elapsed.toFixed(0)}s) - Speak clearly into mic`);
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
      console.log('💬 Speech ended - CRITICAL SAVE POINT');
      console.log(`   lastTranscriptRef right now: "${lastTranscriptRef.current}"`);
      console.log(`   accumulatedTranscriptRef before: "${accumulatedTranscriptRef.current}"`);

      // IMPORTANT: Save transcript NOW before anything else happens
      if (lastTranscriptRef.current && lastTranscriptRef.current.trim()) {
        const textToSave = lastTranscriptRef.current;
        if (!accumulatedTranscriptRef.current.includes(textToSave)) {
          accumulatedTranscriptRef.current += textToSave;
          console.log(`✅ ✅ ✅ SAVED on speechend: "${textToSave}"`);
          console.log(`   Accumulated NOW: "${accumulatedTranscriptRef.current}"`);
        } else {
          console.log(`ℹ️ Already in accumulated: "${textToSave}"`);
        }
      } else {
        console.warn(`⚠️ ⚠️ ⚠️ lastTranscriptRef was EMPTY at speechend!`);
      }

      setDebugInfo('💬 Speech ended - saved text');
    };

    recognition.onresult = (event) => {
      console.log('📝 Speech recognition result:', event);
      console.log(`   Total results: ${event.results.length}`);

      // Build transcript from current segment
      let currentSegmentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        currentSegmentTranscript += event.results[i][0].transcript;
      }

      // Log all results and alternatives
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        console.log(`   Result ${i} (final: ${result.isFinal}):`);

        for (let j = 0; j < result.length; j++) {
          console.log(`      Alt ${j} (conf: ${result[j].confidence?.toFixed(2) || 'N/A'}): "${result[j].transcript}"`);
        }
      }

      // Only process if we have actual meaningful text
      if (currentSegmentTranscript.trim()) {
        // Mark that we got significant speech
        significantSpeechDetectedRef.current = true;

        // Save this transcript immediately for use in onspeechend
        lastTranscriptRef.current = currentSegmentTranscript;

        // Always show combined transcript (accumulated + current)
        const displayTranscript = accumulatedTranscriptRef.current + currentSegmentTranscript;
        console.log(`✅ Display: "${displayTranscript}" (accumulated: "${accumulatedTranscriptRef.current}", current: "${currentSegmentTranscript}")`);

        setTranscript(displayTranscript);

        const elapsed = sessionStartTimeRef.current ? (Date.now() - sessionStartTimeRef.current) / 1000 : 0;
        setDebugInfo(`✅ "${displayTranscript}" (${elapsed.toFixed(0)}s) - Keep speaking or click to stop`);
      } else {
        console.log(`⚠️ Empty transcript in result, ignoring (likely noise)`);
      }
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
      const elapsed = sessionStartTimeRef.current ? (Date.now() - sessionStartTimeRef.current) / 1000 : 0;
      console.log(`   Session elapsed: ${elapsed.toFixed(1)}s`);
      console.log(`   Last transcript ref: "${lastTranscriptRef.current}"`);
      console.log(`   Accumulated: "${accumulatedTranscriptRef.current}"`);
      console.log(`   Should keep listening: ${shouldKeepListeningRef.current}`);

      stopVolumeMonitoring();

      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }

      // Try to save one more time in case onspeechend didn't fire
      if (lastTranscriptRef.current && lastTranscriptRef.current.trim()) {
        if (!accumulatedTranscriptRef.current.includes(lastTranscriptRef.current)) {
          accumulatedTranscriptRef.current += lastTranscriptRef.current;
          console.log(`✅ SAVED on end (backup): "${lastTranscriptRef.current}"`);
          console.log(`   Accumulated now: "${accumulatedTranscriptRef.current}"`);
        }
      }

      // Clear for next segment
      lastTranscriptRef.current = '';

      // If we should keep listening and haven't hit 60 second limit, restart
      if (shouldKeepListeningRef.current && elapsed < 60) {
        console.log(`🔄 Auto-restarting... (accumulated so far: "${accumulatedTranscriptRef.current}")`);
        restartCountRef.current++;

        // Update display with accumulated before restart
        if (accumulatedTranscriptRef.current) {
          setTranscript(accumulatedTranscriptRef.current);
        }

        // Restart after brief delay
        restartTimeoutRef.current = setTimeout(() => {
          try {
            startVolumeMonitoring();
            recognitionRef.current.start();
          } catch (err) {
            console.error('❌ Restart failed:', err);
            setIsListening(false);
            shouldKeepListeningRef.current = false;
          }
        }, 100);
      } else {
        // Actually stop
        console.log('✅ Session complete');
        setIsListening(false);
        shouldKeepListeningRef.current = false;

        // Set final transcript to accumulated
        if (accumulatedTranscriptRef.current) {
          console.log(`✅ Final transcript: "${accumulatedTranscriptRef.current}"`);
          setTranscript(accumulatedTranscriptRef.current);
          setDebugInfo(`✅ Complete! Got: "${accumulatedTranscriptRef.current}"`);
        } else {
          setDebugInfo('Ended - click mic and speak to try again');
        }
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
      shouldKeepListeningRef.current = true;
      sessionStartTimeRef.current = Date.now();
      accumulatedTranscriptRef.current = '';
      restartCountRef.current = 0;
      setDebugInfo('🎤 Starting...');

      console.log('🎤 Starting continuous speech recognition session...');
      console.log('   Language: zh-CN (Mandarin Chinese)');
      console.log('   Continuous: true (with auto-restart on end)');
      console.log('   Max session time: 60 seconds');
      console.log('   Click microphone again to stop');

      // Start volume monitoring
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
      analyser.fftSize = 512; // Increased for better frequency resolution
      analyser.smoothingTimeConstant = 0.8; // Smooth out fluctuations
      source.connect(analyser);

      audioContextRef.current = { audioContext, stream };
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let peakLevel = 0;
      let consecutiveHighSamples = 0;

      volumeCheckIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);

        // Calculate average across relevant frequency bands (human speech: ~85-255 Hz range)
        // Focus on middle frequencies where speech occurs
        const relevantBands = dataArray.slice(2, 40); // Skip very low frequencies
        const average = relevantBands.reduce((a, b) => a + b, 0) / relevantBands.length;

        // Track peak
        if (average > peakLevel) peakLevel = average;

        // Only log if above noise gate
        if (average > noiseGateThresholdRef.current) {
          console.log(`📊 Audio level: ${average.toFixed(1)}/255 ${average > minSpeechLevelRef.current ? '🗣️ SPEECH' : '🔉 low'}`);

          // Count consecutive samples above speech threshold
          if (average > minSpeechLevelRef.current) {
            consecutiveHighSamples++;
            if (consecutiveHighSamples >= 2 && !soundDetectedRef.current) {
              console.log(`✅ ✅ SIGNIFICANT SPEECH DETECTED! Level: ${average.toFixed(1)}`);
              soundDetectedRef.current = true;
            }
          } else {
            consecutiveHighSamples = 0;
          }
        } else {
          // Reset counter if we drop below noise gate
          consecutiveHighSamples = 0;
        }
      }, 300); // Check every 300ms

      console.log('✅ Volume monitoring started with noise gating');
      console.log(`   Noise gate threshold: ${noiseGateThresholdRef.current}/255`);
      console.log(`   Min speech level: ${minSpeechLevelRef.current}/255`);
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
      console.log('🛑 Manual stop requested by user');

      // Set flag to prevent auto-restart
      shouldKeepListeningRef.current = false;

      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }

      stopVolumeMonitoring();
      recognitionRef.current.stop();
    }
  };

  const resetTranscript = () => {
    setTranscript('');
    accumulatedTranscriptRef.current = '';
    lastTranscriptRef.current = '';
    sessionStartTimeRef.current = null;
    restartCountRef.current = 0;
    significantSpeechDetectedRef.current = false;
  };

  // Export ability to adjust noise gate
  const adjustNoiseGate = (threshold) => {
    noiseGateThresholdRef.current = threshold;
    console.log(`🎚️ Noise gate set to: ${threshold}/255`);
  };

  const adjustMinSpeechLevel = (threshold) => {
    minSpeechLevelRef.current = threshold;
    console.log(`🎚️ Min speech level set to: ${threshold}/255`);
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
    adjustNoiseGate,
    adjustMinSpeechLevel,
    isSupported: !!recognitionRef.current
  };
};