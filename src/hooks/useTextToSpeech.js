import { useCallback, useEffect, useState } from 'react';

/**
 * Custom hook for text-to-speech functionality
 * @returns {Object} TTS state and controls
 */
export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
      };

      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = useCallback((text, options = {}) => {
    if (!('speechSynthesis' in window)) {
      console.error('Text-to-speech not supported');
      return;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang || 'zh-CN';
    utterance.rate = options.rate || 0.85;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;

    // Find Chinese voice matching gender preference
    const genderPreference = options.gender || 'female';

    // Try to find a voice matching the gender preference
    let selectedVoice = null;

    // First, try to find a Chinese voice with the preferred gender
    const chineseVoices = voices.filter(voice => voice.lang.startsWith('zh'));

    if (chineseVoices.length > 0) {
      // Try to match gender by voice name (common patterns)
      const preferredVoice = chineseVoices.find(voice => {
        const name = voice.name.toLowerCase();
        if (genderPreference === 'female') {
          return name.includes('female') || name.includes('woman') ||
                 name.includes('ting') || name.includes('huihui') ||
                 name.includes('yaoyao') || !name.includes('male');
        } else {
          return name.includes('male') || name.includes('man') ||
                 name.includes('kangkang') || name.includes('yunyang');
        }
      });

      selectedVoice = preferredVoice || chineseVoices[0];
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log(`🔊 Using voice: ${selectedVoice.name} (requested: ${genderPreference})`);
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  }, [voices]);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported: 'speechSynthesis' in window
  };
};