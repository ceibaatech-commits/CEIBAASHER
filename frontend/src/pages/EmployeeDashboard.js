import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Briefcase, LogOut, FileSpreadsheet, Plus, Trash2, 
  ExternalLink, Search, RefreshCw, CheckCircle, XCircle,
  User, Clock, BarChart3, Link as LinkIcon, Save, ChevronDown
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sheets');
  
  // Sheet management state
  const [sheets, setSheets] = useState([]);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedOption, setSelectedOption] = useState('exam');
  
  // Form states
  const [examForm, setExamForm] = useState({
    exam_name: '',
    syllabus_topic: '',
    subject: '',
    sub_topic: '',
    sheet_link: ''
  });

  const [classForm, setClassForm] = useState({
    class_name: '',
    subject: '',
    chapter: '',
    sheet_link: ''
  });

  const [bookForm, setBookForm] = useState({
    book_name: '',
    chapter_name: '',
    sheet_link: ''
  });

  // Metadata from backend
  const [examMetadata, setExamMetadata] = useState({
    loaded: false,
    exams: [],
    syllabusTopicsMap: {},
    subjectsMap: {},
    subTopicsMap: {}
  });

  const [cbseClassSubjects, setCbseClassSubjects] = useState({});
  const [books, setBooks] = useState([]);
  const [saving, setSaving] = useState(false);

  const classNames = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11 (Science)', 'Class 11 (Commerce)', 'Class 11 (Humanities)', 'Class 12 (Science)', 'Class 12 (Commerce)', 'Class 12 (Humanities)'];

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('employee_token');
    const employeeData = localStorage.getItem('employee_data');
    
    if (!token || !employeeData) {
      navigate('/employee');
      return;
    }
    
    setEmployee(JSON.parse(employeeData));
    setLoading(false);
    
    // Fetch sheets and metadata
    fetchSheets();
    fetchExamMetadata();
    fetchCbseData();
    fetchBooks();
  }, [navigate]);

  const getAuthHeaders = () => ({
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('employee_token')}`
    }
  });

  const fetchSheets = async () => {
    setLoadingSheets(true);
    try {
      const response = await axios.get(`${API_URL}/api/employee/sheets`, getAuthHeaders());
      if (response.data.success) {
        setSheets(response.data.sheets || []);
      }
    } catch (error) {
      console.error('Error fetching sheets:', error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoadingSheets(false);
    }
  };

  const fetchExamMetadata = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/exam-structure/metadata`);
      if (response.data.success) {
        setExamMetadata({
          loaded: true,
          exams: response.data.exams || [],
          syllabusTopicsMap: response.data.syllabus_topics || {},
          subjectsMap: response.data.subjects || {},
          subTopicsMap: response.data.sub_topics || {}
        });
      }
    } catch (error) {
      console.error('Error fetching exam metadata:', error);
    }
  };

  const fetchCbseData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/cbse-data/admin/class-subjects`);
      if (response.data.success) {
        setCbseClassSubjects(response.data.class_subjects || {});
      }
    } catch (error) {
      console.error('Error fetching CBSE data:', error);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/books`);
      if (response.data.books) {
        setBooks(response.data.books || []);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('employee_token');
    localStorage.removeItem('employee_data');
    navigate('/employee');
  };

  const handleAddSheet = async () => {
    setSaving(true);
    
    try {
      let sheetData = {};
      
      if (selectedOption === 'exam') {
        if (!examForm.exam_name || !examForm.subject || !examForm.sheet_link) {
          alert('Please fill in required fields: Exam, Subject, and Sheet Link');
          setSaving(false);
          return;
        }
        sheetData = {
          type: 'exam',
          exam_name: examForm.exam_name,
          syllabus_topic: examForm.syllabus_topic,
          subject: examForm.subject,
          sub_topic: examForm.sub_topic,
          sheet_link: examForm.sheet_link
        };
      } else if (selectedOption === 'class') {
        if (!classForm.class_name || !classForm.subject || !classForm.sheet_link) {
          alert('Please fill in required fields: Class, Subject, and Sheet Link');
          setSaving(false);
          return;
        }
        sheetData = {
          type: 'class',
          class_name: classForm.class_name,
          subject: classForm.subject,
          chapter: classForm.chapter,
          sheet_link: classForm.sheet_link
        };
      } else if (selectedOption === 'book') {
        if (!bookForm.book_name || !bookForm.sheet_link) {
          alert('Please fill in required fields: Book Name and Sheet Link');
          setSaving(false);
          return;
        }
        sheetData = {
          type: 'book',
          book_name: bookForm.book_name,
          chapter_name: bookForm.chapter_name,
          sheet_link: bookForm.sheet_link
        };
      }

      const response = await axios.post(
        `${API_URL}/api/employee/sheets/add`,
        sheetData,
        getAuthHeaders()
      );

      if (response.data.success) {
        alert('Sheet added successfully!');
        setShowAddForm(false);
        resetForms();
        fetchSheets();
      }
    } catch (error) {
      console.error('Error adding sheet:', error);
      alert(error.response?.data?.detail || 'Failed to add sheet');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSheet = async (sheetId) => {
    if (!window.confirm('Are you sure you want to delete this sheet?')) return;

    try {
      const response = await axios.delete(
        `${API_URL}/api/employee/sheets/${sheetId}`,
        getAuthHeaders()
      );

      if (response.data.success) {
        fetchSheets();
      }
    } catch (error) {
      console.error('Error deleting sheet:', error);
      alert(error.response?.data?.detail || 'Failed to delete sheet');
    }
  };

  const resetForms = () => {
    setExamForm({ exam_name: '', syllabus_topic: '', subject: '', sub_topic: '', sheet_link: '' });
    setClassForm({ class_name: '', subject: '', chapter: '', sheet_link: '' });
    setBookForm({ book_name: '', chapter_name: '', sheet_link: '' });
  };

  const filteredSheets = sheets.filter(sheet => {
    const query = searchQuery.toLowerCase();
    return (
      sheet.exam_name?.toLowerCase().includes(query) ||
      sheet.subject?.toLowerCase().includes(query) ||
      sheet.class_name?.toLowerCase().includes(query) ||
      sheet.book_name?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900">Employee Portal</h1>
                <p className="text-xs text-slate-500">{employee?.name} • {employee?.employee_id}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{sheets.length}</p>
                <p className="text-xs text-slate-500">Total Sheets</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {sheets.filter(s => s.added_by?.id === employee?.id).length}
                </p>
                <p className="text-xs text-slate-500">My Sheets</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 truncate">{employee?.role || 'Employee'}</p>
                <p className="text-xs text-slate-500">Role</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Active</p>
                <p className="text-xs text-slate-500">Status</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-slate-200 px-4">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('sheets')}
                className={`py-3 px-1 border-b-2 text-sm font-medium transition ${
                  activeTab === 'sheets'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Exam Sheet Manager
                </span>
              </button>
            </div>
          </div>

          {/* Sheet Manager Content */}
          <div className="p-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search sheets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={fetchSheets}
                  className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingSheets ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Sheet</span>
                </button>
              </div>
            </div>

            {/* Add Sheet Form */}
            {showAddForm && (
              <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-4">Add New Sheet</h3>
                
                {/* Option Selector */}
                <div className="flex gap-2 mb-4">
                  {['exam', 'class', 'book'].map((option) => (
                    <button
                      key={option}
                      onClick={() => setSelectedOption(option)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        selectedOption === option
                          ? 'bg-purple-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {option === 'exam' ? 'Exam-based' : option === 'class' ? 'Class-based' : 'Book-based'}
                    </button>
                  ))}
                </div>

                {/* Exam Form */}
                {selectedOption === 'exam' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Exam *</label>
                      <select
                        value={examForm.exam_name}
                        onChange={(e) => setExamForm({...examForm, exam_name: e.target.value, syllabus_topic: '', subject: '', sub_topic: ''})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Exam</option>
                        {examMetadata.exams.map(exam => (
                          <option key={exam} value={exam}>{exam}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Syllabus Topic</label>
                      <select
                        value={examForm.syllabus_topic}
                        onChange={(e) => setExamForm({...examForm, syllabus_topic: e.target.value, subject: '', sub_topic: ''})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={!examForm.exam_name}
                      >
                        <option value="">Select Topic (Optional)</option>
                        {(examMetadata.syllabusTopicsMap[examForm.exam_name] || []).map(topic => (
                          <option key={topic} value={topic}>{topic}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Subject *</label>
                      <select
                        value={examForm.subject}
                        onChange={(e) => setExamForm({...examForm, subject: e.target.value, sub_topic: ''})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={!examForm.exam_name}
                      >
                        <option value="">Select Subject</option>
                        {(examMetadata.subjectsMap[examForm.syllabus_topic || examForm.exam_name] || []).map(subject => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Sub-topic</label>
                      <select
                        value={examForm.sub_topic}
                        onChange={(e) => setExamForm({...examForm, sub_topic: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={!examForm.subject}
                      >
                        <option value="">Select Sub-topic (Optional)</option>
                        {(examMetadata.subTopicsMap[examForm.subject] || []).map(subTopic => (
                          <option key={subTopic} value={subTopic}>{subTopic}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Google Sheet Link *</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="url"
                          value={examForm.sheet_link}
                          onChange={(e) => setExamForm({...examForm, sheet_link: e.target.value})}
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Class Form */}
                {selectedOption === 'class' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Class *</label>
                      <select
                        value={classForm.class_name}
                        onChange={(e) => setClassForm({...classForm, class_name: e.target.value, subject: '', chapter: ''})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Class</option>
                        {classNames.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Subject *</label>
                      <select
                        value={classForm.subject}
                        onChange={(e) => setClassForm({...classForm, subject: e.target.value, chapter: ''})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={!classForm.class_name}
                      >
                        <option value="">Select Subject</option>
                        {(cbseClassSubjects[classForm.class_name] || []).map(subject => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Chapter</label>
                      <input
                        type="text"
                        value={classForm.chapter}
                        onChange={(e) => setClassForm({...classForm, chapter: e.target.value})}
                        placeholder="Enter chapter name"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Google Sheet Link *</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="url"
                          value={classForm.sheet_link}
                          onChange={(e) => setClassForm({...classForm, sheet_link: e.target.value})}
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Book Form */}
                {selectedOption === 'book' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Book Name *</label>
                      <select
                        value={bookForm.book_name}
                        onChange={(e) => setBookForm({...bookForm, book_name: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Book</option>
                        {books.map(book => (
                          <option key={book.id} value={book.title}>{book.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Chapter Name</label>
                      <input
                        type="text"
                        value={bookForm.chapter_name}
                        onChange={(e) => setBookForm({...bookForm, chapter_name: e.target.value})}
                        placeholder="Enter chapter name"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Google Sheet Link *</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="url"
                          value={bookForm.sheet_link}
                          onChange={(e) => setBookForm({...bookForm, sheet_link: e.target.value})}
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => { setShowAddForm(false); resetForms(); }}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSheet}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Sheet
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Sheets Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Type</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Details</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Added By</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingSheets ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Loading sheets...
                        </div>
                      </td>
                    </tr>
                  ) : filteredSheets.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-500">
                        No sheets found. Click "Add Sheet" to get started.
                      </td>
                    </tr>
                  ) : (
                    filteredSheets.map((sheet) => (
                      <tr key={sheet.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            sheet.type === 'exam' ? 'bg-blue-100 text-blue-700' :
                            sheet.type === 'class' ? 'bg-green-100 text-green-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {sheet.type || 'exam'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium text-slate-900">
                            {sheet.exam_name || sheet.class_name || sheet.book_name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {sheet.subject && `${sheet.subject}`}
                            {sheet.syllabus_topic && ` • ${sheet.syllabus_topic}`}
                            {sheet.chapter && ` • ${sheet.chapter}`}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-slate-600">
                            {sheet.added_by?.name || 'Admin'}
                          </div>
                          <div className="text-xs text-slate-400">
                            {sheet.added_by?.type === 'employee' ? 'Employee' : 'Admin'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-500">
                          {sheet.created_at ? new Date(sheet.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={sheet.sheet_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            {(sheet.added_by?.id === employee?.id || employee?.role === 'admin') && (
                              <button
                                onClick={() => handleDeleteSheet(sheet.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
