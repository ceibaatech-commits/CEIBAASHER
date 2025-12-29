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
      const [examsRes, categoriesRes, chaptersRes, statsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/admin/manage/exams`),
        fetch(`${BACKEND_URL}/api/admin/manage/categories`),
        fetch(`${BACKEND_URL}/api/admin/manage/chapters`),
        fetch(`${BACKEND_URL}/api/admin/manage/stats`)
      ]);
      
      const examsData = await examsRes.json();
      const categoriesData = await categoriesRes.json();
      const chaptersData = await chaptersRes.json();
      const statsData = await statsRes.json();
      
      if (examsData.success) setExams(examsData.exams || []);
      if (categoriesData.success) setCategories(categoriesData.categories || []);
      if (chaptersData.success) setChapters(chaptersData.chapters || []);
      if (statsData.success) setStats(statsData.stats || {});
      
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

  // Filter data by search term
  const filteredExams = exams.filter(e => 
    e.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <p className="text-gray-600">Create, edit, and manage exams, categories, and chapters</p>
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
            placeholder="Search exams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => openModal('exam', 'create')}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Exam
        </button>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      ) : (
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
