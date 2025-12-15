/**
 * Study Guide Panel Component - V14
 * UPDATES:
 * - Responsive icons matching TeacherDashboard style
 * - Larger touch targets (60px+)
 * - Better mobile layout
 * - Fixed icon sizing
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStudyGuide } from '../contexts/StudyGuideContext';
import { supabase } from '../services/supabase';
import {
  BookOpen, Target, Lightbulb, Star, CheckCircle, Circle,
  TrendingUp, MessageSquare, RefreshCw, X, Brain, Calendar,
  Link as LinkIcon, Bell, ChevronRight, AlertTriangle,
  FileText, BarChart3, Award
} from 'lucide-react';

export const StudyGuidePanel = ({ onClose, conversationHistory = [] }) => {
  const { user, profile } = useAuth();
  const { studyGuide, teacher, loading, refresh, generateStudyGuide, completeGoal } = useStudyGuide();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);

  // Load chart data when Progress tab is active
  useEffect(() => {
    const loadChartData = async () => {
      if (activeTab === 'charts' && user?.id) {
        setChartLoading(true);
        try {
          // Get conversation history for chart
          const { data: conversations } = await supabase
            .from('conversations')
            .select('created_at, messages')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })
            .limit(30);

          // Process data for chart
          const activityByDay = {};
          (conversations || []).forEach(conv => {
            const date = new Date(conv.created_at).toLocaleDateString('en-US', { weekday: 'short' });
            activityByDay[date] = (activityByDay[date] || 0) + 1;
          });

          setChartData({
            progress: {
              vocabulary: studyGuide?.vocabulary_mastered || studyGuide?.progress?.vocabularyMastered || 0,
              fluency: studyGuide?.fluency_score || studyGuide?.progress?.fluencyScore || 0,
              sessions: studyGuide?.conversation_count || studyGuide?.conversationCount || 0
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
    materials: [],
    announcements: [],
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

  // Tab configuration - matching TeacherDashboard style
  const tabs = [
    { id: 'overview', icon: BookOpen, label: 'Overview', shortLabel: 'Over', color: 'text-red-600', bg: 'bg-red-100' },
    { id: 'charts', icon: BarChart3, label: 'Progress', shortLabel: 'Prog', color: 'text-blue-600', bg: 'bg-blue-100' },
    { id: 'goals', icon: Target, label: 'Goals', shortLabel: 'Goals', color: 'text-green-600', bg: 'bg-green-100' },
    { id: 'recommendations', icon: Lightbulb, label: 'Tips', shortLabel: 'Tips', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { id: 'materials', icon: LinkIcon, label: 'Materials', shortLabel: 'Mats', color: 'text-purple-600', bg: 'bg-purple-100' },
    { id: 'announcements', icon: Bell, label: 'News', shortLabel: 'News', color: 'text-orange-600', bg: 'bg-orange-100' },
    { id: 'notes', icon: FileText, label: 'Notes', shortLabel: 'Notes', color: 'text-indigo-600', bg: 'bg-indigo-100' },
  ];

  if (loading) {
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
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw size={32} className="text-red-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!studyGuide) {
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
          <div className="text-center max-w-sm">
            <BookOpen size={64} className="text-gray-300 mx-auto mb-4" />
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
      <div className="flex-shrink-0 p-4 border-b bg-gradient-to-r from-red-600 to-pink-600">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white flex items-center">
            <BookOpen className="mr-2" size={24} />
            Study Guide
          </h2>
          <div className="flex items-center space-x-2">
            <button onClick={refresh} className="p-2 hover:bg-white/20 rounded-lg" title="Refresh">
              <RefreshCw size={18} className="text-white" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        {teacher && (
          <div className="text-sm text-white/90 mb-3">
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
              Teacher: {teacher.display_name || teacher.email?.split('@')[0]}
            </span>
          </div>
        )}

        {/* Tabs - Responsive with larger icons */}
        <div className="flex justify-between bg-white/10 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-lg transition-all min-h-[60px] ${
                activeTab === tab.id 
                  ? 'bg-white shadow-sm' 
                  : 'hover:bg-white/20'
              }`}
            >
              <tab.icon 
                size={22} 
                className={activeTab === tab.id ? tab.color : 'text-white/80'} 
              />
              <span className={`text-[10px] sm:text-xs mt-1 font-medium truncate max-w-full ${
                activeTab === tab.id ? 'text-gray-900' : 'text-white/80'
              }`}>
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <Brain size={24} className="text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {guide.progress?.vocabularyMastered || guide.vocabulary_mastered || 0}
                </p>
                <p className="text-xs text-gray-600">Words</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <TrendingUp size={24} className="text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {guide.progress?.fluencyScore || guide.fluency_score || 0}%
                </p>
                <p className="text-xs text-gray-600">Fluency</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <MessageSquare size={24} className="text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {guide.conversationCount || guide.conversation_count || 0}
                </p>
                <p className="text-xs text-gray-600">Sessions</p>
              </div>
            </div>

            {/* Strengths */}
            {(guide.analysis?.strengths || guide.strengths || []).length > 0 && (
              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                  <Star size={18} className="mr-2" /> Your Strengths
                </h3>
                <div className="space-y-2">
                  {(guide.analysis?.strengths || guide.strengths || []).map((s, i) => (
                    <p key={i} className="text-sm text-green-700 flex items-center">
                      <CheckCircle size={14} className="mr-2 flex-shrink-0" />
                      {s}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Areas to Improve */}
            {(guide.analysis?.commonMistakes || guide.areasToImprove || []).length > 0 && (
              <div className="bg-orange-50 rounded-xl p-4">
                <h3 className="font-semibold text-orange-800 mb-2 flex items-center">
                  <AlertTriangle size={18} className="mr-2" /> Areas to Focus
                </h3>
                <div className="space-y-2">
                  {(guide.analysis?.commonMistakes || guide.areasToImprove || []).map((m, i) => (
                    <p key={i} className="text-sm text-orange-700 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-orange-400 mr-2 flex-shrink-0" />
                      {m}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Last Updated */}
            <div className="text-center text-xs text-gray-400">
              Last updated: {new Date(guide.lastUpdated || guide.updated_at).toLocaleString()}
            </div>
          </div>
        )}

        {/* Progress/Charts Tab */}
        {activeTab === 'charts' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-2">Your Progress</h3>
            
            {chartLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw size={24} className="text-blue-600 animate-spin" />
              </div>
            ) : chartData ? (
              <>
                {/* Progress Bars */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Vocabulary</span>
                      <span className="font-medium">{chartData.progress.vocabulary} words</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all"
                        style={{ width: `${Math.min((chartData.progress.vocabulary / 500) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Fluency</span>
                      <span className="font-medium">{chartData.progress.fluency}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all"
                        style={{ width: `${chartData.progress.fluency}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Practice Sessions</span>
                      <span className="font-medium">{chartData.progress.sessions}</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                        style={{ width: `${Math.min((chartData.progress.sessions / 50) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Activity Chart */}
                <div className="bg-gray-50 rounded-xl p-4 mt-4">
                  <h4 className="font-medium text-gray-700 mb-3">Weekly Activity</h4>
                  <div className="flex items-end justify-between h-24 space-x-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => {
                      const count = chartData.activityByDay[day] || 0;
                      const height = count > 0 ? Math.max(20, (count / 5) * 100) : 8;
                      return (
                        <div key={day} className="flex-1 flex flex-col items-center">
                          <div 
                            className={`w-full rounded-t transition-all ${count > 0 ? 'bg-blue-500' : 'bg-gray-300'}`}
                            style={{ height: `${height}%` }}
                          />
                          <span className="text-[10px] text-gray-500 mt-1">{day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No progress data yet</p>
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
                <div key={goal.id || idx} className={`rounded-xl p-4 border ${
                  goal.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => handleCompleteGoal(goal.id || idx)}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {goal.completed ? (
                        <CheckCircle size={22} className="text-green-600" />
                      ) : (
                        <Circle size={22} className="text-gray-400 hover:text-blue-600" />
                      )}
                    </button>
                    <div className="flex-1">
                      <p className={`font-medium ${goal.completed ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                        {goal.title}
                      </p>
                      {goal.description && (
                        <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                      )}
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
                    <Lightbulb size={20} className="text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
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
                <a 
                  key={idx} 
                  href={m.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block bg-white rounded-xl p-4 border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <LinkIcon size={24} className="text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{m.title}</p>
                      {m.description && (
                        <p className="text-sm text-gray-600 truncate">{m.description}</p>
                      )}
                    </div>
                    <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
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
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-start">
                    <Bell size={20} className={`mr-3 mt-0.5 flex-shrink-0 ${
                      a.priority === 'urgent' ? 'text-red-600' :
                      a.priority === 'important' ? 'text-orange-600' :
                      'text-blue-600'
                    }`} />
                    <div className="flex-1">
                      <p className="text-gray-900">{a.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(a.created_at).toLocaleDateString()}
                        {a.teacher?.display_name && ` • ${a.teacher.display_name}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No announcements yet</p>
              </div>
            )}
          </div>
        )}

        {/* Notes Tab (Teacher Observations) */}
        {activeTab === 'notes' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 mb-2">Teacher Notes</h3>
            {(guide.observations || []).length > 0 ? (
              guide.observations.map((obs, idx) => (
                <div key={idx} className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                  <div className="flex items-start">
                    <FileText size={20} className="text-indigo-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-gray-900">{obs.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(obs.created_at).toLocaleDateString()}
                        {obs.teacher?.display_name && ` • ${obs.teacher.display_name}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No teacher notes yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyGuidePanel;
