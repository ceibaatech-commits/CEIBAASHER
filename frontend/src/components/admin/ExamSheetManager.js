import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileSpreadsheet, Plus, Edit, Trash2, ExternalLink, 
  Search, Filter, Download, Upload, CheckCircle, XCircle,
  ChevronDown, AlertCircle, RefreshCw, Save, Link as LinkIcon
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ExamSheetManager = () => {
  const [selectedOption, setSelectedOption] = useState('exam'); // 'exam' or 'class'
  const [showAddForm, setShowAddForm] = useState(false);
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form data for Option 1: Exam-based
  const [examForm, setExamForm] = useState({
    exam_name: '',
    syllabus_topic: '',
    subject: '',
    sub_topic: '',
    sub_sub_topic: '',
    sheet_link: ''
  });

  // Form data for Option 2: Class-based
  const [classForm, setClassForm] = useState({
    class_name: '',
    subject: '',
    chapter: '',
    sheet_link: ''
  });

  // Comprehensive dropdown data
  const examNames = ['NEET', 'JEE Main', 'JEE Advanced', 'UPSC CSE', 'UPSC NDA', 'SSC CGL', 'SSC CHSL', 'IBPS PO', 'IBPS Clerk', 'RRB NTPC', 'GATE', 'CAT', 'CLAT', 'AIIMS', 'JIPMER'];
  const classNames = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

  // Comprehensive syllabus topics map
  const syllabusTopicsMap = {
    'NEET': ['Physics', 'Chemistry', 'Biology'],
    'JEE Main': ['Physics', 'Chemistry', 'Mathematics'],
    'JEE Advanced': ['Physics', 'Chemistry', 'Mathematics'],
    'UPSC CSE': ['General Studies Paper 1', 'General Studies Paper 2', 'General Studies Paper 3', 'General Studies Paper 4', 'Optional Subject', 'Essay'],
    'UPSC NDA': ['Mathematics', 'General Ability Test'],
    'SSC CGL': ['General Intelligence', 'General Awareness', 'Quantitative Aptitude', 'English Comprehension'],
    'SSC CHSL': ['General Intelligence', 'General Awareness', 'Quantitative Aptitude', 'English Language'],
    'IBPS PO': ['Reasoning Ability', 'English Language', 'Quantitative Aptitude', 'General Awareness', 'Computer Knowledge'],
    'IBPS Clerk': ['Reasoning Ability', 'English Language', 'Quantitative Aptitude', 'General Awareness', 'Computer Knowledge'],
    'RRB NTPC': ['General Awareness', 'Mathematics', 'General Intelligence'],
    'GATE': ['Engineering Mathematics', 'General Aptitude', 'Technical Subject'],
    'CAT': ['Verbal Ability', 'Data Interpretation', 'Logical Reasoning', 'Quantitative Aptitude'],
    'CLAT': ['English Language', 'Current Affairs', 'Legal Reasoning', 'Logical Reasoning', 'Quantitative Techniques'],
    'AIIMS': ['Physics', 'Chemistry', 'Biology', 'General Knowledge'],
    'JIPMER': ['Physics', 'Chemistry', 'Biology', 'English']
  };

  // Comprehensive subjects map
  const subjectsMap = {
    // Science subjects
    'Physics': ['Mechanics', 'Thermodynamics', 'Optics', 'Electromagnetism', 'Modern Physics', 'Waves', 'Sound', 'Electricity'],
    'Chemistry': ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry'],
    'Biology': ['Botany', 'Zoology', 'Ecology', 'Genetics', 'Evolution', 'Human Physiology'],
    'Mathematics': ['Algebra', 'Calculus', 'Coordinate Geometry', 'Trigonometry', 'Statistics', 'Probability', 'Vectors', 'Differential Equations'],
    
    // UPSC subjects
    'General Studies Paper 1': ['History', 'Geography', 'Culture', 'Society'],
    'General Studies Paper 2': ['Governance', 'Constitution', 'Polity', 'Social Justice'],
    'General Studies Paper 3': ['Economy', 'Environment', 'Science & Technology', 'Security'],
    'General Studies Paper 4': ['Ethics', 'Integrity', 'Aptitude'],
    'Optional Subject': ['History', 'Geography', 'Political Science', 'Sociology', 'Public Administration'],
    'Essay': ['Essay Writing', 'Current Affairs Analysis'],
    
    // Aptitude subjects
    'General Ability Test': ['English', 'General Knowledge', 'Physics', 'Chemistry', 'History', 'Geography', 'Current Affairs'],
    'General Intelligence': ['Verbal Reasoning', 'Non-Verbal Reasoning', 'Analytical Reasoning'],
    'General Awareness': ['Current Affairs', 'Static GK', 'Banking Awareness', 'Economics'],
    'Quantitative Aptitude': ['Arithmetic', 'Algebra', 'Geometry', 'Data Interpretation', 'Number System'],
    'English Comprehension': ['Reading Comprehension', 'Grammar', 'Vocabulary', 'Sentence Formation'],
    'English Language': ['Grammar', 'Vocabulary', 'Comprehension', 'Error Detection'],
    'Reasoning Ability': ['Puzzles', 'Seating Arrangement', 'Syllogism', 'Coding-Decoding'],
    'Computer Knowledge': ['Computer Fundamentals', 'MS Office', 'Internet', 'Networking'],
    
    // CAT subjects
    'Verbal Ability': ['Reading Comprehension', 'Para Jumbles', 'Grammar', 'Vocabulary'],
    'Data Interpretation': ['Tables', 'Graphs', 'Charts', 'Data Analysis'],
    'Logical Reasoning': ['Puzzles', 'Arrangements', 'Blood Relations', 'Direction Sense'],
    
    // CLAT subjects
    'Legal Reasoning': ['Legal Principles', 'Case Studies', 'Legal Maxims'],
    'Current Affairs': ['National Events', 'International Events', 'Sports', 'Awards'],
    'Quantitative Techniques': ['Arithmetic', 'Algebra', 'Data Interpretation'],
    
    // GATE subjects
    'Engineering Mathematics': ['Linear Algebra', 'Calculus', 'Probability', 'Differential Equations'],
    'General Aptitude': ['Verbal Ability', 'Numerical Ability', 'Reasoning'],
    'Technical Subject': ['Core Concepts', 'Advanced Topics', 'Problem Solving']
  };

  // Comprehensive sub-topics map
  const subTopicsMap = {
    // Physics
    'Mechanics': ['Kinematics', 'Laws of Motion', 'Work Energy Power', 'Rotational Motion', 'Gravitation', 'Simple Harmonic Motion', 'Elasticity', 'Fluid Mechanics'],
    'Thermodynamics': ['Heat and Temperature', 'Thermal Expansion', 'Calorimetry', 'Heat Transfer', 'Kinetic Theory', 'Laws of Thermodynamics'],
    'Optics': ['Ray Optics', 'Wave Optics', 'Reflection', 'Refraction', 'Lenses', 'Mirrors', 'Optical Instruments'],
    'Electromagnetism': ['Electrostatics', 'Current Electricity', 'Magnetic Effects', 'Electromagnetic Induction', 'AC Circuits'],
    'Modern Physics': ['Atomic Structure', 'Nuclear Physics', 'Photoelectric Effect', 'Dual Nature', 'Semiconductor Devices'],
    'Waves': ['Wave Motion', 'Sound Waves', 'Doppler Effect', 'Superposition'],
    'Electricity': ['Electric Charge', 'Electric Field', 'Potential', 'Capacitance', 'Current', 'Resistance'],
    
    // Chemistry
    'Physical Chemistry': ['Atomic Structure', 'Chemical Bonding', 'States of Matter', 'Thermodynamics', 'Equilibrium', 'Ionic Equilibrium', 'Redox Reactions', 'Electrochemistry', 'Chemical Kinetics', 'Surface Chemistry'],
    'Organic Chemistry': ['Basic Concepts', 'Hydrocarbons', 'Haloalkanes', 'Alcohols Phenols Ethers', 'Aldehydes Ketones', 'Carboxylic Acids', 'Amines', 'Biomolecules', 'Polymers'],
    'Inorganic Chemistry': ['Periodic Table', 'Chemical Bonding', 'Coordination Compounds', 'Metallurgy', 'p-Block Elements', 'd-Block Elements', 'f-Block Elements'],
    
    // Biology
    'Botany': ['Plant Physiology', 'Plant Anatomy', 'Plant Kingdom', 'Reproduction in Plants', 'Photosynthesis', 'Respiration'],
    'Zoology': ['Animal Kingdom', 'Human Anatomy', 'Animal Physiology', 'Reproduction', 'Circulatory System', 'Nervous System'],
    'Ecology': ['Ecosystem', 'Biodiversity', 'Environmental Issues', 'Conservation'],
    'Genetics': ['Principles of Inheritance', 'Molecular Basis', 'DNA Replication', 'Gene Expression'],
    'Human Physiology': ['Digestion', 'Breathing', 'Circulation', 'Excretion', 'Neural Control'],
    
    // Mathematics
    'Algebra': ['Linear Equations', 'Quadratic Equations', 'Complex Numbers', 'Sequences and Series', 'Binomial Theorem', 'Permutations Combinations'],
    'Calculus': ['Limits', 'Continuity', 'Differentiation', 'Integration', 'Application of Derivatives', 'Differential Equations'],
    'Coordinate Geometry': ['Straight Lines', 'Circles', 'Parabola', 'Ellipse', 'Hyperbola', '3D Geometry'],
    'Trigonometry': ['Trigonometric Functions', 'Identities', 'Equations', 'Inverse Functions', 'Properties of Triangles'],
    'Statistics': ['Mean Median Mode', 'Standard Deviation', 'Probability Distribution', 'Correlation'],
    'Probability': ['Basic Concepts', 'Conditional Probability', 'Bayes Theorem', 'Random Variables'],
    'Vectors': ['Vector Algebra', 'Dot Product', 'Cross Product', 'Scalar Triple Product'],
    
    // Aptitude
    'Arithmetic': ['Number System', 'Percentage', 'Profit Loss', 'Simple Interest', 'Compound Interest', 'Time Work', 'Time Speed Distance', 'Ratio Proportion', 'Average', 'Mixture Alligation'],
    'Verbal Reasoning': ['Analogies', 'Classification', 'Series', 'Coding-Decoding', 'Blood Relations', 'Direction Sense'],
    'Non-Verbal Reasoning': ['Pattern Recognition', 'Figure Series', 'Mirror Images', 'Paper Folding'],
    'Reading Comprehension': ['Passage Reading', 'Inference', 'Main Idea', 'Tone Detection'],
    'Grammar': ['Tenses', 'Articles', 'Prepositions', 'Active Passive Voice', 'Direct Indirect Speech', 'Error Detection'],
    'Vocabulary': ['Synonyms', 'Antonyms', 'Idioms', 'Phrases', 'One Word Substitution'],
    
    // General Knowledge
    'History': ['Ancient History', 'Medieval History', 'Modern History', 'World History', 'Art and Culture'],
    'Geography': ['Physical Geography', 'Indian Geography', 'World Geography', 'Economic Geography'],
    'Static GK': ['Books and Authors', 'Awards', 'Sports', 'Capitals', 'Important Days'],
    'Current Affairs': ['National News', 'International News', 'Economy News', 'Sports News'],
    
    // Computer
    'Computer Fundamentals': ['Hardware', 'Software', 'Memory', 'Input Output Devices', 'Operating Systems'],
    'MS Office': ['Word', 'Excel', 'PowerPoint', 'Outlook'],
    'Internet': ['Browsers', 'Email', 'Search Engines', 'Social Media'],
    'Networking': ['LAN', 'WAN', 'Protocols', 'IP Address']
  };

  const [syllabusTopics, setSyllabusTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subTopics, setSubTopics] = useState([]);
  const [chapters, setChapters] = useState([]);

  useEffect(() => {
    fetchSheets();
  }, []);

  useEffect(() => {
    // Update syllabus topics based on exam selection
    if (examForm.exam_name) {
      setSyllabusTopics(syllabusTopicsMap[examForm.exam_name] || []);
      // Reset dependent fields
      setExamForm(prev => ({
        ...prev,
        syllabus_topic: '',
        subject: '',
        sub_topic: '',
        sub_sub_topic: ''
      }));
      setSubjects([]);
      setSubTopics([]);
    }
  }, [examForm.exam_name]);

  useEffect(() => {
    // Update subjects based on syllabus topic
    if (examForm.syllabus_topic) {
      setSubjects(subjectsMap[examForm.syllabus_topic] || []);
      // Reset dependent fields
      setExamForm(prev => ({
        ...prev,
        subject: '',
        sub_topic: '',
        sub_sub_topic: ''
      }));
      setSubTopics([]);
    }
  }, [examForm.syllabus_topic]);

  useEffect(() => {
    // Update sub-topics based on subject
    if (examForm.subject) {
      setSubTopics(subTopicsMap[examForm.subject] || []);
      // Reset dependent fields
      setExamForm(prev => ({
        ...prev,
        sub_topic: '',
        sub_sub_topic: ''
      }));
    }
  }, [examForm.subject]);

  useEffect(() => {
    // Update chapters based on class and subject
    if (classForm.class_name && classForm.subject) {
      const chaptersMap = {
        'Mathematics': ['Number Systems', 'Algebra', 'Geometry', 'Mensuration', 'Statistics'],
        'Science': ['Physics', 'Chemistry', 'Biology'],
        'English': ['Grammar', 'Literature', 'Composition', 'Comprehension'],
        'Social Science': ['History', 'Geography', 'Civics', 'Economics']
      };
      setChapters(chaptersMap[classForm.subject] || []);
    }
  }, [classForm.class_name, classForm.subject]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
        alert('Sheet added successfully!');
        setShowAddForm(false);
        resetForm();
        fetchSheets();
      }
    } catch (error) {
      console.error('Error adding sheet:', error);
      alert('Failed to add sheet. Please try again.');
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
      sub_sub_topic: '',
      sheet_link: ''
    });
    setClassForm({
      class_name: '',
      subject: '',
      chapter: '',
      sheet_link: ''
    });
  };

  const handleDelete = async (sheetId) => {
    if (!window.confirm('Are you sure you want to delete this sheet?')) return;

    try {
      await axios.delete(`${BACKEND_URL}/api/admin/sheets/${sheetId}`);
      alert('Sheet deleted successfully!');
      fetchSheets();
    } catch (error) {
      console.error('Error deleting sheet:', error);
      alert('Failed to delete sheet.');
    }
  };

  const filteredSheets = sheets.filter(sheet => {
    const searchLower = searchQuery.toLowerCase();
    return (
      sheet.exam_name?.toLowerCase().includes(searchLower) ||
      sheet.class_name?.toLowerCase().includes(searchLower) ||
      sheet.subject?.toLowerCase().includes(searchLower) ||
      sheet.syllabus_topic?.toLowerCase().includes(searchLower) ||
      sheet.chapter?.toLowerCase().includes(searchLower)
    );
  });

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
                  {/* Exam Name */}
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
                      {examNames.map(exam => (
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
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sub Topic *
                    </label>
                    <select
                      required
                      value={examForm.sub_topic}
                      onChange={(e) => setExamForm({ ...examForm, sub_topic: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!examForm.subject}
                    >
                      <option value="">Select Sub Topic</option>
                      {subTopics.map(topic => (
                        <option key={topic} value={topic}>{topic}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sub-Sub Topic */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sub-Sub Topic (Optional)
                    </label>
                    <input
                      type="text"
                      value={examForm.sub_sub_topic}
                      onChange={(e) => setExamForm({ ...examForm, sub_sub_topic: e.target.value })}
                      placeholder="Enter sub-sub topic if applicable"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </>
            )}

            {/* OPTION 2: Class-based Form */}
            {selectedOption === 'class' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subject *
                    </label>
                    <select
                      required
                      value={classForm.subject}
                      onChange={(e) => setClassForm({ ...classForm, subject: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select Subject</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Science">Science</option>
                      <option value="English">English</option>
                      <option value="Social Science">Social Science</option>
                      <option value="Hindi">Hindi</option>
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

            {/* Google Sheet Link (Common for both) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Google Sheet Public Link *
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  required
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

            {/* Form Actions */}
            <div className="flex items-center space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving...' : 'Save Sheet'}</span>
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
          </form>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search sheets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={fetchSheets}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Sheets List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Hierarchy</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Sheet Link</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500">Loading sheets...</p>
                  </td>
                </tr>
              ) : filteredSheets.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>No sheets found. Add your first sheet!</p>
                  </td>
                </tr>
              ) : (
                filteredSheets.map((sheet, index) => (
                  <tr key={sheet.id || index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        sheet.type === 'exam' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {sheet.type === 'exam' ? 'Exam' : 'Class'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {sheet.type === 'exam' ? (
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">{sheet.exam_name}</p>
                            <p className="text-gray-600">{sheet.syllabus_topic} → {sheet.subject}</p>
                            <p className="text-gray-500 text-xs">{sheet.sub_topic} {sheet.sub_sub_topic && `→ ${sheet.sub_sub_topic}`}</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">{sheet.class_name}</p>
                            <p className="text-gray-600">{sheet.subject} → {sheet.chapter}</p>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={sheet.sheet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-sm">View Sheet</span>
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDelete(sheet.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
  );
};

export default ExamSheetManager;
