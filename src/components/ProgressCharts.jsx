/**
 * Progress Charts Component
 * Displays progress data via charts for both students (their own) and teachers (overview)
 * Mobile-first responsive design using Recharts
 */

import { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import {
  TrendingUp, Users, BookOpen, MessageSquare,
  Calendar, Award, Target, ChevronDown, ChevronUp,
  RefreshCw, Download, Filter
} from 'lucide-react';

// Color palette
const COLORS = {
  primary: '#ef4444',    // Red
  secondary: '#f97316',  // Orange
  success: '#22c55e',    // Green
  info: '#3b82f6',       // Blue
  warning: '#eab308',    // Yellow
  purple: '#a855f7',     // Purple
  cyan: '#06b6d4',       // Cyan
  pink: '#ec4899'        // Pink
};

const CHART_COLORS = ['#ef4444', '#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-sm">
      <p className="font-medium text-gray-900 mb-1">{label}</p>
      {payload.map((item, index) => (
        <p key={index} className="text-gray-600" style={{ color: item.color }}>
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
};

// =============================================
// STUDENT PROGRESS CHART (For Student View)
// =============================================

export const StudentProgressChart = ({ 
  progressHistory = [], 
  currentStats = {},
  activityByDay = {},
  loading = false,
  onRefresh 
}) => {
  const [activeView, setActiveView] = useState('overview');
  const [timeRange, setTimeRange] = useState(30);

  // Process progress data for line chart
  const progressData = useMemo(() => {
    if (!progressHistory.length) {
      // Generate sample data if none exists
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          vocabulary: currentStats?.vocabulary_mastered || 0,
          fluency: currentStats?.fluency_score || 0
        };
      });
    }

    return progressHistory.map(record => ({
      date: new Date(record.recorded_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      vocabulary: record.vocabulary_count,
      fluency: record.fluency_score,
      conversations: record.conversation_count
    }));
  }, [progressHistory, currentStats]);

  // Activity data for bar chart
  const activityData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days.push({
        day: days[date.getDay()],
        sessions: activityByDay[dateStr] || 0
      });
    }
    
    return last7Days;
  }, [activityByDay]);

  // Stats cards data
  const statsCards = [
    {
      title: 'Vocabulary',
      value: currentStats?.vocabulary_mastered || 0,
      icon: BookOpen,
      color: 'text-red-600',
      bg: 'bg-red-50'
    },
    {
      title: 'Fluency',
      value: `${currentStats?.fluency_score || 0}%`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    {
      title: 'Sessions',
      value: currentStats?.conversation_count || 0,
      icon: MessageSquare,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={32} className="text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {statsCards.map((stat, index) => (
          <div 
            key={index}
            className={`${stat.bg} rounded-xl p-3 text-center`}
          >
            <stat.icon size={20} className={`${stat.color} mx-auto mb-1`} />
            <p className="text-lg font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-600">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* View Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        {['overview', 'progress', 'activity'].map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              activeView === view
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        {activeView === 'overview' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Learning Progress</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progressData}>
                  <defs>
                    <linearGradient id="colorVocab" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFluency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="vocabulary" 
                    stroke={COLORS.primary} 
                    fillOpacity={1} 
                    fill="url(#colorVocab)"
                    name="Vocabulary"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="fluency" 
                    stroke={COLORS.secondary} 
                    fillOpacity={1} 
                    fill="url(#colorFluency)"
                    name="Fluency"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeView === 'progress' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Skill Progress</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="vocabulary" 
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    dot={{ fill: COLORS.primary, r: 3 }}
                    name="Vocabulary"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="fluency" 
                    stroke={COLORS.secondary}
                    strokeWidth={2}
                    dot={{ fill: COLORS.secondary, r: 3 }}
                    name="Fluency"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeView === 'activity' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Weekly Activity</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="sessions" 
                    fill={COLORS.info}
                    radius={[4, 4, 0, 0]}
                    name="Sessions"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Refresh Button */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center space-x-2"
        >
          <RefreshCw size={14} />
          <span>Refresh Data</span>
        </button>
      )}
    </div>
  );
};

// =============================================
// TEACHER OVERVIEW CHARTS
// =============================================

