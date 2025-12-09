/**
 * Study Guide Context
 * Manages AI-powered study recommendations and progress tracking
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const StudyGuideContext = createContext(null);

export const useStudyGuide = () => {
  const context = useContext(StudyGuideContext);
  if (!context) {
    throw new Error('useStudyGuide must be used within StudyGuideProvider');
  }
  return context;
};

export const StudyGuideProvider = ({ children }) => {
  const { user } = useAuth();
  const [studyGuides, setStudyGuides] = useState({});
  const [loading, setLoading] = useState(false);

  // Load study guides from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('studyGuides');
    if (saved) {
      try {
        setStudyGuides(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading study guides:', e);
      }
    }
  }, []);

  // Save to localStorage whenever guides change
  useEffect(() => {
    if (Object.keys(studyGuides).length > 0) {
      localStorage.setItem('studyGuides', JSON.stringify(studyGuides));
    }
  }, [studyGuides]);

  // Generate study guide based on conversation analysis
  const generateStudyGuide = async (userId, conversationHistory) => {
    setLoading(true);

    try {
      // Analyze conversation for patterns
      const analysis = analyzeConversation(conversationHistory);
      
      // Generate recommendations
      const recommendations = generateRecommendations(analysis);
      
      // Create study guide
      const guide = {
        userId,
        generatedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        conversationCount: conversationHistory.length,
        analysis,
        recommendations,
        progress: {
          vocabularyMastered: analysis.uniqueWords,
          grammarPointsCovered: analysis.grammarPatterns.length,
          hoursOfPractice: Math.round(conversationHistory.length * 0.05), // Rough estimate
          fluencyScore: calculateFluencyScore(analysis)
        },
        weeklyGoals: generateWeeklyGoals(analysis),
        practiceExercises: generatePracticeExercises(analysis)
      };

      setStudyGuides(prev => ({
        ...prev,
        [userId]: guide
      }));

      return guide;
    } catch (error) {
      console.error('Error generating study guide:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update study guide with new observation
  const addObservation = (userId, observation) => {
    setStudyGuides(prev => {
      const guide = prev[userId] || createEmptyGuide(userId);
      
      return {
        ...prev,
        [userId]: {
          ...guide,
          lastUpdated: new Date().toISOString(),
          observations: [
            ...(guide.observations || []),
            {
              id: Date.now().toString(),
              text: observation,
              timestamp: new Date().toISOString(),
              addedBy: user.name
            }
          ]
        }
      };
    });
  };

  // Mark a goal as completed
  const completeGoal = (userId, goalId) => {
    setStudyGuides(prev => {
      const guide = prev[userId];
      if (!guide) return prev;

      return {
        ...prev,
        [userId]: {
          ...guide,
          lastUpdated: new Date().toISOString(),
          weeklyGoals: guide.weeklyGoals.map(goal =>
            goal.id === goalId
              ? { ...goal, completed: true, completedAt: new Date().toISOString() }
              : goal
          )
        }
      };
    });
  };

  const getStudyGuide = (userId) => {
    return studyGuides[userId] || null;
  };

  const getAllStudyGuides = () => {
    if (user?.role !== 'admin' && user?.role !== 'teacher') return {};
    return studyGuides;
  };

  const value = {
    studyGuides,
    loading,
    generateStudyGuide,
    addObservation,
    completeGoal,
    getStudyGuide,
    getAllStudyGuides
  };

  return (
    <StudyGuideContext.Provider value={value}>
      {children}
    </StudyGuideContext.Provider>
  );
};

// Helper functions

function createEmptyGuide(userId) {
  return {
    userId,
    generatedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    conversationCount: 0,
    analysis: {},
    recommendations: [],
    progress: {
      vocabularyMastered: 0,
      grammarPointsCovered: 0,
      hoursOfPractice: 0,
      fluencyScore: 0
    },
    weeklyGoals: [],
    practiceExercises: [],
    observations: []
  };
}

function analyzeConversation(history) {
  const words = new Set();
  const grammarPatterns = new Set();
  const commonMistakes = [];
  const strengths = [];

  history.forEach(msg => {
    if (msg.role === 'user' && msg.mandarin) {
      // Extract words
      const messageWords = msg.mandarin.match(/[\u4e00-\u9fa5]+/g) || [];
      messageWords.forEach(w => words.add(w));

      // Detect grammar patterns (simplified)
      if (msg.mandarin.includes('了')) grammarPatterns.add('Past tense (了)');
      if (msg.mandarin.includes('过')) grammarPatterns.add('Experience (过)');
      if (msg.mandarin.includes('在')) grammarPatterns.add('Progressive (在)');
      if (msg.mandarin.includes('会')) grammarPatterns.add('Future/ability (会)');
      if (msg.mandarin.includes('的')) grammarPatterns.add('Possessive/modifier (的)');
      if (msg.mandarin.includes('吗')) grammarPatterns.add('Question particle (吗)');
    }

    // Extract corrections from AI responses
    if (msg.role === 'assistant' && msg.mandarin) {
      const errorMatch = msg.mandarin.match(/\[error:(.*?)→(.*?)\]/g);
      if (errorMatch) {
        errorMatch.forEach(err => {
          const parts = err.match(/\[error:(.*?)→(.*?)\]/);
          if (parts) {
            commonMistakes.push({
              incorrect: parts[1].trim(),
              correct: parts[2].trim()
            });
          }
        });
      }

      const correctMatch = msg.mandarin.match(/\[correct:(.*?)\]/g);
      if (correctMatch) {
        correctMatch.forEach(str => {
          const parts = str.match(/\[correct:(.*?)\]/);
          if (parts) {
            strengths.push(parts[1].trim());
          }
        });
      }
    }
  });

  return {
    uniqueWords: words.size,
    vocabulary: Array.from(words).slice(0, 20), // Sample
    grammarPatterns: Array.from(grammarPatterns),
    commonMistakes: commonMistakes.slice(-5), // Last 5
    strengths: strengths.slice(-5),
    totalMessages: history.filter(m => m.role === 'user').length
  };
}

function generateRecommendations(analysis) {
  const recommendations = [];

  // Vocabulary recommendations
  if (analysis.uniqueWords < 50) {
    recommendations.push({
      category: 'Vocabulary',
      priority: 'high',
      title: 'Expand Basic Vocabulary',
      description: 'Focus on learning 10 new words per day from everyday topics',
      resources: ['HSK 1-2 word lists', 'Daily conversation phrases']
    });
  } else if (analysis.uniqueWords < 200) {
    recommendations.push({
      category: 'Vocabulary',
      priority: 'medium',
      title: 'Build Intermediate Vocabulary',
      description: 'Learn topic-specific vocabulary and common expressions',
      resources: ['HSK 3-4 word lists', 'Chinese idioms (成语)']
    });
  }

  // Grammar recommendations
  if (!analysis.grammarPatterns.includes('Past tense (了)')) {
    recommendations.push({
      category: 'Grammar',
      priority: 'high',
      title: 'Master Past Tense Marker 了',
      description: 'Practice using 了 to indicate completed actions',
      resources: ['Grammar point: 了 usage', 'Practice sentences']
    });
  }

  // Mistake-based recommendations
  if (analysis.commonMistakes.length > 0) {
    recommendations.push({
      category: 'Error Correction',
      priority: 'high',
      title: 'Address Common Mistakes',
      description: `Focus on correcting: ${analysis.commonMistakes.map(m => m.incorrect).join(', ')}`,
      resources: ['Review corrections', 'Practice exercises']
    });
  }

  // Conversation practice
  recommendations.push({
    category: 'Practice',
    priority: 'medium',
    title: 'Daily Conversation Practice',
    description: 'Aim for 15-20 minutes of Chinese conversation daily',
    resources: ['Speaking exercises', 'Dialogue practice']
  });

  return recommendations;
}

function generateWeeklyGoals(analysis) {
  const goals = [];

  goals.push({
    id: 'vocab-' + Date.now(),
    title: 'Learn 50 New Words',
    description: 'Master 50 new vocabulary words this week',
    progress: 0,
    target: 50,
    completed: false
  });

  goals.push({
    id: 'convo-' + Date.now(),
    title: 'Practice 10 Conversations',
    description: 'Complete 10 practice conversations with the AI tutor',
    progress: 0,
    target: 10,
    completed: false
  });

  if (analysis.grammarPatterns.length < 5) {
    goals.push({
      id: 'grammar-' + Date.now(),
      title: 'Learn 3 Grammar Patterns',
      description: 'Master 3 new grammar structures',
      progress: 0,
      target: 3,
      completed: false
    });
  }

  return goals;
}

function generatePracticeExercises(analysis) {
  const exercises = [];

  exercises.push({
    id: 'ex-1',
    title: 'Self Introduction',
    type: 'conversation',
    difficulty: 'beginner',
    description: 'Practice introducing yourself in Chinese',
    prompt: 'Introduce yourself: name, age, where you\'re from, and what you like to do'
  });

  exercises.push({
    id: 'ex-2',
    title: 'Ordering Food',
    type: 'conversation',
    difficulty: 'beginner',
    description: 'Practice ordering food at a restaurant',
    prompt: 'Order your favorite Chinese dish and ask about the price'
  });

  exercises.push({
    id: 'ex-3',
    title: 'Daily Routine',
    type: 'conversation',
    difficulty: 'intermediate',
    description: 'Describe your daily routine',
    prompt: 'Describe what you do from morning to evening'
  });

  return exercises;
}

function calculateFluencyScore(analysis) {
  let score = 0;

  // Vocabulary contribution (0-40 points)
  score += Math.min(40, analysis.uniqueWords / 5);

  // Grammar patterns (0-30 points)
  score += Math.min(30, analysis.grammarPatterns.length * 5);

  // Message count (0-20 points)
  score += Math.min(20, analysis.totalMessages);

  // Deduct for common mistakes (max -10 points)
  score -= Math.min(10, analysis.commonMistakes.length * 2);

  return Math.max(0, Math.min(100, Math.round(score)));
}

export default StudyGuideContext;
