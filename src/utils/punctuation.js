/**
 * Chinese Punctuation Utility
 * Adds intelligent punctuation to Chinese speech transcripts
 */

/**
 * Add punctuation to Chinese text based on pauses and context
 */
export const addChinesePunctuation = (text, options = {}) => {
  const {
    addPeriods = true,
    addCommas = true,
    addQuestionMarks = true,
    language = 'zh-CN'
  } = options;

  if (!text || text.trim().length === 0) return text;

  let result = text.trim();

  // Don't add punctuation if it already has ending punctuation
  const hasEndPunctuation = /[。！？，、；：]$/.test(result);
  
  if (hasEndPunctuation) {
    return result;
  }

  // Question detection for Chinese
  if (addQuestionMarks) {
    // Question words that should trigger question mark
    const questionWords = [
      '吗', '呢', '什么', '谁', '哪', '哪里', '怎么', '为什么', 
      '几', '多少', '如何', '何时', '哪儿', '咋', '啥'
    ];

    // Check if text contains question words or starts with question patterns
    const hasQuestionWord = questionWords.some(word => result.includes(word));
    const startsWithQuestion = /^(是不是|对不对|好不好|可不可以|能不能|会不会)/.test(result);
    
    if (hasQuestionWord || startsWithQuestion) {
      return result + '？';
    }
  }

  // Exclamation detection
  const exclamationWords = ['太', '真', '好极了', '糟糕', '哇', '啊'];
  const hasExclamation = exclamationWords.some(word => result.includes(word));
  
  if (hasExclamation) {
    return result + '！';
  }

  // Default to period for statements
  if (addPeriods) {
    return result + '。';
  }

  return result;
};

/**
 * Add commas for long sentences (split on natural pauses)
 */
export const addCommasToLongSentence = (text) => {
  if (!text || text.length < 10) return text;

  // Split on common conjunctions and add commas
  const conjunctions = [
    { pattern: /(但是|可是|不过)(?!，)/g, replacement: '，$1' },
    { pattern: /(因为)(.{3,})(?=所以)/g, replacement: '$1$2，' },
    { pattern: /(虽然)(.{3,})(?=但是|可是)/g, replacement: '$1$2，' },
    { pattern: /(如果)(.{3,})(?=就|那么)/g, replacement: '$1$2，' },
  ];

  let result = text;
  conjunctions.forEach(({ pattern, replacement }) => {
    result = result.replace(pattern, replacement);
  });

  return result;
};

/**
 * Process speech recognition result with intelligent punctuation
 */
export const processSpeechWithPunctuation = (
  transcript, 
  isFinal, 
  previousTranscript = '',
  pauseDetected = false
) => {
  let processed = transcript.trim();

  // If this is a continuation, don't re-punctuate the previous part
  if (previousTranscript && processed.startsWith(previousTranscript)) {
    const newPart = processed.substring(previousTranscript.length).trim();
    if (!newPart) return previousTranscript;
    
    // Check if we should add a comma for pause
    if (pauseDetected && !/[，。！？]$/.test(previousTranscript)) {
      return previousTranscript + '，' + newPart;
    }
    
    return previousTranscript + newPart;
  }

  // Add commas for long sentences
  processed = addCommasToLongSentence(processed);

  // Add ending punctuation if this is final
  if (isFinal) {
    processed = addChinesePunctuation(processed);
  }

  return processed;
};

/**
 * Detect if there's a pause in speech (for comma insertion)
 */
export const createPauseDetector = () => {
  let lastSpeechTime = Date.now();
  let pauseThreshold = 800; // ms of silence to detect pause

  return {
    recordSpeech: () => {
      lastSpeechTime = Date.now();
    },
    
    isPaused: () => {
      return Date.now() - lastSpeechTime > pauseThreshold;
    },
    
    setPauseThreshold: (ms) => {
      pauseThreshold = ms;
    },
    
    reset: () => {
      lastSpeechTime = Date.now();
    }
  };
};

/**
 * English punctuation (for reference/comparison)
 */
export const addEnglishPunctuation = (text, options = {}) => {
  const { addPeriods = true } = options;
  
  if (!text || text.trim().length === 0) return text;
  
  let result = text.trim();
  
  // Already has punctuation
  if (/[.!?,;:]$/.test(result)) {
    return result;
  }
  
  // Question detection
  const questionWords = ['what', 'who', 'where', 'when', 'why', 'how', 'is', 'are', 'do', 'does', 'can', 'could', 'would', 'should'];
  const firstWord = result.split(' ')[0]?.toLowerCase();
  
  if (questionWords.includes(firstWord)) {
    return result + '?';
  }
  
  // Exclamation detection
  const exclamationWords = ['wow', 'oh', 'ah', 'hey', 'great', 'amazing', 'terrible'];
  if (exclamationWords.some(word => result.toLowerCase().includes(word))) {
    return result + '!';
  }
  
  // Default period
  if (addPeriods) {
    return result + '.';
  }
  
  return result;
};

export default {
  addChinesePunctuation,
  addCommasToLongSentence,
  processSpeechWithPunctuation,
  createPauseDetector,
  addEnglishPunctuation
};
