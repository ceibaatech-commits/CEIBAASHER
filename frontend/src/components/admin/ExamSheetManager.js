import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileSpreadsheet, Plus, Edit, Trash2, ExternalLink, 
  Search, Filter, Download, Upload, CheckCircle, XCircle,
  ChevronDown, AlertCircle, RefreshCw, Save, Link as LinkIcon
} from 'lucide-react';
import { SheetListTable } from './SheetListTable';
import { syllabusTopicsMap, subjectsMap, subTopicsMap } from './examDataMaps';
import ManualQuestionForm from './ManualQuestionForm';

const BACKEND_URL = window.location.origin;

const ExamSheetManager = () => {
  const [selectedOption, setSelectedOption] = useState('exam'); // 'exam', 'class', or 'book'
  const [showAddForm, setShowAddForm] = useState(false);
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form data for Option 1: Exam-based
  const [examForm, setExamForm] = useState({
    exam_name: '',
    syllabus_topic: '',
    subject: '',
    sub_topic: '',
    sheet_link: ''
  });

  const [inputMethod, setInputMethod] = useState('sheet');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [extracting, setExtracting] = useState(false);

  // Manual question entry state
  const [manualQuestion, setManualQuestion] = useState({
    question: '',
    question_image: null,
    question_image_preview: null,
    options: ['', '', '', ''],
    option_images: [null, null, null, null],
    option_image_previews: [null, null, null, null],
    correctAnswer: 0,
    explanation: ''
  });
  const [uploadingQuestionImage, setUploadingQuestionImage] = useState(false);
  const [uploadingOptionImage, setUploadingOptionImage] = useState(-1);

  // Dynamic exam metadata from backend (auto-sync!)
  const [examMetadata, setExamMetadata] = useState({
    loaded: false,
    exams: [],
    syllabusTopicsMap: {},
    subjectsMap: {},
    subTopicsMap: {}
  });

  // Form data for Option 2: Class-based
  const [classForm, setClassForm] = useState({
    board: 'cbse',
    class_name: '',
    subject: '',
    chapter: '',
    sheet_link: ''
  });

  // Form data for Option 3: Book-based
  const [bookForm, setBookForm] = useState({
    book_name: '',
    chapter_name: '',
    sheet_link: ''
  });

  const [books, setBooks] = useState([]);
  
  // CBSE Data from API (Single Source of Truth)
  const [cbseClassSubjects, setCbseClassSubjects] = useState({});
  const [loadingCbseData, setLoadingCbseData] = useState(true);

  // Fetch board-specific class data from centralized API
  useEffect(() => {
    const fetchCbseData = async () => {
      try {
        setLoadingCbseData(true);
        const response = await axios.get(`${BACKEND_URL}/api/cbse-data/admin/class-subjects?board=${classForm.board}`);
        if (response.data.success) {
          setCbseClassSubjects(response.data.class_subjects);
        }
      } catch (error) {
        console.error('Error fetching board data:', error);
      } finally {
        setLoadingCbseData(false);
      }
    };
    fetchCbseData();
  }, [classForm.board]);

  // Class names for dropdowns
  const classNames = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11 (Science)', 'Class 11 (Commerce)', 'Class 11 (Humanities)', 'Class 12 (Science)', 'Class 12 (Commerce)', 'Class 12 (Humanities)'];
  
  /*
   * ══════════════════════════════════════════════════════════════════════════════
   * 📋 EXAM DATA SYSTEM - SINGLE SOURCE OF TRUTH
   * ══════════════════════════════════════════════════════════════════════════════
   * 
   * HOW TO ADD A NEW EXAM:
   * 1. Add the exam to /app/backend/exam_data.py in the EXAM_DATA dictionary
   * 2. That's it! The system will automatically:
   *    - Show it on the frontend homepage (via /api/quiz/exams)
   *    - Show it in this Admin panel (via /api/exam-metadata)
   *    - Include all syllabus topics, subjects, and sub-topics
   * 
   * The backend API /api/exam-metadata serves as the SINGLE SOURCE OF TRUTH.
   * The static arrays below are FALLBACKS only (used if API fails to load).
   * 
   * To add a new category to the homepage, also update:
   *    - /app/frontend/src/pages/Home.js - Add category to 'categories' array
   *    - /app/frontend/src/pages/Home.js - Add category section in desktop view
   * 
   * ══════════════════════════════════════════════════════════════════════════════
   */
  
  // STATIC FALLBACK: Used only if /api/exam-metadata fails to load
  const examNames = [
    // CBSE Classes
    ...classNames,
    
    // Engineering & Medical
    'JEE',
    'NEET',
    'GATE',
    'NATA',
    
    // UPSC & Defense
    'UPSC',
    'NDA',
    'Agniveer',
    'CDS',
    'CAPF',
    'IES_ISS',
    'EPFO',
    
    // Banking & Finance
    'IBPS_PO',
    'IBPS_CLERK',
    'IBPS_SO',
    'IBPS_RRB_PO',
    'SBI_PO',
    'SBI_CLERK',
    'RBI_GRADE_B',
    'NABARD',
    'LIC_AAO',
    'LIC_ADO',
    
    // SSC
    'SSC_CGL',
    'SSC_CHSL',
    'SSC_GD',
    'SSC_STENO',
    
    // Teaching
    'DSSB_PGT',
    'DSSB_TGT',
    'KVS_PRT',
    'CTET',
    'MPSET',
    'TS_SET',
    'UP_TGT',
    'UP_PGT',
    'HTET',
    
    // Railways & Defense
    'RRB_NTPC',
    'AFCAT',
    
    // Management & Law
    'CAT',
    'CLAT',
    'GMAT',
    'CUET',
    'UGC_NET',
    
    // Agriculture
    'Agriculture',
    
    // State Exams
    'RPSC',
    
    // RSMSSB (Rajasthan)
    'RSMSSB_Patwari',
    
    // Language Proficiency
    'SPANISH',
    'FRENCH',
    'TAMIL',
    'TELUGU',
    'KANNADA',
    'CHINESE',
    'JAPANESE',
    'KOREAN'
  ];

  // FIXED: Match exam IDs from exam_data.py exactly

  const [syllabusTopics, setSyllabusTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subTopics, setSubTopics] = useState([]);
  const [chapters, setChapters] = useState([]);

  useEffect(() => {
    fetchSheets();
    fetchExamMetadata(); // Load dynamic metadata from backend
  }, []);

  // Fetch exam metadata dynamically from backend
  const fetchExamMetadata = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/exam-metadata`);
      setExamMetadata({
        loaded: true,
        exams: response.data.exams || [],
        syllabusTopicsMap: response.data.syllabusTopicsMap || {},
        subjectsMap: response.data.subjectsMap || {},
        subTopicsMap: response.data.subTopicsMap || {}
      });
      console.log('✅ Exam metadata loaded dynamically from backend');
    } catch (error) {
      console.warn('⚠️ Failed to load exam metadata dynamically, using static fallback:', error);
      setExamMetadata({ loaded: false, exams: [], syllabusTopicsMap: {}, subjectsMap: {}, subTopicsMap: {} });
    }
  };

  useEffect(() => {
    // Update syllabus topics based on exam selection
    if (examForm.exam_name) {
      // Use dynamic data first, fallback to static
      const topicsMap = examMetadata.loaded ? examMetadata.syllabusTopicsMap : syllabusTopicsMap;
      setSyllabusTopics(topicsMap[examForm.exam_name] || []);
      // Reset dependent fields
      setExamForm(prev => ({
        ...prev,
        syllabus_topic: '',
        subject: '',
        sub_topic: ''
      }));
      setSubjects([]);
      setSubTopics([]);
    }
  // eslint-disable-next-line
  }, [examForm.exam_name, examMetadata.loaded]);

  useEffect(() => {
    // Update subjects based on syllabus topic
    if (examForm.syllabus_topic) {
      // Use dynamic data first, fallback to static
      const subjMap = examMetadata.loaded ? examMetadata.subjectsMap : subjectsMap;
      setSubjects(subjMap[examForm.syllabus_topic] || []);
      // Reset dependent fields
      setExamForm(prev => ({
        ...prev,
        subject: '',
        sub_topic: ''
      }));
      setSubTopics([]);
    }
  // eslint-disable-next-line
  }, [examForm.syllabus_topic, examMetadata.loaded]);

  useEffect(() => {
    // Update sub-topics based on subject
    if (examForm.subject) {
      // Use dynamic data first, fallback to static
      const subTopMap = examMetadata.loaded ? examMetadata.subTopicsMap : subTopicsMap;
      setSubTopics(subTopMap[examForm.subject] || []);
      // Reset dependent fields
      setExamForm(prev => ({
        ...prev,
        sub_topic: ''
      }));
    }
  // eslint-disable-next-line
  }, [examForm.subject, examMetadata.loaded]);

  useEffect(() => {
    // Update chapters based on class and subject - Using CBSE API as Single Source of Truth
    if (classForm.class_name && classForm.subject) {
      // Use chapters from centralized CBSE API data (Single Source of Truth)
      if (cbseClassSubjects[classForm.class_name] && cbseClassSubjects[classForm.class_name][classForm.subject]) {
        const chapters = cbseClassSubjects[classForm.class_name][classForm.subject];
        setChapters(chapters);
        console.log(`✅ Loaded ${chapters.length} chapters for ${classForm.class_name} - ${classForm.subject} from API`);
      } else {
        // No chapters found - likely API data not loaded yet or subject doesn't exist
        setChapters([]);
        console.log(`⚠️ No chapters found for ${classForm.class_name} - ${classForm.subject} in API data`);
      }
      
      // Reset chapter when subject changes
      setClassForm(prev => ({
        ...prev,
        chapter: ''
      }));
    }
  }, [classForm.class_name, classForm.subject, classForm.board, cbseClassSubjects]);

  // Legacy hardcoded data removed - now using centralized CBSE API as Single Source of Truth
  // This ensures chapter names in admin panel match exactly with quiz page
  // Legacy hardcoded chapter data has been removed to fix data inconsistency bugs.
  // All chapter data is now fetched from /api/cbse-data/admin/class-subjects API
  // Data source: /app/backend/cbse_master_data.py (Single Source of Truth)
  const fetchSheets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/admin/sheets`);
      if (response.data.success) {
        setSheets(response.data.sheets);
      }
    } catch (error) {
      console.error('Error fetching sheets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Upload question image
  const handleQuestionImageUpload = async (file) => {
    if (!file) return;
    
    setUploadingQuestionImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(
        `${BACKEND_URL}/api/question-images/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      
      if (response.data.success) {
        setManualQuestion(prev => ({
          ...prev,
          question_image: response.data.image_url,
          question_image_preview: URL.createObjectURL(file)
        }));
      }
    } catch (error) {
      console.error('Error uploading question image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingQuestionImage(false);
    }
  };

  // Upload option image
  const handleOptionImageUpload = async (file, index) => {
    if (!file) return;
    
    setUploadingOptionImage(index);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(
        `${BACKEND_URL}/api/question-images/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      
      if (response.data.success) {
        const newOptionImages = [...manualQuestion.option_images];
        const newOptionPreviews = [...manualQuestion.option_image_previews];
        newOptionImages[index] = response.data.image_url;
        newOptionPreviews[index] = URL.createObjectURL(file);
        
        setManualQuestion(prev => ({
          ...prev,
          option_images: newOptionImages,
          option_image_previews: newOptionPreviews
        }));
      }
    } catch (error) {
      console.error('Error uploading option image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingOptionImage(-1);
    }
  };

  // Remove question image
  const removeQuestionImage = () => {
    setManualQuestion(prev => ({
      ...prev,
      question_image: null,
      question_image_preview: null
    }));
  };

  // Remove option image
  const removeOptionImage = (index) => {
    const newOptionImages = [...manualQuestion.option_images];
    const newOptionPreviews = [...manualQuestion.option_image_previews];
    newOptionImages[index] = null;
    newOptionPreviews[index] = null;
    
    setManualQuestion(prev => ({
      ...prev,
      option_images: newOptionImages,
      option_image_previews: newOptionPreviews
    }));
  };

  // Submit manual question
  const handleManualQuestionSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (!manualQuestion.question.trim()) {
      alert('Please enter a question');
      return;
    }
    
    const filledOptions = manualQuestion.options.filter(opt => opt.trim() || manualQuestion.option_images[manualQuestion.options.indexOf(opt)]);
    if (filledOptions.length < 2) {
      alert('Please enter at least 2 options');
      return;
    }
    
    // Build question document
    const questionDoc = {
      question: manualQuestion.question,
      question_image: manualQuestion.question_image,
      options: manualQuestion.options.map((opt, idx) => {
        if (manualQuestion.option_images[idx]) {
          return { text: opt, image: manualQuestion.option_images[idx] };
        }
        return opt;
      }),
      correctAnswer: String.fromCharCode(65 + manualQuestion.correctAnswer),
      explanation: manualQuestion.explanation
    };
    
    // Add categorization based on selected option
    if (selectedOption === 'class') {
      questionDoc.type = 'class';
      questionDoc.class_name = classForm.class_name;
      questionDoc.board = classForm.board;
      questionDoc.subject = classForm.subject;
      questionDoc.chapter = classForm.chapter;
    } else if (selectedOption === 'exam') {
      questionDoc.type = 'exam';
      questionDoc.exam_name = examMetadata.exams.find(e => e.id === examForm.exam_name)?.name || examForm.exam_name;
      questionDoc.syllabus_topic = examForm.syllabus_topic;
      questionDoc.subject = examForm.subject;
      questionDoc.sub_topic = examForm.sub_topic;
    }
    
    try {
      setLoading(true);
      const response = await axios.post(`${BACKEND_URL}/api/admin/add-question`, questionDoc);
      
      if (response.data.success) {
        alert('✅ Question added successfully!');
        // Reset form
        setManualQuestion({
          question: '',
          question_image: null,
          question_image_preview: null,
          options: ['', '', '', ''],
          option_images: [null, null, null, null],
          option_image_previews: [null, null, null, null],
          correctAnswer: 0,
          explanation: ''
        });
      }
    } catch (error) {
      console.error('Error adding question:', error);
      alert(error.response?.data?.detail || 'Failed to add question');
    } finally {
      setLoading(false);
    }
  };

  const handleImageExtraction = async (e) => {
    e.preventDefault();
    
    if (!selectedImage) {
      alert('Please select an image');
      return;
    }

    if (selectedOption === 'exam' && (!examForm.exam_name || !examForm.syllabus_topic)) {
      alert('Please select Exam Name and Syllabus Topic');
      return;
    }

    setExtracting(true);
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('image', selectedImage);
      
      if (selectedOption === 'exam') {
        formDataToSend.append('exam_id', examForm.exam_name);
        formDataToSend.append('exam_name', examMetadata.exams.find(e => e.id === examForm.exam_name)?.name || examForm.exam_name);
        formDataToSend.append('syllabus_topic', examForm.syllabus_topic);
        formDataToSend.append('subject', examForm.subject || examForm.syllabus_topic);
        if (examForm.sub_topic) {
          formDataToSend.append('sub_topic', examForm.sub_topic);
        }
      }

      const response = await axios.post(
        `${BACKEND_URL}/api/extract-questions-from-image`,
        formDataToSend,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data.success) {
        alert(`✅ Successfully extracted and saved ${response.data.questions_count} questions!`);
        setShowAddForm(false);
        setSelectedImage(null);
        setImagePreview(null);
        setExamForm({ exam_name: '', syllabus_topic: '', subject: '', sub_topic: '', sheet_link: '' });
        fetchSheets();
      }
    } catch (error) {
      console.error('Error extracting questions:', error);
      alert(error.response?.data?.detail || 'Failed to extract questions from image');
    } finally {
      setExtracting(false);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (inputMethod === 'image') {
      return handleImageExtraction(e);
    }
    
    const formData = selectedOption === 'exam' ? {
      type: 'exam',
      ...examForm
    } : {
      type: 'class',
      ...classForm
    };

    // Validate Google Sheet link
    if (!formData.sheet_link.includes('docs.google.com/spreadsheets')) {
      alert('Please enter a valid Google Sheets link');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${BACKEND_URL}/api/admin/sheets`, formData);
      
      if (response.data.success) {
        const questionsCount = response.data.questions_imported || 0;
        
        if (questionsCount > 0) {
          alert(`✅ Sheet added successfully!\n\n${questionsCount} questions imported automatically.`);
        } else if (response.data.warning) {
          alert(`⚠️ ${response.data.message}\n\n${response.data.warning}\n\nPlease check:\n1. Sheet is publicly accessible\n2. Sheet has correct format (Question, A, B, C, D, Answer columns)\n3. Data starts from row 2`);
        } else if (response.data.error) {
          alert(`⚠️ Sheet added but import failed:\n\n${response.data.error}\n\nYou can click the Import button to try again.`);
        } else {
          alert('Sheet added! Click Import button to load questions.');
        }
        
        setShowAddForm(false);
        resetForm();
        fetchSheets();
      }
    } catch (error) {
      console.error('Error adding sheet:', error);
      const errorMsg = error.response?.data?.detail || error.message;
      alert(`Failed to add sheet:\n\n${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setExamForm({
      exam_name: '',
      syllabus_topic: '',
      subject: '',
      sub_topic: '',
      sheet_link: ''
    });
    setClassForm({
      board: 'cbse',
      class_name: '',
      subject: '',
      chapter: '',
      sheet_link: ''
    });
  };

  const handleImport = async (sheetId) => {
    if (!window.confirm('Import/Re-import questions from this sheet? This will replace existing questions.')) return;

    try {
      setLoading(true);
      const response = await axios.post(`${BACKEND_URL}/api/admin/sheets/${sheetId}/import`);
      
      if (response.data.success) {
        alert(`✅ Successfully imported ${response.data.imported} questions!`);
        fetchSheets();
      } else {
        alert(`❌ Import failed: ${response.data.message || response.data.error}`);
      }
    } catch (error) {
      console.error('Error importing questions:', error);
      alert(`Failed to import questions: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSheet = async (sheetId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/admin/sheets/${sheetId}/test`);
      
      if (response.data.success) {
        const { sheet_id, row_count, question_count, preview, sample_questions } = response.data;
        
        let message = `✅ Sheet is accessible!\n\n`;
        message += `Sheet ID: ${sheet_id}\n`;
        message += `Total Rows: ${row_count}\n`;
        message += `Questions Found: ${question_count}\n\n`;
        
        if (sample_questions && sample_questions.length > 0) {
          message += `Sample Questions:\n`;
          sample_questions.forEach((q, idx) => {
            message += `\n${idx + 1}. ${q.question.substring(0, 100)}...\n`;
          });
        }
        
        alert(message);
      } else {
        alert(`❌ Sheet test failed: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Error testing sheet:', error);
      alert(`Failed to test sheet: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sheetId) => {
    if (!window.confirm('Are you sure you want to delete this sheet and all its questions?')) return;

    try {
      await axios.delete(`${BACKEND_URL}/api/admin/sheets/${sheetId}`);
      alert('Sheet deleted successfully!');
      fetchSheets();
    } catch (error) {
      console.error('Error deleting sheet:', error);
      alert('Failed to delete sheet.');
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exam Sheet Manager</h2>
          <p className="text-gray-500 text-sm mt-1">Manage question sheets with Google Sheets integration</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Sheet</span>
        </button>
      </div>

      {/* Add Sheet Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Question Sheet</h3>
          
          {/* Option Selector */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Sheet Type
            </label>
            <div className="flex space-x-4">
              <button
                onClick={() => setSelectedOption('exam')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  selectedOption === 'exam'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <FileSpreadsheet className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold">Competitive Exams</p>
                  <p className="text-xs text-gray-500 mt-1">NEET, JEE, UPSC, etc.</p>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedOption('class')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  selectedOption === 'class'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <FileSpreadsheet className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold">School Classes</p>
                  <p className="text-xs text-gray-500 mt-1">Class 6-12</p>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* OPTION 1: Exam-based Form */}
            {selectedOption === 'exam' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Exam Name - DYNAMIC: Uses backend API data when available */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Exam Name *
                    </label>
                    <select
                      required
                      value={examForm.exam_name}
                      onChange={(e) => setExamForm({ ...examForm, exam_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Exam</option>
                      {/* Priority: Dynamic API data > Static fallback */}
                      {(examMetadata.loaded && examMetadata.exams.length > 0 
                        ? [...classNames, ...examMetadata.exams.filter(e => !classNames.includes(e.name)).map(e => e.id)]
                        : examNames
                      ).map(exam => (
                        <option key={exam} value={exam}>{exam}</option>
                      ))}
                    </select>
                  </div>

                  {/* Syllabus Topic */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Syllabus Topic *
                    </label>
                    <select
                      required
                      value={examForm.syllabus_topic}
                      onChange={(e) => setExamForm({ ...examForm, syllabus_topic: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!examForm.exam_name}
                    >
                      <option value="">Select Syllabus Topic</option>
                      {syllabusTopics.map(topic => (
                        <option key={topic} value={topic}>{topic}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subject *
                    </label>
                    <select
                      required
                      value={examForm.subject}
                      onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!examForm.syllabus_topic}
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sub Topic */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sub Topic (Optional)
                    </label>
                    <select
                      value={examForm.sub_topic}
                      onChange={(e) => setExamForm({ ...examForm, sub_topic: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!examForm.subject}
                    >
                      <option value="">Select Sub Topic (Optional)</option>
                      {subTopics.map(topic => (
                        <option key={topic} value={topic}>{topic}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* OPTION 2: Class-based Form */}
            {selectedOption === 'class' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Board */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Board *
                    </label>
                    <select
                      required
                      value={classForm.board}
                      onChange={(e) => setClassForm({ ...classForm, board: e.target.value, class_name: '', subject: '', chapter: '' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="cbse">CBSE</option>
                      <option value="rbse">Rajasthan Board (RBSE)</option>
                      <option value="hbse">Haryana Board (HBSE)</option>
                      <option value="upboard">UP Board (UPMSP)</option>
                      <option value="bseb">Bihar Board (BSEB)</option>
                      <option value="mpbse">MP Board (MPBSE)</option>
                    </select>
                  </div>

                  {/* Class Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Class Name *
                    </label>
                    <select
                      required
                      value={classForm.class_name}
                      onChange={(e) => setClassForm({ ...classForm, class_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select Class</option>
                      {classNames.map(className => (
                        <option key={className} value={className}>{className}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subject - Dynamic from CBSE API */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subject *
                    </label>
                    <select
                      required
                      value={classForm.subject}
                      onChange={(e) => setClassForm({ ...classForm, subject: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled={!classForm.class_name || loadingCbseData}
                    >
                      <option value="">{loadingCbseData ? 'Loading subjects...' : 'Select Subject'}</option>
                      {classForm.class_name && cbseClassSubjects[classForm.class_name] && 
                        Object.keys(cbseClassSubjects[classForm.class_name]).map((subject) => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))
                      }
                      {/* Fallback for Class 9 if API not loaded */}
                      {classForm.class_name === 'Class 9' && !cbseClassSubjects['Class 9'] && (
                        <>
                          <option value="Mathematics">Mathematics</option>
                          <option value="Science">Science</option>
                          <option value="Hindi">Hindi</option>
                          <option value="English">English</option>
                          <option value="Social Science">Social Science</option>
                          <option value="Geography">Geography</option>
                          <option value="History">History</option>
                          <option value="Political Science">Political Science</option>
                          <option value="Economics">Economics</option>
                          <option value="Sanskrit">Sanskrit</option>
                        </>
                      )}
                      {/* Fallback for Class 10 if API not loaded */}
                      {classForm.class_name === 'Class 10' && !cbseClassSubjects['Class 10'] && (
                        <>
                          <option value="Mathematics">Mathematics</option>
                          <option value="Science">Science</option>
                          <option value="Hindi">Hindi</option>
                          <option value="English">English</option>
                          <option value="Social Science">Social Science</option>
                          <option value="Geography">Geography</option>
                          <option value="History">History</option>
                          <option value="Political Science">Political Science</option>
                          <option value="Economics">Economics</option>
                          <option value="Sanskrit">Sanskrit</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Chapter */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Chapter *
                    </label>
                    <select
                      required
                      value={classForm.chapter}
                      onChange={(e) => setClassForm({ ...classForm, chapter: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled={!classForm.subject}
                    >
                      <option value="">Select Chapter</option>
                      {chapters.map(chapter => (
                        <option key={chapter} value={chapter}>{chapter}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Input Method Selection */}
            <div className="flex gap-3 mb-4">
              <button
                type="button"
                onClick={() => {setInputMethod('sheet'); setSelectedImage(null); setImagePreview(null);}}
                className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition ${inputMethod === 'sheet' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                📊 Google Sheet
              </button>
              <button
                type="button"
                onClick={() => setInputMethod('image')}
                className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition ${inputMethod === 'image' ? 'bg-purple-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                🖼️ Extract from Image
              </button>
              <button
                type="button"
                onClick={() => setInputMethod('manual')}
                className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition ${inputMethod === 'manual' ? 'bg-green-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                ✏️ Manual Entry
              </button>
            </div>

            {inputMethod === 'manual' ? (
              <ManualQuestionForm
                manualQuestion={manualQuestion}
                setManualQuestion={setManualQuestion}
                uploadingQuestionImage={uploadingQuestionImage}
                uploadingOptionImage={uploadingOptionImage}
                handleQuestionImageUpload={handleQuestionImageUpload}
                removeQuestionImage={removeQuestionImage}
                handleOptionImageUpload={handleOptionImageUpload}
                removeOptionImage={removeOptionImage}
                handleManualQuestionSubmit={handleManualQuestionSubmit}
                loading={loading}
              />
            ) : inputMethod === 'sheet' ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Google Sheet Public Link *
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    required={inputMethod === 'sheet'}
                    value={selectedOption === 'exam' ? examForm.sheet_link : classForm.sheet_link}
                    onChange={(e) => {
                      if (selectedOption === 'exam') {
                        setExamForm({ ...examForm, sheet_link: e.target.value });
                      } else {
                        setClassForm({ ...classForm, sheet_link: e.target.value });
                      }
                    }}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Make sure the Google Sheet is publicly accessible (Anyone with the link can view)
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload Question Image *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setSelectedImage(file);
                        const reader = new FileReader();
                        reader.onloadend = () => setImagePreview(reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="question-image-upload"
                  />
                  <label htmlFor="question-image-upload" className="cursor-pointer">
                    {imagePreview ? (
                      <div>
                        <img src={imagePreview} alt="Preview" className="max-h-80 mx-auto rounded-lg shadow mb-3" />
                        <p className="text-sm text-gray-600">{selectedImage?.name}</p>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <Upload className="w-12 h-12 mx-auto mb-3 text-purple-500" />
                        <p className="text-lg font-semibold mb-1">Click to upload question image</p>
                        <p className="text-sm">PNG, JPG, JPEG supported (Max 10MB)</p>
                        <p className="text-xs text-gray-400 mt-2">AI will extract questions, options, answers & explanations</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            )}

            {/* Form Actions - Only show for sheet and image methods */}
            {inputMethod !== 'manual' && (
              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading || extracting}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {extracting ? 'Extracting Questions...' : loading ? 'Saving...' : inputMethod === 'image' ? 'Extract & Save Questions' : 'Save Sheet'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Sheet List — extracted component */}
      <SheetListTable
        sheets={sheets}
        loading={loading}
        onRefresh={fetchSheets}
        onImport={handleImport}
        onTestSheet={handleTestSheet}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default ExamSheetManager;
