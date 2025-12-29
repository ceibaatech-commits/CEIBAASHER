import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, ChevronDown, ChevronRight, 
  BookOpen, Layers, FileText, Search, X, Save,
  AlertCircle, CheckCircle, Loader2, Filter, GraduationCap
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Excluded IDs and Categories for "Other Competitive Exams"
const EXCLUDED_EXAM_IDS = ['NDA', 'Agniveer', 'CDS', 'CAPF'];
const EXCLUDED_CATEGORIES = [
  'Admission Tests', 'Banking Examinations', 'UPSC Examinations', 
  'SSC Examinations', 'Teaching Examinations', 'Language Proficiency Tests', 
  'Language Games', 'UPPSC Examinations', 'CSBC Examinations', 
  'RSMSSB Examinations', 'Defence Exams', 'Government Jobs', 'Medical Entrance'
];

const ExamCategoryManager = () => {
  // State
  const [exams, setExams] = useState([]);
  const [hardcodedExams, setHardcodedExams] = useState([]);
  const [cbseChapters, setCbseChapters] = useState({});
  const [categories, setCategories] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [stats, setStats] = useState({ exams: 0, categories: 0, chapters: 0, questions: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState('other-exams'); // 'other-exams', 'cbse-chapters', 'all-exams'
  const [expandedExams, setExpandedExams] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedClasses, setExpandedClasses] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create or edit
  const [modalType, setModalType] = useState('exam'); // exam, category, chapter, or cbse-chapter
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [examsRes, categoriesRes, chaptersRes, statsRes, hardcodedRes, cbseRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/admin/manage/exams`),
        fetch(`${BACKEND_URL}/api/admin/manage/categories`),
        fetch(`${BACKEND_URL}/api/admin/manage/chapters`),
        fetch(`${BACKEND_URL}/api/admin/manage/stats`),
        fetch(`${BACKEND_URL}/api/exam-metadata`),
        fetch(`${BACKEND_URL}/api/admin/class-subjects`)
      ]);
      
      const examsData = await examsRes.json();
      const categoriesData = await categoriesRes.json();
      const chaptersData = await chaptersRes.json();
      const statsData = await statsRes.json();
      const hardcodedData = await hardcodedRes.json();
      const cbseData = await cbseRes.json();
      
      if (examsData.success) setExams(examsData.exams || []);
      if (categoriesData.success) setCategories(categoriesData.categories || []);
      if (chaptersData.success) setChapters(chaptersData.chapters || []);
      if (statsData.success) setStats(statsData.stats || {});
      if (hardcodedData.exams) setHardcodedExams(hardcodedData.exams || []);
      if (cbseData.data) setCbseChapters(cbseData.data || []);
      
      setError(null);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Show success message temporarily
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Open modal for create/edit
  const openModal = (type, mode, item = null) => {
    setModalType(type);
    setModalMode(mode);
    setEditingItem(item);
    
    if (mode === 'edit' && item) {
      setFormData({ ...item });
    } else {
      // Default form data for create
      const defaults = {
        exam: { name: '', description: '', duration: 180, total_marks: 100, icon: '📚', color: 'blue', is_active: true },
        category: { name: '', description: '', icon: '📖', color: 'indigo', is_active: true, exam_id: '' },
        chapter: { name: '', description: '', sub_topics: [], is_active: true, exam_id: '', category_id: '' }
      };
      setFormData(defaults[type]);
    }
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const endpoint = modalType === 'exam' ? 'exams' : modalType === 'category' ? 'categories' : 'chapters';
      const url = modalMode === 'create' 
        ? `${BACKEND_URL}/api/admin/manage/${endpoint}`
        : `${BACKEND_URL}/api/admin/manage/${endpoint}/${editingItem.id}`;
      
      const response = await fetch(url, {
        method: modalMode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess(data.message || `${modalType} ${modalMode === 'create' ? 'created' : 'updated'} successfully`);
        setShowModal(false);
        fetchData(); // Refresh data
      } else {
        setError(data.detail || 'Operation failed');
      }
    } catch (err) {
      setError('Failed to save. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (type, id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This will also delete all related data.`)) {
      return;
    }
    
    try {
      const endpoint = type === 'exam' ? 'exams' : type === 'category' ? 'categories' : 'chapters';
      const response = await fetch(`${BACKEND_URL}/api/admin/manage/${endpoint}/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess(data.message || `${type} deleted successfully`);
        fetchData(); // Refresh data
      } else {
        setError(data.detail || 'Delete failed');
      }
    } catch (err) {
      setError('Failed to delete. Please try again.');
      console.error(err);
    }
  };

  // Toggle expand/collapse
  const toggleExam = (examId) => {
    setExpandedExams(prev => ({ ...prev, [examId]: !prev[examId] }));
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const toggleClass = (classKey) => {
    setExpandedClasses(prev => ({ ...prev, [classKey]: !prev[classKey] }));
  };

  // Filter data by search term
  const filteredExams = exams.filter(e => 
    e.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter "Other Competitive Exams" from hardcoded data
  const otherCompetitiveExams = hardcodedExams.filter(exam => {
    const examId = exam.id?.toUpperCase() || '';
    const examCategory = exam.category || '';
    
    // Exclude if ID is in excluded list
    if (EXCLUDED_EXAM_IDS.includes(examId)) return false;
    
    // Exclude if category is in excluded list
    if (EXCLUDED_CATEGORIES.includes(examCategory)) return false;
    
    // Apply search filter
    if (searchTerm && !exam.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    return true;
  });

  // Get categories for an exam
  const getExamCategories = (examId) => {
    return categories.filter(c => c.exam_id === examId);
  };

  // Get chapters for a category
  const getCategoryChapters = (categoryId) => {
    return chapters.filter(c => c.category_id === categoryId);
  };

  // Color options
  const colorOptions = ['blue', 'green', 'red', 'purple', 'indigo', 'pink', 'yellow', 'orange', 'teal', 'cyan'];
  const iconOptions = ['📚', '📖', '🎓', '✏️', '📝', '🔬', '🧪', '🧮', '🌍', '💻', '📊', '🏆'];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Exam & Category Manager</h1>
        <p className="text-gray-600">Create, edit, and manage exams, categories, chapters, and CBSE content</p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700">
          <CheckCircle className="w-5 h-5 mr-2" />
          {successMessage}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('other-exams')}
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition ${
            activeTab === 'other-exams' 
              ? 'bg-purple-100 text-purple-700 border-b-2 border-purple-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Filter className="w-4 h-4 inline mr-2" />
          Other Competitive Exams
        </button>
        <button
          onClick={() => setActiveTab('cbse-chapters')}
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition ${
            activeTab === 'cbse-chapters' 
              ? 'bg-green-100 text-green-700 border-b-2 border-green-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <GraduationCap className="w-4 h-4 inline mr-2" />
          CBSE Chapters
        </button>
        <button
          onClick={() => setActiveTab('all-exams')}
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition ${
            activeTab === 'all-exams' 
              ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          All DB Exams
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Exams</p>
              <p className="text-2xl font-bold text-blue-700">{stats.exams}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Categories</p>
              <p className="text-2xl font-bold text-purple-700">{stats.categories}</p>
            </div>
            <Layers className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Chapters</p>
              <p className="text-2xl font-bold text-green-700">{stats.chapters}</p>
            </div>
            <FileText className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Questions</p>
              <p className="text-2xl font-bold text-orange-700">{stats.questions}</p>
            </div>
            <FileText className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={activeTab === 'cbse-chapters' ? "Search classes or subjects..." : "Search exams..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {activeTab === 'all-exams' && (
          <button
            onClick={() => openModal('exam', 'create')}
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Exam
          </button>
        )}
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      ) : (
        <>
          {/* Other Competitive Exams Tab */}
          {activeTab === 'other-exams' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-purple-50 border-b border-purple-100">
                <h3 className="font-semibold text-purple-800">Other Competitive Exams</h3>
                <p className="text-sm text-purple-600">
                  Exams NOT in: {EXCLUDED_EXAM_IDS.join(', ')} | Categories excluded: {EXCLUDED_CATEGORIES.length} categories
                </p>
              </div>
              {otherCompetitiveExams.length === 0 ? (
                <div className="p-12 text-center">
                  <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Matching Exams</h3>
                  <p className="text-gray-500">No exams match the filter criteria</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {otherCompetitiveExams.map((exam) => (
                    <div key={exam.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          {exam.icon ? (
                            <img src={exam.icon} alt="" className="w-10 h-10 rounded-lg mr-3 object-cover" />
                          ) : (
                            <span className="text-2xl mr-3">📚</span>
                          )}
                          <div>
                            <h4 className="font-medium text-gray-900">{exam.name}</h4>
                            <p className="text-sm text-gray-500">
                              ID: {exam.id} | Category: {exam.category || 'N/A'} | Questions: {exam.total_questions || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full bg-${exam.color?.split('-')[1] || 'blue'}-100 text-${exam.color?.split('-')[1] || 'blue'}-700`}>
                            {exam.category || 'Uncategorized'}
                          </span>
                          <button
                            onClick={() => {
                              setEditingItem(exam);
                              setFormData({
                                name: exam.name,
                                description: exam.description,
                                icon: exam.icon,
                                color: exam.color,
                                category: exam.category
                              });
                              setModalType('hardcoded-exam');
                              setModalMode('edit');
                              setShowModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit Exam"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteHardcodedExam(exam.id, exam.name)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete Exam"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="p-4 bg-gray-50 border-t text-sm text-gray-600">
                Showing {otherCompetitiveExams.length} of {hardcodedExams.length} total exams (filtered)
              </div>
            </div>
          )}

          {/* CBSE Chapters Tab */}
          {activeTab === 'cbse-chapters' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-green-50 border-b border-green-100">
                <h3 className="font-semibold text-green-800">CBSE Chapter Management</h3>
                <p className="text-sm text-green-600">Manage chapters for CBSE Class 6-12 across all subjects</p>
              </div>
              {cbseChapters.length === 0 ? (
                <div className="p-12 text-center">
                  <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No CBSE Data Found</h3>
                  <p className="text-gray-500">CBSE chapter data is not available</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {cbseChapters
                    .filter(item => !searchTerm || 
                      item.class?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      item.subjects?.some(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map((classData) => (
                    <div key={classData.class} className="bg-white">
                      {/* Class Row */}
                      <div 
                        className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleClass(classData.class)}
                      >
                        <div className="flex items-center flex-1">
                          <button className="mr-3 text-gray-400 hover:text-gray-600">
                            {expandedClasses[classData.class] ? 
                              <ChevronDown className="w-5 h-5" /> : 
                              <ChevronRight className="w-5 h-5" />
                            }
                          </button>
                          <GraduationCap className="w-6 h-6 text-green-600 mr-3" />
                          <div>
                            <h4 className="font-medium text-gray-900">Class {classData.class.replace('_', ' ').replace('science', '(Science)').replace('commerce', '(Commerce)').replace('humanities', '(Humanities)')}</h4>
                            <p className="text-sm text-gray-500">{classData.subjects?.length || 0} subjects</p>
                          </div>
                        </div>
                      </div>

                      {/* Subjects (expandable) */}
                      {expandedClasses[classData.class] && (
                        <div className="bg-gray-50 border-t border-gray-200">
                          {classData.subjects?.map((subject) => (
                            <div key={subject.slug} className="border-t border-gray-100">
                              <div 
                                className="flex items-center justify-between p-3 pl-12 hover:bg-gray-100 cursor-pointer"
                                onClick={() => toggleCategory(`${classData.class}-${subject.slug}`)}
                              >
                                <div className="flex items-center flex-1">
                                  <button className="mr-3 text-gray-400">
                                    {expandedCategories[`${classData.class}-${subject.slug}`] ? 
                                      <ChevronDown className="w-4 h-4" /> : 
                                      <ChevronRight className="w-4 h-4" />
                                    }
                                  </button>
                                  <BookOpen className="w-5 h-5 text-blue-500 mr-2" />
                                  <div>
                                    <h5 className="font-medium text-gray-800">{subject.name}</h5>
                                    <p className="text-xs text-gray-500">{subject.chapters?.length || 0} chapters</p>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Add chapter to this subject
                                    setFormData({
                                      class: classData.class,
                                      subject: subject.name,
                                      subject_slug: subject.slug,
                                      chapter_name: ''
                                    });
                                    setModalType('cbse-chapter');
                                    setModalMode('create');
                                    setShowModal(true);
                                  }}
                                  className="p-1.5 text-green-600 hover:bg-green-100 rounded"
                                  title="Add Chapter"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Chapters */}
                              {expandedCategories[`${classData.class}-${subject.slug}`] && (
                                <div className="bg-gray-100 pl-20 py-2">
                                  {subject.chapters?.length === 0 ? (
                                    <p className="text-sm text-gray-500 py-2">No chapters</p>
                                  ) : (
                                    subject.chapters?.map((chapter, idx) => (
                                      <div key={idx} className="flex items-center justify-between py-1.5 pr-4">
                                        <div className="flex items-center">
                                          <FileText className="w-4 h-4 text-gray-400 mr-2" />
                                          <span className="text-sm text-gray-700">{chapter}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                          <button
                                            onClick={() => {
                                              setEditingItem({ chapter, index: idx });
                                              setFormData({
                                                class: classData.class,
                                                subject: subject.name,
                                                subject_slug: subject.slug,
                                                chapter_name: chapter,
                                                chapter_index: idx
                                              });
                                              setModalType('cbse-chapter');
                                              setModalMode('edit');
                                              setShowModal(true);
                                            }}
                                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                          >
                                            <Edit2 className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteCbseChapter(classData.class, subject.slug, idx, chapter)}
                                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All DB Exams Tab */}
          {activeTab === 'all-exams' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {filteredExams.length === 0 ? (
                <div className="p-12 text-center">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Exams Found</h3>
                  <p className="text-gray-500 mb-4">Get started by creating your first exam</p>
                  <button
                    onClick={() => openModal('exam', 'create')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Exam
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredExams.map((exam) => (
                <div key={exam.id} className="bg-white">
                  {/* Exam Row */}
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50">
                    <div className="flex items-center flex-1">
                      <button
                        onClick={() => toggleExam(exam.id)}
                        className="mr-3 text-gray-400 hover:text-gray-600"
                      >
                        {expandedExams[exam.id] ? 
                          <ChevronDown className="w-5 h-5" /> : 
                          <ChevronRight className="w-5 h-5" />
                        }
                      </button>
                      <span className="text-2xl mr-3">{exam.icon || '📚'}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">{exam.name}</h3>
                        <p className="text-sm text-gray-500">
                          {getExamCategories(exam.id).length} categories • {exam.description?.substring(0, 50) || 'No description'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${exam.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {exam.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => openModal('category', 'create', { exam_id: exam.id })}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Add Category"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openModal('exam', 'edit', exam)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit Exam"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete('exam', exam.id, exam.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete Exam"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Categories (expandable) */}
                  {expandedExams[exam.id] && (
                    <div className="bg-gray-50 border-t border-gray-200">
                      {getExamCategories(exam.id).length === 0 ? (
                        <div className="p-4 pl-12 text-gray-500 text-sm">
                          No categories. <button onClick={() => openModal('category', 'create', { exam_id: exam.id })} className="text-blue-600 hover:underline">Add one</button>
                        </div>
                      ) : (
                        getExamCategories(exam.id).map((category) => (
                          <div key={category.id}>
                            {/* Category Row */}
                            <div className="flex items-center justify-between p-3 pl-12 hover:bg-gray-100 border-t border-gray-100">
                              <div className="flex items-center flex-1">
                                <button
                                  onClick={() => toggleCategory(category.id)}
                                  className="mr-3 text-gray-400 hover:text-gray-600"
                                >
                                  {expandedCategories[category.id] ? 
                                    <ChevronDown className="w-4 h-4" /> : 
                                    <ChevronRight className="w-4 h-4" />
                                  }
                                </button>
                                <span className="text-xl mr-2">{category.icon || '📖'}</span>
                                <div>
                                  <h4 className="font-medium text-gray-800">{category.name}</h4>
                                  <p className="text-xs text-gray-500">
                                    {getCategoryChapters(category.id).length} chapters
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => openModal('chapter', 'create', { exam_id: exam.id, category_id: category.id })}
                                  className="p-1.5 text-green-600 hover:bg-green-100 rounded"
                                  title="Add Chapter"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openModal('category', 'edit', category)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                                  title="Edit Category"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete('category', category.id, category.name)}
                                  className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                                  title="Delete Category"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Chapters (expandable) */}
                            {expandedCategories[category.id] && (
                              <div className="bg-gray-100">
                                {getCategoryChapters(category.id).length === 0 ? (
                                  <div className="p-3 pl-20 text-gray-500 text-xs">
                                    No chapters. <button onClick={() => openModal('chapter', 'create', { exam_id: exam.id, category_id: category.id })} className="text-blue-600 hover:underline">Add one</button>
                                  </div>
                                ) : (
                                  getCategoryChapters(category.id).map((chapter) => (
                                    <div key={chapter.id} className="flex items-center justify-between p-2 pl-20 hover:bg-gray-200 border-t border-gray-200">
                                      <div className="flex items-center">
                                        <FileText className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-700">{chapter.name}</span>
                                        {chapter.sub_topics?.length > 0 && (
                                          <span className="ml-2 text-xs text-gray-500">
                                            ({chapter.sub_topics.length} sub-topics)
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <button
                                          onClick={() => openModal('chapter', 'edit', chapter)}
                                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                          title="Edit Chapter"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => handleDelete('chapter', chapter.id, chapter.name)}
                                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                                          title="Delete Chapter"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {modalMode === 'create' ? 'Create' : 'Edit'} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={`Enter ${modalType} name`}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Optional description"
                />
              </div>

              {/* Exam-specific fields */}
              {modalType === 'exam' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
                      <input
                        type="number"
                        value={formData.duration || 180}
                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                      <input
                        type="number"
                        value={formData.total_marks || 100}
                        onChange={(e) => setFormData({ ...formData, total_marks: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Icon & Color (for exam and category) */}
              {(modalType === 'exam' || modalType === 'category') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                    <div className="flex flex-wrap gap-2">
                      {iconOptions.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon })}
                          className={`text-xl p-1 rounded ${formData.icon === icon ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'}`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, color })}
                          className={`w-6 h-6 rounded-full bg-${color}-500 ${formData.color === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                          style={{ backgroundColor: `var(--color-${color}-500, ${color})` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Parent selection for category */}
              {modalType === 'category' && modalMode === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Exam *</label>
                  <select
                    required
                    value={formData.exam_id || ''}
                    onChange={(e) => setFormData({ ...formData, exam_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select an exam</option>
                    {exams.map((exam) => (
                      <option key={exam.id} value={exam.id}>{exam.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Parent selection for chapter */}
              {modalType === 'chapter' && modalMode === 'create' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Exam *</label>
                    <select
                      required
                      value={formData.exam_id || ''}
                      onChange={(e) => setFormData({ ...formData, exam_id: e.target.value, category_id: '' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select an exam</option>
                      {exams.map((exam) => (
                        <option key={exam.id} value={exam.id}>{exam.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category *</label>
                    <select
                      required
                      value={formData.category_id || ''}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      disabled={!formData.exam_id}
                    >
                      <option value="">Select a category</option>
                      {categories.filter(c => c.exam_id === formData.exam_id).map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Sub-topics for chapter */}
              {modalType === 'chapter' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sub-topics (comma separated)</label>
                  <input
                    type="text"
                    value={(formData.sub_topics || []).join(', ')}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      sub_topics: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Topic 1, Topic 2, Topic 3"
                  />
                </div>
              )}

              {/* Active toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active !== false}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">Active</label>
              </div>

              {/* Submit */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {modalMode === 'create' ? 'Create' : 'Update'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamCategoryManager;
