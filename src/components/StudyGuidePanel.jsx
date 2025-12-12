/**
 * Study Guide Component - V11
 * Displays personalized study recommendations, progress, and teacher feedback
 * Now includes progress charts for students
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStudyGuide } from '../contexts/StudyGuideContext';
import {
  BookOpen, Target, TrendingUp, Award, CheckCircle, Circle,
  Brain, MessageSquare, Star, AlertCircle, ChevronRight, Plus,
  Link as LinkIcon, AlertTriangle, Bell, BarChart3, Lightbulb, FileText, X, Loader, RefreshCw
} from 'lucide-react';
import { StudentProgressChart } from './ProgressCharts';
import { supabase } from '../services/supabase';

export const StudyGuidePanel = ({ conversationHistory = [], onClose }) => {
  const { user, profile, isStudent, getTeacher } = useAuth();
  const { studyGuide, loading, error, generateStudyGuide, completeGoal, addObservation, refresh } = useStudyGuide();
  const [showAddObservation, setShowAddObservation] = useState(false);
  const [newObservation, setNewObservation] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Chart data state
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);

  // Get teacher info
  const teacher = isStudent() ? getTeacher(profile?.teacher_id) : null;

  // Load chart data when charts tab is active
  useEffect(() => {
    const loadChartData = async () => {
      if (activeTab === 'charts' && user?.id) {
        setChartLoading(true);
        try {
          // Get progress history
          const { data: progressHistory } = await supabase
            .from('progress_history')
            .select('*')
            .eq('student_id', user.id)
            .gte('recorded_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .order('recorded_at', { ascending: true });

          // Get conversations for activity chart
          const { data: conversations } = await supabase
            .from('conversations')
            .select('id, created_at')
            .eq('user_id', user.id)
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

          // Group conversations by day
          const activityByDay = {};
          (conversations || []).forEach(conv => {
            const day = new Date(conv.created_at).toISOString().split('T')[0];
            activityByDay[day] = (activityByDay[day] || 0) + 1;
          });

          setChartData({
            progressHistory: progressHistory || [],
            currentStats: {
              vocabulary_mastered: studyGuide?.vocabulary_mastered || studyGuide?.progress?.vocabularyMastered || 0,
              fluency_score: studyGuide?.fluency_score || studyGuide?.progress?.fluencyScore || 0,
              conversation_count: studyGuide?.conversation_count || studyGuide?.conversationCount || 0
            },
            activityByDay
          });
        } catch (err) {
          console.error('Error loading chart data:', err);
        } finally {
          setChartLoading(false);
        }
      }
    };

    loadChartData();
  }, [activeTab, user?.id, studyGuide]);

  // Create a safe guide object with defaults
  const guide = studyGuide || {
    conversationCount: 0,
    progress: { vocabularyMastered: 0, grammarPointsCovered: 0, fluencyScore: 0 },
    analysis: { strengths: [], commonMistakes: [] },
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

  // Tab configuration
  const tabs = [
    { id: 'overview', icon: BookOpen, label: 'Overview', color: 'text-red-600' },
    { id: 'charts', icon: BarChart3, label: 'Progress', color: 'text-green-600' },
    { id: 'goals', icon: Target, label: 'Goals', color: 'text-blue-600' },
    { id: 'recommendations', icon: Lightbulb, label: 'Tips', color: 'text-yellow-600' },
    { id: 'materials', icon: LinkIcon, label: 'Materials', color: 'text-teal-600' },
    { id: 'announcements', icon: Bell, label: 'News', color: 'text-purple-600' },
    { id: 'notes', icon: FileText, label: 'Notes', color: 'text-gray-600' }
  ];

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white items-center justify-center">
        <Loader size={48} className="text-red-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading study guide...</p>
      </div>
    );
  }

  // Error/Empty state
  if (error || !studyGuide) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex-shrink-0 p-4 border-b bg-gradient-to-r from-red-50 to-pink-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <BookOpen className="mr-2 text-red-600" size={24} />
              Study Guide
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg">
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Study Guide Yet</h3>
            <p className="text-gray-600 mb-4">
              {conversationHistory.length > 0 
                ? "Generate your personalized study guide!"
                : "Start conversations to generate your guide!"}
            </p>
            {conversationHistory.length > 0 && (
              <button
                onClick={handleRefreshGuide}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Generate Study Guide
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-gradient-to-r from-red-50 to-pink-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <BookOpen className="mr-2 text-red-600" size={24} />
            Study Guide
          </h2>
          <div className="flex items-center space-x-2">
            <button onClick={refresh} className="p-2 hover:bg-white/50 rounded-lg" title="Refresh">
              <RefreshCw size={18} className="text-gray-600" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg">
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {teacher && (
          <div className="text-sm text-gray-600 mb-3">
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
              Teacher: {teacher.display_name || teacher.email?.split('@')[0]}
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 overflow-x-auto pb-1 -mx-1 px-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center px-2.5 py-1.5 rounded-lg min-w-[52px] ${
                activeTab === tab.id ? 'bg-white shadow-sm' : 'hover:bg-white/50'
              }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? tab.color : 'text-gray-400'} />
              <span className={`text-[10px] mt-0.5 font-medium ${
                activeTab === tab.id ? 'text-gray-900' : 'text-gray-500'
              }`}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <Brain size={20} className="text-red-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-gray-900">
                  {guide.progress?.vocabularyMastered || guide.vocabulary_mastered || 0}
                </p>
                <p className="text-xs text-gray-600">Words</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-3 text-center">
                <TrendingUp size={20} className="text-orange-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-gray-900">
                  {guide.progress?.fluencyScore || guide.fluency_score || 0}%
                </p>
                <p className="text-xs text-gray-600">Fluency</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <MessageSquare size={20} className="text-blue-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-gray-900">
                  {guide.conversationCount || guide.conversation_count || 0}
                </p>
                <p className="text-xs text-gray-600">Sessions</p>
              </div>
            </div>

            {(guide.analysis?.strengths || guide.strengths || []).length > 0 && (
              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                  <Star size={16} className="mr-1" /> Your Strengths
                </h3>
                <div className="space-y-1">
                  {(guide.analysis?.strengths || guide.strengths || []).map((s, i) => (
                    <p key={i} className="text-sm text-green-700 flex items-center">
                      <CheckCircle size={14} className="mr-2" />{s}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {(guide.analysis?.commonMistakes || guide.weaknesses || []).length > 0 && (
              <div className="bg-orange-50 rounded-xl p-4">
                <h3 className="font-semibold text-orange-800 mb-2 flex items-center">
                  <AlertCircle size={16} className="mr-1" /> Areas to Work On
                </h3>
                <div className="space-y-1">
                  {(guide.analysis?.commonMistakes || guide.weaknesses || []).map((a, i) => (
                    <p key={i} className="text-sm text-orange-700 flex items-center">
                      <AlertTriangle size={14} className="mr-2" />{a}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Charts Tab */}
        {activeTab === 'charts' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Your Progress</h3>
            {chartLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader size={32} className="text-gray-400 animate-spin" />
              </div>
            ) : chartData ? (
              <StudentProgressChart
                progressHistory={chartData.progressHistory}
                currentStats={chartData.currentStats}
                activityByDay={chartData.activityByDay}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Start practicing to see your progress!</p>
              </div>
            )}
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 mb-2">Weekly Goals</h3>
            {(guide.weeklyGoals || guide.goals || []).length > 0 ? (
              (guide.weeklyGoals || guide.goals || []).map((goal, idx) => (
                <div key={goal.id || idx} className={`p-3 rounded-xl border ${
                  goal.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-start">
                    <button
                      onClick={() => !goal.completed && handleCompleteGoal(goal.id)}
                      className="mt-0.5 mr-3"
                      disabled={goal.completed}
                    >
                      {goal.completed ? (
                        <CheckCircle size={20} className="text-green-600" />
                      ) : (
                        <Circle size={20} className="text-gray-400 hover:text-blue-600" />
                      )}
                    </button>
                    <div>
                      <p className={goal.completed ? 'text-green-800 line-through' : 'text-gray-900'}>
                        {goal.title}
                      </p>
                      {goal.description && <p className="text-sm text-gray-600 mt-1">{goal.description}</p>}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No goals set yet</p>
              </div>
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 mb-2">Study Recommendations</h3>
            {(guide.recommendations || []).length > 0 ? (
              guide.recommendations.map((rec, idx) => (
                <div key={idx} className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                  <div className="flex items-start">
                    <Lightbulb size={18} className="text-yellow-600 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{rec.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Lightbulb size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Recommendations will appear as you practice</p>
              </div>
            )}
          </div>
        )}

        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 mb-2">Learning Materials</h3>
            {(guide.materials || []).length > 0 ? (
              guide.materials.map((m, idx) => (
                <a key={idx} href={m.url} target="_blank" rel="noopener noreferrer"
                   className="block bg-white rounded-xl p-4 border hover:shadow-md">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                      <LinkIcon size={20} className="text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{m.title}</p>
                      {m.description && <p className="text-sm text-gray-600 truncate">{m.description}</p>}
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </div>
                </a>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <LinkIcon size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No materials assigned yet</p>
              </div>
            )}
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 mb-2">Announcements</h3>
            {(guide.announcements || []).length > 0 ? (
              guide.announcements.map((a, idx) => (
                <div key={idx} className={`rounded-xl p-4 border ${
                  a.priority === 'urgent' ? 'bg-red-50 border-red-200' :
                  a.priority === 'important' ? 'bg-orange-50 border-orange-200' :
                  'bg-purple-50 border-purple-200'
                }`}>
                  <div className="flex items-start">
                    <Bell size={18} className={`mr-2 mt-0.5 ${
                      a.priority === 'urgent' ? 'text-red-600' :
                      a.priority === 'important' ? 'text-orange-600' : 'text-purple-600'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">{a.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{a.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(a.created_at || a.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No announcements</p>
              </div>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 mb-2">Teacher Notes</h3>
            {(guide.observations || []).length > 0 ? (
              guide.observations.map((obs, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-4 border">
                  <p className="text-gray-900">{obs.text}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(obs.created_at || obs.timestamp).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No notes yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Update Button */}
      {conversationHistory.length > 0 && (
        <div className="flex-shrink-0 p-4 border-t bg-gray-50">
          <button
            onClick={handleRefreshGuide}
            className="w-full py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 flex items-center justify-center"
          >
            <RefreshCw size={18} className="mr-2" />
            Update Study Guide
          </button>
        </div>
      )}
    </div>
  );
};

export default StudyGuidePanel;