export const TeacherOverviewCharts = ({
  students = [],
  studentComparison = [],
  aggregateStats = {},
  progressHistory = [],
  loading = false,
  onRefresh,
  onSelectStudent
}) => {
  const [activeChart, setActiveChart] = useState('comparison');
  const [expandedStudent, setExpandedStudent] = useState(null);

  // Stats overview cards
  const overviewCards = [
    {
      title: 'Total Students',
      value: aggregateStats.totalStudents || 0,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Active',
      value: aggregateStats.activeStudents || 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      title: 'Avg. Vocabulary',
      value: aggregateStats.averageVocabulary || 0,
      icon: BookOpen,
      color: 'text-red-600',
      bg: 'bg-red-50'
    },
    {
      title: 'Avg. Fluency',
      value: `${aggregateStats.averageFluency || 0}%`,
      icon: Award,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    }
  ];

  // Sort students by metric for comparison
  const sortedStudents = useMemo(() => {
    return [...studentComparison].sort((a, b) => b.vocabulary - a.vocabulary);
  }, [studentComparison]);

  // Distribution data for pie chart
  const distributionData = useMemo(() => {
    const beginner = studentComparison.filter(s => s.fluency < 30).length;
    const intermediate = studentComparison.filter(s => s.fluency >= 30 && s.fluency < 70).length;
    const advanced = studentComparison.filter(s => s.fluency >= 70).length;

    return [
      { name: 'Beginner', value: beginner, color: COLORS.warning },
      { name: 'Intermediate', value: intermediate, color: COLORS.info },
      { name: 'Advanced', value: advanced, color: COLORS.success }
    ].filter(d => d.value > 0);
  }, [studentComparison]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={32} className="text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Overview Cards */}
      <div className="grid grid-cols-2 gap-3">
        {overviewCards.map((stat, index) => (
          <div 
            key={index}
            className={`${stat.bg} rounded-xl p-3`}
          >
            <div className="flex items-center justify-between">
              <stat.icon size={20} className={stat.color} />
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <p className="text-xs text-gray-600 mt-1">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Chart Type Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {[
          { id: 'comparison', label: 'Compare' },
          { id: 'progress', label: 'Progress' },
          { id: 'distribution', label: 'Levels' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveChart(tab.id)}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              activeChart === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        {activeChart === 'comparison' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Student Comparison</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={sortedStudents.slice(0, 10)} 
                  layout="vertical"
                  margin={{ left: 60, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fontSize: 10 }} 
                    stroke="#9ca3af"
                    width={55}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="vocabulary" 
                    fill={COLORS.primary}
                    radius={[0, 4, 4, 0]}
                    name="Vocabulary"
                  />
                  <Bar 
                    dataKey="fluency" 
                    fill={COLORS.secondary}
                    radius={[0, 4, 4, 0]}
                    name="Fluency"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeChart === 'progress' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Class Progress Over Time</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aggregateProgressData(progressHistory)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="avgVocabulary" 
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    name="Avg Vocabulary"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgFluency" 
                    stroke={COLORS.secondary}
                    strokeWidth={2}
                    name="Avg Fluency"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeChart === 'distribution' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Student Level Distribution</h3>
            <div className="h-64 flex items-center justify-center">
              {distributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={{ stroke: '#9ca3af' }}
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-sm">No student data available</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Student Quick List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-3 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900 text-sm">Students by Progress</h3>
        </div>
        <div className="divide-y max-h-64 overflow-y-auto">
          {sortedStudents.map((student, index) => (
            <div 
              key={student.id}
              onClick={() => onSelectStudent?.(student)}
              className="p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                  index < 3 ? 'bg-green-500' : index < 7 ? 'bg-blue-500' : 'bg-gray-400'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{student.name}</p>
                  <p className="text-xs text-gray-500">{student.conversations} sessions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{student.vocabulary} words</p>
                <p className="text-xs text-gray-500">{student.fluency}% fluency</p>
              </div>
            </div>
          ))}
          {sortedStudents.length === 0 && (
            <div className="p-6 text-center text-gray-500 text-sm">
              No students assigned yet
            </div>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center space-x-2"
        >
          <RefreshCw size={14} />
          <span>Refresh Data</span>
        </button>
      )}
    </div>
  );
};

// =============================================
// GROUP STATS CHART
// =============================================

export const GroupStatsChart = ({
  groups = [],
  onSelectGroup,
  loading = false
}) => {
  const groupData = groups.map(group => ({
    name: group.name,
    students: group.students?.length || 0,
    avgVocabulary: group.stats?.averageVocabulary || 0,
    avgFluency: group.stats?.averageFluency || 0
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw size={24} className="text-gray-400 animate-spin" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        <Users size={32} className="mx-auto mb-2 text-gray-300" />
        <p>No groups created yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Group Performance</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={groupData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="avgVocabulary" 
              fill={COLORS.primary}
              radius={[4, 4, 0, 0]}
              name="Avg Vocabulary"
            />
            <Bar 
              dataKey="avgFluency" 
              fill={COLORS.info}
              radius={[4, 4, 0, 0]}
              name="Avg Fluency"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Helper function to aggregate progress history by date
function aggregateProgressData(progressHistory) {
  if (!progressHistory?.length) {
    // Return sample data
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        avgVocabulary: 0,
        avgFluency: 0
      };
    });
  }

  // Group by date and calculate averages
  const byDate = {};
  progressHistory.forEach(record => {
    const dateKey = new Date(record.recorded_at).toISOString().split('T')[0];
    if (!byDate[dateKey]) {
      byDate[dateKey] = { vocab: [], fluency: [] };
    }
    byDate[dateKey].vocab.push(record.vocabulary_count || 0);
    byDate[dateKey].fluency.push(record.fluency_score || 0);
  });

  return Object.entries(byDate)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14) // Last 14 days
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      avgVocabulary: Math.round(data.vocab.reduce((a, b) => a + b, 0) / data.vocab.length),
      avgFluency: Math.round(data.fluency.reduce((a, b) => a + b, 0) / data.fluency.length)
    }));
}

export default {
  StudentProgressChart,
  TeacherOverviewCharts,
  GroupStatsChart
};