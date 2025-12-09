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
  Link as LinkIcon, AlertTriangle, Bell
} from 'lucide-react';

export const StudyGuidePanel = ({ conversationHistory, onClose }) => {
  const { user, hasPermission, getTeacher } = useAuth();
  const { getStudyGuide, generateStudyGuide, completeGoal, addObservation, loading } = useStudyGuide();
  const [guide, setGuide] = useState(null);
  const [showAddObservation, setShowAddObservation] = useState(false);
  const [newObservation, setNewObservation] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Get the user ID to display (student's own or teacher viewing student)
  const userId = user.id;
  const teacher = user.role === 'student' ? getTeacher(user.teacherId) : null;

  useEffect(() => {
    loadGuide();
  }, [userId]);

  const loadGuide = async () => {
    const existing = getStudyGuide(userId);
    if (existing) {
      setGuide(existing);
    } else if (conversationHistory.length > 0) {
      // Generate new guide if conversations exist
      const newGuide = await generateStudyGuide(userId, conversationHistory);
      setGuide(newGuide);
    }
  };

  const handleRefreshGuide = async () => {
    if (conversationHistory.length > 0) {
      const updated = await generateStudyGuide(userId, conversationHistory);
      setGuide(updated);
    }
  };

  const handleCompleteGoal = (goalId) => {
    completeGoal(userId, goalId);
    loadGuide();
  };

  const handleAddObservation = () => {
    if (newObservation.trim()) {
      addObservation(userId, newObservation);
      setNewObservation('');
      setShowAddObservation(false);
      loadGuide();
    }
  };

  if (!guide) {
    return (
      <div className="p-6 text-center">
        <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Study Guide Yet
        </h3>
        <p className="text-gray-600 mb-4">
          Start having conversations to generate your personalized study guide!
        </p>
        {conversationHistory.length > 0 && (
          <button
            onClick={handleRefreshGuide}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Study Guide'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <BookOpen className="mr-2 text-red-600" size={28} />
              Study Guide
            </h2>
            {teacher && (
              <p className="text-sm text-gray-600 mt-1">
                Teacher: {teacher.name}
              </p>
            )}
          </div>
          <button
            onClick={handleRefreshGuide}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
          >
            {loading ? 'Updating...' : 'Refresh'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
          {['overview', 'goals', 'recommendations', 'materials', 'areasToImprove', 'announcements', 'observations'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'areasToImprove' ? 'Improve' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Progress Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <Brain size={24} className="text-blue-600" />
                  <span className="text-2xl font-bold text-blue-900">
                    {guide.progress.vocabularyMastered}
                  </span>
                </div>
                <p className="text-sm text-blue-700 font-medium">Words Mastered</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare size={24} className="text-green-600" />
                  <span className="text-2xl font-bold text-green-900">
                    {guide.conversationCount}
                  </span>
                </div>
                <p className="text-sm text-green-700 font-medium">Conversations</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <Target size={24} className="text-purple-600" />
                  <span className="text-2xl font-bold text-purple-900">
                    {guide.progress.grammarPointsCovered}
                  </span>
                </div>
                <p className="text-sm text-purple-700 font-medium">Grammar Points</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp size={24} className="text-orange-600" />
                  <span className="text-2xl font-bold text-orange-900">
                    {guide.progress.fluencyScore}
                  </span>
                </div>
                <p className="text-sm text-orange-700 font-medium">Fluency Score</p>
              </div>
            </div>

            {/* Strengths */}
            {guide.analysis.strengths?.length > 0 && (
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
            {guide.analysis.commonMistakes?.length > 0 && (
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
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">Weekly Goals</h3>
            {guide.weeklyGoals.map((goal) => (
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
            ))}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            {guide.recommendations.map((rec, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-white">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      rec.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {rec.category}
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
            ))}
          </div>
        )}

        {activeTab === 'observations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Teacher Observations</h3>
              {hasPermission('canManageStudyGuides') && !showAddObservation && (
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
                  placeholder="Add an observation or note about the student's progress..."
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

            {guide.observations && guide.observations.length > 0 ? (
              <div className="space-y-3">
                {guide.observations.map((obs) => (
                  <div key={obs.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-900">{obs.text}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>{obs.addedBy}</span>
                      <span>{new Date(obs.timestamp).toLocaleDateString()}</span>
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
            {(() => {
              const allMaterials = JSON.parse(localStorage.getItem('learningMaterials') || '{}');
              const teacherMaterials = teacher ? allMaterials[teacher.id] || [] : [];
              const availableMaterials = teacherMaterials.filter(
                m => m.global || m.studentIds.includes(user.id)
              );

              return availableMaterials.length > 0 ? (
                <div className="space-y-3">
                  {availableMaterials.map((material) => (
                    <div key={material.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        <LinkIcon size={16} className="mr-2 text-blue-600" />
                        {material.title}
                      </h4>
                      <a
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                      >
                        Open Material →
                      </a>
                      {material.description && (
                        <p className="text-sm text-gray-600 mt-2">{material.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Added {new Date(material.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-12">
                  No learning materials available yet
                </p>
              );
            })()}
          </div>
        )}

        {/* Areas to Improve Tab */}
        {activeTab === 'areasToImprove' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">Areas to Improve</h3>
            {(() => {
              const improvements = JSON.parse(localStorage.getItem('areasToImprove') || '{}')[user.id] || [];

              return improvements.length > 0 ? (
                <div className="space-y-3">
                  {improvements.map((improvement) => (
                    <div key={improvement.id} className="border rounded-lg p-4 bg-orange-50">
                      <h4 className="font-semibold text-orange-900 flex items-center mb-2">
                        <AlertTriangle size={18} className="mr-2" />
                        {improvement.area}
                      </h4>
                      {improvement.details && (
                        <div className="mb-2">
                          <p className="text-sm font-medium text-gray-700">What to work on:</p>
                          <p className="text-sm text-gray-600">{improvement.details}</p>
                        </div>
                      )}
                      {improvement.suggestions && (
                        <div className="mb-2">
                          <p className="text-sm font-medium text-gray-700">How to improve:</p>
                          <p className="text-sm text-gray-600">{improvement.suggestions}</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-3">
                        From {improvement.createdBy} • {new Date(improvement.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-12">
                  No areas to improve noted yet. Keep up the good work!
                </p>
              );
            })()}
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">Announcements</h3>
            {(() => {
              const allAnnouncements = JSON.parse(localStorage.getItem('announcements') || '{}');
              const teacherAnnouncements = teacher ? allAnnouncements[teacher.id] || [] : [];
              const globalAnnouncements = teacherAnnouncements.filter(a => a.global);

              return globalAnnouncements.length > 0 ? (
                <div className="space-y-3">
                  {globalAnnouncements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((announcement) => (
                    <div key={announcement.id} className={`border rounded-lg p-4 ${
                      announcement.priority === 'urgent' ? 'bg-red-50 border-red-200' :
                      announcement.priority === 'important' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-white'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 flex items-center">
                          <Bell size={16} className={`mr-2 ${
                            announcement.priority === 'urgent' ? 'text-red-600' :
                            announcement.priority === 'important' ? 'text-yellow-600' :
                            'text-blue-600'
                          }`} />
                          {announcement.title}
                        </h4>
                        {announcement.priority !== 'normal' && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            announcement.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {announcement.priority}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{announcement.message}</p>
                      <p className="text-xs text-gray-500 mt-3">
                        {new Date(announcement.createdAt).toLocaleDateString()} • {announcement.createdBy}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-12">
                  No announcements yet
                </p>
              );
            })()}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Last updated: {new Date(guide.lastUpdated).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default StudyGuidePanel;