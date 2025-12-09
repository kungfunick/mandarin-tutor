/**
 * Teacher Dashboard Component
 * Manage students, lesson plans, and announcements
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStudyGuide } from '../contexts/StudyGuideContext';
import {
  Users, User, BookOpen, Bell, FileText, Calendar,
  ChevronRight, Plus, Edit2, Trash2, Send, X, Link as LinkIcon,
  AlertTriangle, Globe
} from 'lucide-react';

export const TeacherDashboard = ({ onClose }) => {
  const { user, getStudents } = useAuth();
  const { getAllStudyGuides, addObservation, addLessonPlan, addAnnouncement } = useStudyGuide();
  const [activeTab, setActiveTab] = useState('students');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [studyGuides, setStudyGuides] = useState({});

  // Forms
  const [showObservationForm, setShowObservationForm] = useState(false);
  const [showLessonPlanForm, setShowLessonPlanForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showImprovementForm, setShowImprovementForm] = useState(false);
  const [selectedStudentForImprovement, setSelectedStudentForImprovement] = useState(null);

  const [newObservation, setNewObservation] = useState('');
  const [newLessonPlan, setNewLessonPlan] = useState({
    title: '',
    date: '',
    objectives: '',
    materials: '',
    activities: ''
  });
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

  const handleAddLessonPlan = () => {
    if (newLessonPlan.title.trim()) {
      addLessonPlan(user.id, newLessonPlan);
      setNewLessonPlan({
        title: '',
        date: '',
        objectives: '',
        materials: '',
        activities: ''
      });
      setShowLessonPlanForm(false);
      loadStudents();
    }
  };

  const handleAddAnnouncement = () => {
    if (newAnnouncement.title.trim() && newAnnouncement.message.trim()) {
      addAnnouncement(user.id, newAnnouncement);
      setNewAnnouncement({
        title: '',
        message: '',
        priority: 'normal',
        global: true
      });
      setShowAnnouncementForm(false);
      loadStudents();
    }
  };

  const handleAddMaterial = () => {
    if (newMaterial.title.trim() && newMaterial.url.trim()) {
      // Save to localStorage
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
      // Save to localStorage
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="mr-2 text-blue-600" size={28} />
              Teacher Dashboard
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your students and classroom
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-gray-50 overflow-x-auto">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'students'
              ? 'bg-white text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users size={16} className="inline mr-2" />
          Students ({students.length})
        </button>
        <button
          onClick={() => setActiveTab('observations')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'observations'
              ? 'bg-white text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText size={16} className="inline mr-2" />
          Observations
        </button>
        <button
          onClick={() => setActiveTab('areasToImprove')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'areasToImprove'
              ? 'bg-white text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <AlertTriangle size={16} className="inline mr-2" />
          Areas to Improve
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'materials'
              ? 'bg-white text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <LinkIcon size={16} className="inline mr-2" />
          Learning Materials
        </button>
        <button
          onClick={() => setActiveTab('lessonPlans')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'lessonPlans'
              ? 'bg-white text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BookOpen size={16} className="inline mr-2" />
          Lesson Plans
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'announcements'
              ? 'bg-white text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Bell size={16} className="inline mr-2" />
          Announcements
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              {students.map((student) => {
                const progress = getStudentProgress(student.id);
                const guide = studyGuides[student.id];

                return (
                  <div
                    key={student.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User size={24} className="text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <h3 className="font-semibold text-gray-900">{student.name}</h3>
                          <p className="text-sm text-gray-600">{student.email}</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-gray-400" />
                    </div>

                    {progress && (
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{progress.vocabulary}</div>
                          <div className="text-xs text-gray-600">Words</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{progress.conversations}</div>
                          <div className="text-xs text-gray-600">Conversations</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{progress.fluencyScore}</div>
                          <div className="text-xs text-gray-600">Fluency</div>
                        </div>
                      </div>
                    )}

                    {guide?.observations && guide.observations.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-600">Latest observation:</p>
                        <p className="text-sm text-gray-800 mt-1 line-clamp-2">
                          {guide.observations[guide.observations.length - 1].text}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {students.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Users size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>No students assigned yet</p>
                </div>
              )}
            </div>

            {/* Student Detail Modal */}
            {selectedStudent && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                          <User size={32} className="text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <h2 className="text-2xl font-bold text-gray-900">{selectedStudent.name}</h2>
                          <p className="text-gray-600">{selectedStudent.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedStudent(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Progress Stats */}
                    {getStudentProgress(selectedStudent.id) && (
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                          <div className="text-3xl font-bold text-blue-600">
                            {getStudentProgress(selectedStudent.id).vocabulary}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">Words Mastered</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                          <div className="text-3xl font-bold text-green-600">
                            {getStudentProgress(selectedStudent.id).conversations}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">Conversations</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                          <div className="text-3xl font-bold text-purple-600">
                            {getStudentProgress(selectedStudent.id).fluencyScore}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">Fluency Score</div>
                        </div>
                      </div>
                    )}

                    {/* Observations */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Observations</h3>
                        <button
                          onClick={() => setShowObservationForm(!showObservationForm)}
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                        >
                          <Plus size={16} className="mr-1" />
                          Add Note
                        </button>
                      </div>

                      {showObservationForm && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                          <textarea
                            value={newObservation}
                            onChange={(e) => setNewObservation(e.target.value)}
                            placeholder="Write your observation..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                            rows={3}
                          />
                          <div className="flex justify-end space-x-2 mt-2">
                            <button
                              onClick={() => {
                                setShowObservationForm(false);
                                setNewObservation('');
                              }}
                              className="px-3 py-1 text-gray-600 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleAddObservation}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        {studyGuides[selectedStudent.id]?.observations?.map((obs) => (
                          <div key={obs.id} className="bg-white border rounded-lg p-3">
                            <p className="text-gray-900">{obs.text}</p>
                            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                              <span>{obs.addedBy}</span>
                              <span>{new Date(obs.timestamp).toLocaleDateString()}</span>
                            </div>
                          </div>
                        )) || (
                          <p className="text-gray-500 text-sm text-center py-4">
                            No observations yet
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

        {/* Observations Tab */}
        {activeTab === 'observations' && (
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">All Student Observations</h3>
            <div className="space-y-4">
              {students.map((student) => {
                const guide = studyGuides[student.id];
                const observations = guide?.observations || [];

                if (observations.length === 0) return null;

                return (
                  <div key={student.id} className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">{student.name}</h4>
                    <div className="space-y-2">
                      {observations.map((obs) => (
                        <div key={obs.id} className="bg-gray-50 rounded p-3">
                          <p className="text-sm text-gray-900">{obs.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
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

        {/* Lesson Plans Tab */}
        {activeTab === 'lessonPlans' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Lesson Plans</h3>
              <button
                onClick={() => setShowLessonPlanForm(!showLessonPlanForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus size={16} className="mr-2" />
                New Lesson Plan
              </button>
            </div>

            {showLessonPlanForm && (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <input
                  type="text"
                  value={newLessonPlan.title}
                  onChange={(e) => setNewLessonPlan({...newLessonPlan, title: e.target.value})}
                  placeholder="Lesson Title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                />
                <input
                  type="date"
                  value={newLessonPlan.date}
                  onChange={(e) => setNewLessonPlan({...newLessonPlan, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                />
                <textarea
                  value={newLessonPlan.objectives}
                  onChange={(e) => setNewLessonPlan({...newLessonPlan, objectives: e.target.value})}
                  placeholder="Learning Objectives"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 resize-none"
                  rows={2}
                />
                <textarea
                  value={newLessonPlan.materials}
                  onChange={(e) => setNewLessonPlan({...newLessonPlan, materials: e.target.value})}
                  placeholder="Materials Needed"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 resize-none"
                  rows={2}
                />
                <textarea
                  value={newLessonPlan.activities}
                  onChange={(e) => setNewLessonPlan({...newLessonPlan, activities: e.target.value})}
                  placeholder="Activities"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 resize-none"
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setShowLessonPlanForm(false);
                      setNewLessonPlan({
                        title: '',
                        date: '',
                        objectives: '',
                        materials: '',
                        activities: ''
                      });
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddLessonPlan}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Lesson Plan
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Lesson plans would be displayed here */}
              <p className="text-gray-500 text-center py-12">
                No lesson plans yet. Create your first one!
              </p>
            </div>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Announcements</h3>
              <button
                onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus size={16} className="mr-2" />
                New Announcement
              </button>
            </div>

            {showAnnouncementForm && (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  placeholder="Announcement Title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                />
                <textarea
                  value={newAnnouncement.message}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                  placeholder="Message"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 resize-none"
                  rows={4}
                />
                <select
                  value={newAnnouncement.priority}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
                <div className="mb-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newAnnouncement.global}
                      onChange={(e) => setNewAnnouncement({...newAnnouncement, global: e.target.checked})}
                      className="mr-2"
                    />
                    <Bell size={16} className="mr-1" />
                    <span className="text-sm">Send to all students (global announcement)</span>
                  </label>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setShowAnnouncementForm(false);
                      setNewAnnouncement({
                        title: '',
                        message: '',
                        priority: 'normal'
                      });
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddAnnouncement}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <Send size={16} className="mr-2" />
                    Post Announcement
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Announcements would be displayed here */}
              <p className="text-gray-500 text-center py-12">
                No announcements yet. Post your first one!
              </p>
            </div>
          </div>
        )}

        {/* Learning Materials Tab */}
        {activeTab === 'materials' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Learning Materials</h3>
              <button
                onClick={() => setShowMaterialForm(!showMaterialForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus size={16} className="mr-2" />
                Add Material
              </button>
            </div>

            {showMaterialForm && (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <input
                  type="text"
                  value={newMaterial.title}
                  onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                  placeholder="Material Title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                />
                <input
                  type="url"
                  value={newMaterial.url}
                  onChange={(e) => setNewMaterial({...newMaterial, url: e.target.value})}
                  placeholder="URL (https://...)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                />
                <textarea
                  value={newMaterial.description}
                  onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
                  placeholder="Description (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 resize-none"
                  rows={2}
                />

                <div className="mb-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newMaterial.global}
                      onChange={(e) => setNewMaterial({...newMaterial, global: e.target.checked, studentIds: []})}
                      className="mr-2"
                    />
                    <Globe size={16} className="mr-1" />
                    <span className="text-sm">Available to all students</span>
                  </label>
                </div>

                {!newMaterial.global && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Students:
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
                      {students.map((student) => (
                        <label key={student.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newMaterial.studentIds.includes(student.id)}
                            onChange={(e) => {
                              const ids = e.target.checked
                                ? [...newMaterial.studentIds, student.id]
                                : newMaterial.studentIds.filter(id => id !== student.id);
                              setNewMaterial({...newMaterial, studentIds: ids});
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">{student.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
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
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMaterial}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Material
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {JSON.parse(localStorage.getItem('learningMaterials') || '{}')[user.id]?.map((material) => (
                <div key={material.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        <LinkIcon size={16} className="mr-2 text-blue-600" />
                        {material.title}
                      </h4>
                      <a
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                      >
                        {material.url}
                      </a>
                      {material.description && (
                        <p className="text-sm text-gray-600 mt-2">{material.description}</p>
                      )}
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        {material.global ? (
                          <span className="flex items-center">
                            <Globe size={12} className="mr-1" />
                            All students
                          </span>
                        ) : (
                          <span>
                            {material.studentIds.length} student(s)
                          </span>
                        )}
                        <span className="mx-2">•</span>
                        <span>{new Date(material.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-12">
                  No learning materials yet. Add your first one!
                </p>
              )}
            </div>
          </div>
        )}

        {/* Areas to Improve Tab */}
        {activeTab === 'areasToImprove' && (
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Areas to Improve by Student</h3>

            {!selectedStudentForImprovement ? (
              <div className="grid grid-cols-1 gap-3">
                {students.map((student) => {
                  const improvements = JSON.parse(localStorage.getItem('areasToImprove') || '{}')[student.id] || [];

                  return (
                    <div
                      key={student.id}
                      onClick={() => setSelectedStudentForImprovement(student)}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <User size={20} className="text-orange-600" />
                          </div>
                          <div className="ml-3">
                            <h4 className="font-medium text-gray-900">{student.name}</h4>
                            <p className="text-sm text-gray-600">
                              {improvements.length} area(s) noted
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={20} className="text-gray-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setSelectedStudentForImprovement(null)}
                  className="mb-4 text-blue-600 hover:text-blue-700 flex items-center"
                >
                  ← Back to students
                </button>

                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">
                    {selectedStudentForImprovement.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Add areas where this student needs improvement
                  </p>
                </div>

                {!showImprovementForm && (
                  <button
                    onClick={() => setShowImprovementForm(true)}
                    className="mb-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Area to Improve
                  </button>
                )}

                {showImprovementForm && (
                  <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                    <input
                      type="text"
                      value={newImprovement.area}
                      onChange={(e) => setNewImprovement({...newImprovement, area: e.target.value})}
                      placeholder="Area to improve (e.g., 'Tone accuracy', 'Grammar: 了 particle')"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                    />
                    <textarea
                      value={newImprovement.details}
                      onChange={(e) => setNewImprovement({...newImprovement, details: e.target.value})}
                      placeholder="Details about the issue..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 resize-none"
                      rows={3}
                    />
                    <textarea
                      value={newImprovement.suggestions}
                      onChange={(e) => setNewImprovement({...newImprovement, suggestions: e.target.value})}
                      placeholder="Suggestions for improvement..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setShowImprovementForm(false);
                          setNewImprovement({
                            area: '',
                            details: '',
                            suggestions: ''
                          });
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddImprovement}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {(JSON.parse(localStorage.getItem('areasToImprove') || '{}')[selectedStudentForImprovement.id] || []).map((improvement) => (
                    <div key={improvement.id} className="border rounded-lg p-4 bg-orange-50">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-semibold text-orange-900 flex items-center">
                          <AlertTriangle size={16} className="mr-2" />
                          {improvement.area}
                        </h5>
                        <button className="text-gray-400 hover:text-red-600">
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
                        Added by {improvement.createdBy} on {new Date(improvement.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}

                  {(JSON.parse(localStorage.getItem('areasToImprove') || '{}')[selectedStudentForImprovement.id] || []).length === 0 && !showImprovementForm && (
                    <p className="text-gray-500 text-center py-12">
                      No areas to improve noted yet
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;