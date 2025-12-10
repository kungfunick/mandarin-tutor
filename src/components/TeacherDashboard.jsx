/**
 * Teacher Dashboard Component - Mobile-First Design
 * Clean icon-based navigation
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStudyGuide } from '../contexts/StudyGuideContext';
import {
  Users, User, BookOpen, Bell, FileText,
  ChevronRight, Plus, Trash2, Send, X, Link as LinkIcon,
  AlertTriangle, Globe, ChevronLeft
} from 'lucide-react';

export const TeacherDashboard = ({ onClose }) => {
  const { user, getStudents } = useAuth();
  const { getAllStudyGuides, addObservation } = useStudyGuide();
  const [activeTab, setActiveTab] = useState('students');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [studyGuides, setStudyGuides] = useState({});

  // Forms
  const [showObservationForm, setShowObservationForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showImprovementForm, setShowImprovementForm] = useState(false);
  const [selectedStudentForImprovement, setSelectedStudentForImprovement] = useState(null);

  const [newObservation, setNewObservation] = useState('');
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    priority: 'normal',
    global: true
  });
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    url: '',
    description: '',
    studentIds: [],
    global: true
  });
  const [newImprovement, setNewImprovement] = useState({
    area: '',
    details: '',
    suggestions: ''
  });

  useEffect(() => {
    loadStudents();
  }, [user]);

  const loadStudents = () => {
    const myStudents = getStudents(user.id);
    setStudents(myStudents);

    const guides = getAllStudyGuides();
    setStudyGuides(guides);
  };

  const handleAddObservation = () => {
    if (selectedStudent && newObservation.trim()) {
      addObservation(selectedStudent.id, newObservation);
      setNewObservation('');
      setShowObservationForm(false);
      loadStudents();
    }
  };

  const handleAddAnnouncement = () => {
    if (newAnnouncement.title.trim() && newAnnouncement.message.trim()) {
      const announcements = JSON.parse(localStorage.getItem('announcements') || '{}');
      if (!announcements[user.id]) {
        announcements[user.id] = [];
      }

      announcements[user.id].push({
        id: Date.now().toString(),
        ...newAnnouncement,
        createdAt: new Date().toISOString(),
        createdBy: user.name,
        read: false
      });

      localStorage.setItem('announcements', JSON.stringify(announcements));

      setNewAnnouncement({
        title: '',
        message: '',
        priority: 'normal',
        global: true
      });
      setShowAnnouncementForm(false);
    }
  };

  const handleAddMaterial = () => {
    if (newMaterial.title.trim() && newMaterial.url.trim()) {
      const materials = JSON.parse(localStorage.getItem('learningMaterials') || '{}');
      if (!materials[user.id]) {
        materials[user.id] = [];
      }

      materials[user.id].push({
        id: Date.now().toString(),
        ...newMaterial,
        createdAt: new Date().toISOString(),
        createdBy: user.name
      });

      localStorage.setItem('learningMaterials', JSON.stringify(materials));

      setNewMaterial({
        title: '',
        url: '',
        description: '',
        studentIds: [],
        global: true
      });
      setShowMaterialForm(false);
    }
  };

  const handleAddImprovement = () => {
    if (selectedStudentForImprovement && newImprovement.area.trim()) {
      const improvements = JSON.parse(localStorage.getItem('areasToImprove') || '{}');
      if (!improvements[selectedStudentForImprovement.id]) {
        improvements[selectedStudentForImprovement.id] = [];
      }

      improvements[selectedStudentForImprovement.id].push({
        id: Date.now().toString(),
        ...newImprovement,
        createdAt: new Date().toISOString(),
        createdBy: user.name
      });

      localStorage.setItem('areasToImprove', JSON.stringify(improvements));

      setNewImprovement({
        area: '',
        details: '',
        suggestions: ''
      });
      setSelectedStudentForImprovement(null);
      setShowImprovementForm(false);
    }
  };

  const getStudentProgress = (studentId) => {
    const guide = studyGuides[studentId];
    if (!guide) return null;

    return {
      vocabulary: guide.progress?.vocabularyMastered || 0,
      conversations: guide.conversationCount || 0,
      fluencyScore: guide.progress?.fluencyScore || 0
    };
  };

  // Tab configuration with icons
  const tabs = [
    { id: 'students', icon: Users, label: 'Students', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-600' },
    { id: 'observations', icon: FileText, label: 'Notes', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-600' },
    { id: 'areasToImprove', icon: AlertTriangle, label: 'Improve', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-600' },
    { id: 'materials', icon: LinkIcon, label: 'Materials', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-600' },
    { id: 'announcements', icon: Bell, label: 'Announce', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-600' },
    { id: 'lessonPlans', icon: BookOpen, label: 'Lessons', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-600' }
  ];

  const activeTabConfig = tabs.find(t => t.id === activeTab);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Mobile-First Header */}
      <div className="flex-shrink-0 p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <Users className="mr-2 text-blue-600" size={24} />
            <span className="hidden sm:inline">Teacher Dashboard</span>
            <span className="sm:hidden">Dashboard</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors flex-shrink-0"
            title="Close"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Icon Navigation - Mobile Optimized - NO SCROLLBAR */}
      <div className="flex-shrink-0 flex border-b bg-white shadow-sm">
        {tabs.map((tab) => {
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
              <span className="text-[10px] sm:text-xs font-medium leading-tight">{tab.label}</span>
              {tab.id === 'students' && students.length > 0 && (
                <span className={`text-[9px] mt-0.5 ${isActive ? tab.color : 'text-gray-400'}`}>
                  ({students.length})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="p-4">
            <div className="space-y-3">
              {students.map((student) => {
                const progress = getStudentProgress(student.id);

                return (
                  <div
                    key={student.id}
                    className="border rounded-xl p-4 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer bg-white"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User size={20} className="text-blue-600" />
                        </div>
                        <div className="ml-3 min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">{student.name}</h3>
                          <p className="text-xs text-gray-500 truncate">{student.email}</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-gray-400 flex-shrink-0 ml-2" />
                    </div>

                    {progress && (
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t">
                        <div className="text-center bg-blue-50 rounded-lg py-2">
                          <div className="text-lg font-bold text-blue-600">{progress.vocabulary}</div>
                          <div className="text-xs text-gray-600">Words</div>
                        </div>
                        <div className="text-center bg-green-50 rounded-lg py-2">
                          <div className="text-lg font-bold text-green-600">{progress.conversations}</div>
                          <div className="text-xs text-gray-600">Chats</div>
                        </div>
                        <div className="text-center bg-purple-50 rounded-lg py-2">
                          <div className="text-lg font-bold text-purple-600">{progress.fluencyScore}</div>
                          <div className="text-xs text-gray-600">Score</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {students.length === 0 && (
                <div className="text-center py-16 text-gray-500">
                  <Users size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No students assigned</p>
                </div>
              )}
            </div>

            {/* Student Detail Modal - Mobile-First */}
            {selectedStudent && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
                  <div className="flex-shrink-0 bg-white p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User size={24} className="text-blue-600" />
                        </div>
                        <div className="ml-3 min-w-0 flex-1">
                          <h2 className="text-lg font-bold text-gray-900 truncate">{selectedStudent.name}</h2>
                          <p className="text-sm text-gray-600 truncate">{selectedStudent.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedStudent(null)}
                        className="p-2 hover:bg-gray-100 rounded-full flex-shrink-0 ml-2"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4">
                    {getStudentProgress(selectedStudent.id) && (
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-blue-50 p-4 rounded-xl text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {getStudentProgress(selectedStudent.id).vocabulary}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">Words</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-xl text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {getStudentProgress(selectedStudent.id).conversations}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">Chats</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-xl text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {getStudentProgress(selectedStudent.id).fluencyScore}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">Score</div>
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <button
                        onClick={() => setShowObservationForm(true)}
                        className="p-3 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-sm font-medium hover:bg-purple-100 transition-colors"
                      >
                        <FileText size={16} className="mr-2 flex-shrink-0" />
                        <span>Add Note</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStudentForImprovement(selectedStudent);
                          setActiveTab('areasToImprove');
                          setSelectedStudent(null);
                        }}
                        className="p-3 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center text-sm font-medium hover:bg-orange-100 transition-colors"
                      >
                        <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
                        <span>Add Goal</span>
                      </button>
                    </div>

                    {/* Observations */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3 text-sm">Recent Notes</h3>

                      {showObservationForm && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                          <textarea
                            value={newObservation}
                            onChange={(e) => setNewObservation(e.target.value)}
                            placeholder="Write your observation..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none text-sm"
                            rows={3}
                            autoFocus
                          />
                          <div className="flex justify-end space-x-2 mt-2">
                            <button
                              onClick={() => {
                                setShowObservationForm(false);
                                setNewObservation('');
                              }}
                              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleAddObservation}
                              className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        {studyGuides[selectedStudent.id]?.observations?.slice(-3).reverse().map((obs) => (
                          <div key={obs.id} className="bg-white border rounded-lg p-3">
                            <p className="text-sm text-gray-900">{obs.text}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(obs.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        )) || (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No notes yet
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes/Observations Tab */}
        {activeTab === 'observations' && (
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">All Student Notes</h3>
            <div className="space-y-3">
              {students.map((student) => {
                const guide = studyGuides[student.id];
                const observations = guide?.observations || [];

                if (observations.length === 0) return null;

                return (
                  <div key={student.id} className="border rounded-xl p-4 bg-white">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <User size={16} className="mr-2 text-blue-600 flex-shrink-0" />
                      <span className="truncate">{student.name}</span>
                    </h4>
                    <div className="space-y-2">
                      {observations.slice(-2).reverse().map((obs) => (
                        <div key={obs.id} className="bg-purple-50 rounded-lg p-3">
                          <p className="text-sm text-gray-900">{obs.text}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(obs.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Areas to Improve Tab */}
        {activeTab === 'areasToImprove' && (
          <div className="p-4">
            {!selectedStudentForImprovement ? (
              <>
                <h3 className="font-semibold text-gray-900 mb-4">Select a Student</h3>
                <div className="space-y-3">
                  {students.map((student) => {
                    const improvements = JSON.parse(localStorage.getItem('areasToImprove') || '{}')[student.id] || [];

                    return (
                      <div
                        key={student.id}
                        onClick={() => setSelectedStudentForImprovement(student)}
                        className="border rounded-xl p-4 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer bg-white"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center min-w-0 flex-1">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User size={20} className="text-orange-600" />
                            </div>
                            <div className="ml-3 min-w-0 flex-1">
                              <h4 className="font-medium text-gray-900 truncate">{student.name}</h4>
                              <p className="text-sm text-gray-600">
                                {improvements.length} area{improvements.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <ChevronRight size={20} className="text-gray-400 flex-shrink-0 ml-2" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div>
                <button
                  onClick={() => setSelectedStudentForImprovement(null)}
                  className="mb-4 text-orange-600 hover:text-orange-700 flex items-center text-sm font-medium"
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Back to students
                </button>

                <div className="mb-6 p-4 bg-orange-50 rounded-xl">
                  <h4 className="font-semibold text-gray-900">
                    {selectedStudentForImprovement.name}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Add areas where this student needs improvement
                  </p>
                </div>

                <button
                  onClick={() => setShowImprovementForm(true)}
                  className="w-full mb-4 px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 flex items-center justify-center font-medium"
                >
                  <Plus size={18} className="mr-2" />
                  Add Area to Improve
                </button>

                {showImprovementForm && (
                  <div className="mb-6 p-4 border rounded-xl bg-white">
                    <input
                      type="text"
                      value={newImprovement.area}
                      onChange={(e) => setNewImprovement({...newImprovement, area: e.target.value})}
                      placeholder="Area (e.g., 'Tone accuracy')"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm"
                    />
                    <textarea
                      value={newImprovement.details}
                      onChange={(e) => setNewImprovement({...newImprovement, details: e.target.value})}
                      placeholder="Details about the issue..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 resize-none text-sm"
                      rows={3}
                    />
                    <textarea
                      value={newImprovement.suggestions}
                      onChange={(e) => setNewImprovement({...newImprovement, suggestions: e.target.value})}
                      placeholder="Suggestions for improvement..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 resize-none text-sm"
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setShowImprovementForm(false);
                          setNewImprovement({ area: '', details: '', suggestions: '' });
                        }}
                        className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-900 border rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddImprovement}
                        className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {(JSON.parse(localStorage.getItem('areasToImprove') || '{}')[selectedStudentForImprovement.id] || []).map((improvement) => (
                    <div key={improvement.id} className="border rounded-xl p-4 bg-orange-50">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-semibold text-orange-900 flex items-center">
                          <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
                          <span className="flex-1">{improvement.area}</span>
                        </h5>
                        <button className="text-gray-400 hover:text-red-600 flex-shrink-0 ml-2">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {improvement.details && (
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Details:</strong> {improvement.details}
                        </p>
                      )}
                      {improvement.suggestions && (
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Suggestions:</strong> {improvement.suggestions}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(improvement.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Learning Materials Tab */}
        {activeTab === 'materials' && (
          <div className="p-4">
            <button
              onClick={() => setShowMaterialForm(true)}
              className="w-full mb-4 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center justify-center font-medium"
            >
              <Plus size={18} className="mr-2" />
              Add Learning Material
            </button>

            {showMaterialForm && (
              <div className="mb-6 p-4 border rounded-xl bg-white">
                <input
                  type="text"
                  value={newMaterial.title}
                  onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                  placeholder="Material Title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm"
                />
                <input
                  type="url"
                  value={newMaterial.url}
                  onChange={(e) => setNewMaterial({...newMaterial, url: e.target.value})}
                  placeholder="URL (https://...)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm"
                />
                <textarea
                  value={newMaterial.description}
                  onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
                  placeholder="Description (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 resize-none text-sm"
                  rows={2}
                />

                <label className="flex items-center mb-3 text-sm">
                  <input
                    type="checkbox"
                    checked={newMaterial.global}
                    onChange={(e) => setNewMaterial({...newMaterial, global: e.target.checked, studentIds: []})}
                    className="mr-2"
                  />
                  <Globe size={14} className="mr-1 flex-shrink-0" />
                  <span>Available to all students</span>
                </label>

                {!newMaterial.global && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">Select Students:</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-gray-50">
                      {students.map((student) => (
                        <label key={student.id} className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={newMaterial.studentIds.includes(student.id)}
                            onChange={(e) => {
                              const ids = e.target.checked
                                ? [...newMaterial.studentIds, student.id]
                                : newMaterial.studentIds.filter(id => id !== student.id);
                              setNewMaterial({...newMaterial, studentIds: ids});
                            }}
                            className="mr-2 flex-shrink-0"
                          />
                          <span className="truncate">{student.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setShowMaterialForm(false);
                      setNewMaterial({
                        title: '',
                        url: '',
                        description: '',
                        studentIds: [],
                        global: true
                      });
                    }}
                    className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-900 border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMaterial}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {(JSON.parse(localStorage.getItem('learningMaterials') || '{}')[user.id] || []).map((material) => (
                <div key={material.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 flex items-center flex-1 min-w-0">
                      <LinkIcon size={16} className="mr-2 text-green-600 flex-shrink-0" />
                      <span className="truncate">{material.title}</span>
                    </h4>
                    <button className="text-gray-400 hover:text-red-600 flex-shrink-0 ml-2">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <a
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline inline-block mb-2 truncate max-w-full"
                  >
                    {material.url}
                  </a>
                  {material.description && (
                    <p className="text-sm text-gray-600 mt-2">{material.description}</p>
                  )}
                  <div className="mt-3 flex items-center text-xs text-gray-500">
                    {material.global ? (
                      <span className="flex items-center">
                        <Globe size={12} className="mr-1 flex-shrink-0" />
                        All students
                      </span>
                    ) : (
                      <span>{material.studentIds.length} student(s)</span>
                    )}
                    <span className="mx-2">•</span>
                    <span>{new Date(material.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}

              {!(JSON.parse(localStorage.getItem('learningMaterials') || '{}')[user.id]?.length) && (
                <p className="text-gray-500 text-center py-12 text-sm">
                  No materials yet. Add your first one!
                </p>
              )}
            </div>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="p-4">
            <button
              onClick={() => setShowAnnouncementForm(true)}
              className="w-full mb-4 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center justify-center font-medium"
            >
              <Plus size={18} className="mr-2" />
              Post Announcement
            </button>

            {showAnnouncementForm && (
              <div className="mb-6 p-4 border rounded-xl bg-white">
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  placeholder="Announcement Title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm"
                />
                <textarea
                  value={newAnnouncement.message}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                  placeholder="Message"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 resize-none text-sm"
                  rows={4}
                />
                <select
                  value={newAnnouncement.priority}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
                <label className="flex items-center mb-3 text-sm">
                  <input
                    type="checkbox"
                    checked={newAnnouncement.global}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, global: e.target.checked})}
                    className="mr-2"
                  />
                  <Bell size={14} className="mr-1 flex-shrink-0" />
                  <span>Send to all students</span>
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setShowAnnouncementForm(false);
                      setNewAnnouncement({
                        title: '',
                        message: '',
                        priority: 'normal',
                        global: true
                      });
                    }}
                    className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-900 border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddAnnouncement}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
                  >
                    <Send size={14} className="mr-2" />
                    Post
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-gray-500 text-center py-12 text-sm">
                No announcements yet.
              </p>
            </div>
          </div>
        )}

        {/* Lesson Plans Tab */}
        {activeTab === 'lessonPlans' && (
          <div className="p-4">
            <div className="text-center py-16 text-gray-500">
              <BookOpen size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Lesson plans coming soon!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;