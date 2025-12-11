/**
 * Study Guide Component
 * Displays personalized study recommendations and progress
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStudyGuide } from '../contexts/StudyGuideContext';
import {
  BookOpen, Target, TrendingUp, Award, CheckCircle, Circle,
  Brain, MessageSquare, Star, AlertCircle, ChevronRight, Plus,
  Link as LinkIcon, AlertTriangle, Bell, BarChart3, Lightbulb, FileText, X, Loader
} from 'lucide-react';

export const StudyGuidePanel = ({ conversationHistory = [], onClose }) => {
  const { user, profile, isStudent, getTeacher } = useAuth();
  const { studyGuide, loading, error, generateStudyGuide, completeGoal, addObservation } = useStudyGuide();
  const [showAddObservation, setShowAddObservation] = useState(false);
  const [newObservation, setNewObservation] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Get teacher info
  const teacher = isStudent() ? getTeacher(profile?.teacher_id) : null;

  // Create a safe guide object with defaults
  const guide = studyGuide || {
    conversationCount: 0,
    progress: {
      vocabularyMastered: 0,
      grammarPointsCovered: 0,
      fluencyScore: 0
    },
    analysis: {
      strengths: [],
      commonMistakes: []
    },
    weeklyGoals: [],
    recommendations: [],
    observations: [],
    lastUpdated: new Date().toISOString()
  };

  const handleRefreshGuide = async () => {
    if (conversationHistory.length > 0 && user?.id) {
      try {
        await generateStudyGuide(user.id, conversationHistory);
      } catch (err) {
        console.error('Error refreshing guide:', err);
      }
    }
  };

  const handleCompleteGoal = (goalId) => {
    if (user?.id) {
      completeGoal(user.id, goalId);
    }
  };

  const handleAddObservation = async () => {
    if (newObservation.trim() && user?.id) {
      try {
        await addObservation(user.id, newObservation);
        setNewObservation('');
        setShowAddObservation(false);
      } catch (err) {
        console.error('Error adding observation:', err);
      }
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white items-center justify-center">
        <Loader size={48} className="text-red-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading study guide...</p>
      </div>
    );
  }

  // Show error state with option to create guide
  if (error || !studyGuide) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex-shrink-0 p-4 border-b bg-gradient-to-r from-red-50 to-pink-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <BookOpen className="mr-2 text-red-600" size={24} />
              Study Guide
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Study Guide Yet
            </h3>
            <p className="text-gray-600 mb-4">
              {conversationHistory.length > 0 
                ? "Generate your personalized study guide based on your conversations!"
                : "Start having conversations to generate your personalized study guide!"}
            </p>
            {conversationHistory.length > 0 && (
              <button
                onClick={handleRefreshGuide}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Generate Study Guide
              </button>
            )}
            {error && (
              <p className="text-sm text-red-600 mt-4">
                Note: {error}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Mobile-First Header */}
      <div className="flex-shrink-0 p-4 border-b bg-gradient-to-r from-red-50 to-pink-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <BookOpen className="mr-2 text-red-600" size={24} />
            <span className="hidden sm:inline">Study Guide</span>
            <span className="sm:hidden">Study</span>
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefreshGuide}
              disabled={loading}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-xs font-medium flex-shrink-0"
            >
              {loading ? '...' : 'Refresh'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors flex-shrink-0"
              title="Close"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
        {teacher && (
          <p className="text-xs text-gray-600 mt-2 ml-8">
            Teacher: {teacher.display_name || teacher.name}
          </p>
        )}
      </div>

      {/* Icon Navigation */}
      <div className="flex-shrink-0 flex border-b bg-white shadow-sm">
        {[
          { id: 'overview', icon: BarChart3, label: 'Overview', short: 'Over', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-600' },
          { id: 'goals', icon: Target, label: 'Goals', short: 'Goals', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-600' },
          { id: 'recommendations', icon: Lightbulb, label: 'Recs', short: 'Recs', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-600' },
          { id: 'materials', icon: LinkIcon, label: 'Materials', short: 'Mats', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-600' },
          { id: 'areasToImprove', icon: AlertTriangle, label: 'Improve', short: 'Impv', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-600' },
          { id: 'announcements', icon: Bell, label: 'News', short: 'News', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-600' },
          { id: 'observations', icon: FileText, label: 'Notes', short: 'Note', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-600' }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-2 py-3 flex flex-col items-center justify-center transition-all border-b-2 ${
                isActive
                  ? `${tab.color} ${tab.border} ${tab.bg}`
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={18} className="mb-1 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium leading-tight hidden sm:block">{tab.label}</span>
              <span className="text-[10px] font-medium leading-tight sm:hidden">{tab.short}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Progress Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <Brain size={24} className="text-blue-600" />
                  <span className="text-2xl font-bold text-blue-900">
                    {guide.progress?.vocabularyMastered || 0}
                  </span>
                </div>
                <p className="text-sm text-blue-700 font-medium">Words Mastered</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare size={24} className="text-green-600" />
                  <span className="text-2xl font-bold text-green-900">
                    {guide.conversationCount || 0}
                  </span>
                </div>
                <p className="text-sm text-green-700 font-medium">Conversations</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <Target size={24} className="text-purple-600" />
                  <span className="text-2xl font-bold text-purple-900">
                    {guide.progress?.grammarPointsCovered || 0}
                  </span>
                </div>
                <p className="text-sm text-purple-700 font-medium">Grammar Points</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp size={24} className="text-orange-600" />
                  <span className="text-2xl font-bold text-orange-900">
                    {guide.progress?.fluencyScore || 0}
                  </span>
                </div>
                <p className="text-sm text-orange-700 font-medium">Fluency Score</p>
              </div>
            </div>

            {/* Strengths */}
            {guide.analysis?.strengths?.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                  <Star className="mr-2" size={18} />
                  Your Strengths
                </h3>
                <ul className="space-y-2">
                  {guide.analysis.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start text-sm text-green-800">
                      <CheckCircle size={16} className="mr-2 flex-shrink-0 mt-0.5 text-green-600" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Common Mistakes */}
            {guide.analysis?.commonMistakes?.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h3 className="font-semibold text-yellow-900 mb-3 flex items-center">
                  <AlertCircle className="mr-2" size={18} />
                  Areas to Improve
                </h3>
                <ul className="space-y-2">
                  {guide.analysis.commonMistakes.map((mistake, idx) => (
                    <li key={idx} className="text-sm text-yellow-800">
                      <span className="line-through text-red-600">{mistake.incorrect}</span>
                      {' → '}
                      <span className="font-medium text-green-600">{mistake.correct}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Empty state for overview */}
            {(!guide.analysis?.strengths?.length && !guide.analysis?.commonMistakes?.length) && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                <Brain size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600 text-sm">
                  Keep practicing to unlock insights about your learning progress!
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">Weekly Goals</h3>
            {(guide.weeklyGoals?.length > 0) ? (
              guide.weeklyGoals.map((goal) => (
                <div
                  key={goal.id}
                  className={`border rounded-xl p-4 ${
                    goal.completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <button
                        onClick={() => !goal.completed && handleCompleteGoal(goal.id)}
                        disabled={goal.completed}
                        className="mr-3 mt-0.5"
                      >
                        {goal.completed ? (
                          <CheckCircle className="text-green-600" size={20} />
                        ) : (
                          <Circle className="text-gray-400 hover:text-red-600" size={20} />
                        )}
                      </button>
                      <div>
                        <h4 className={`font-medium ${
                          goal.completed ? 'text-green-900 line-through' : 'text-gray-900'
                        }`}>
                          {goal.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                        {goal.completedAt && (
                          <p className="text-xs text-green-600 mt-2">
                            Completed: {new Date(goal.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Target size={48} className="mx-auto mb-3 text-gray-300" />
                <p>No goals set yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            {(guide.recommendations?.length > 0) ? (
              guide.recommendations.map((rec, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-white">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        rec.priority === 'high'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {rec.category || 'General'}
                      </span>
                      <h4 className="font-semibold text-gray-900 mt-2">{rec.title}</h4>
                    </div>
                    <ChevronRight className="text-gray-400" size={20} />
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                  {rec.resources && (
                    <div className="flex flex-wrap gap-2">
                      {rec.resources.map((resource, ridx) => (
                        <span
                          key={ridx}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {resource}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Lightbulb size={48} className="mx-auto mb-3 text-gray-300" />
                <p>No recommendations yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'observations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Teacher Observations</h3>
              {!showAddObservation && (
                <button
                  onClick={() => setShowAddObservation(true)}
                  className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  <Plus size={16} className="mr-1" />
                  Add Note
                </button>
              )}
            </div>

            {showAddObservation && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                <textarea
                  value={newObservation}
                  onChange={(e) => setNewObservation(e.target.value)}
                  placeholder="Add an observation or note..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={() => {
                      setShowAddObservation(false);
                      setNewObservation('');
                    }}
                    className="px-3 py-1 text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddObservation}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {(guide.observations?.length > 0) ? (
              <div className="space-y-3">
                {guide.observations.map((obs) => (
                  <div key={obs.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-900">{obs.text}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>{obs.addedBy || 'Teacher'}</span>
                      <span>{new Date(obs.timestamp || obs.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No observations yet
              </p>
            )}
          </div>
        )}

        {/* Learning Materials Tab */}
        {activeTab === 'materials' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">Learning Materials</h3>
            <div className="text-center py-12 text-gray-500">
              <LinkIcon size={48} className="mx-auto mb-3 text-gray-300" />
              <p>No learning materials available yet</p>
            </div>
          </div>
        )}

        {/* Areas to Improve Tab */}
        {activeTab === 'areasToImprove' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">Areas to Improve</h3>
            <div className="text-center py-12 text-gray-500">
              <AlertTriangle size={48} className="mx-auto mb-3 text-gray-300" />
              <p>No areas to improve noted yet. Keep up the good work!</p>
            </div>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">Announcements</h3>
            <div className="text-center py-12 text-gray-500">
              <Bell size={48} className="mx-auto mb-3 text-gray-300" />
              <p>No announcements yet</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Last updated: {guide.lastUpdated ? new Date(guide.lastUpdated).toLocaleString() : 'Never'}
        </p>
      </div>
    </div>
  );
};

export default StudyGuidePanel;