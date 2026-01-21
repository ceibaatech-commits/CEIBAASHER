import React, { useState, useEffect } from 'react';
import { X, BookOpen, GraduationCap, ChevronDown, HelpCircle, Send } from 'lucide-react';
import axios from 'axios';
import MathInput from './MathInput';
import { toast } from 'sonner';

const BACKEND_URL = window.location.origin;

const AcademicQuestionModal = ({ isOpen, onClose, onSubmit, user }) => {
  const [loading, setLoading] = useState(false);
  const [cbseData, setCbseData] = useState({});
  const [loadingCbseData, setLoadingCbseData] = useState(true);
  
  // Form state
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [questionText, setQuestionText] = useState('');
  
  // Available options
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);

  // Class list with streams
  const classOptions = [
    { value: 'Class 6', label: 'Class 6' },
    { value: 'Class 7', label: 'Class 7' },
    { value: 'Class 8', label: 'Class 8' },
    { value: 'Class 9', label: 'Class 9' },
    { value: 'Class 10', label: 'Class 10' },
    { value: 'Class 11 (Science)', label: 'Class 11 - Science' },
    { value: 'Class 11 (Commerce)', label: 'Class 11 - Commerce' },
    { value: 'Class 11 (Humanities)', label: 'Class 11 - Humanities' },
    { value: 'Class 12 (Science)', label: 'Class 12 - Science' },
    { value: 'Class 12 (Commerce)', label: 'Class 12 - Commerce' },
    { value: 'Class 12 (Humanities)', label: 'Class 12 - Humanities' },
  ];

  // Fetch CBSE data on mount
  useEffect(() => {
    const fetchCbseData = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/cbse-data/admin/class-subjects`);
        if (response.data.success) {
          setCbseData(response.data.class_subjects);
        }
      } catch (error) {
        console.error('Error fetching CBSE data:', error);
        toast.error('Failed to load class data');
      } finally {
        setLoadingCbseData(false);
      }
    };
    
    if (isOpen) {
      fetchCbseData();
    }
  }, [isOpen]);

  // Update subjects when class changes
  useEffect(() => {
    if (selectedClass && cbseData[selectedClass]) {
      const subjectList = Object.keys(cbseData[selectedClass]);
      setSubjects(subjectList);
      setSelectedSubject('');
      setSelectedChapter('');
      setChapters([]);
    } else {
      setSubjects([]);
      setSelectedSubject('');
      setSelectedChapter('');
      setChapters([]);
    }
  }, [selectedClass, cbseData]);

  // Update chapters when subject changes
  useEffect(() => {
    if (selectedClass && selectedSubject && cbseData[selectedClass]?.[selectedSubject]) {
      setChapters(cbseData[selectedClass][selectedSubject]);
      setSelectedChapter('');
    } else {
      setChapters([]);
      setSelectedChapter('');
    }
  }, [selectedSubject, selectedClass, cbseData]);

  const handleSubmit = async () => {
    if (!selectedClass) {
      toast.error('Please select a class');
      return;
    }
    if (!selectedSubject) {
      toast.error('Please select a subject');
      return;
    }
    if (!selectedChapter) {
      toast.error('Please select a chapter');
      return;
    }
    if (!questionText.trim()) {
      toast.error('Please enter your question');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        class_name: selectedClass,
        subject: selectedSubject,
        chapter: selectedChapter,
        question: questionText.trim()
      });
      
      // Reset form
      setSelectedClass('');
      setSelectedSubject('');
      setSelectedChapter('');
      setQuestionText('');
      onClose();
    } catch (error) {
      console.error('Error creating academic question:', error);
      toast.error('Failed to post question');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-500">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Ask Academic Question</h2>
              <p className="text-white/80 text-sm">Post a question related to your class syllabus</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {loadingCbseData ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading class data...</span>
            </div>
          ) : (
            <>
              {/* Class Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <BookOpen className="w-4 h-4 inline mr-2" />
                  Select Class *
                </label>
                <div className="relative">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-gray-900"
                  >
                    <option value="">Choose your class</option>
                    {classOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Subject Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject *
                </label>
                <div className="relative">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    disabled={!selectedClass || subjects.length === 0}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{subjects.length === 0 ? 'Select class first' : 'Choose subject'}</option>
                    {subjects.map(subj => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Chapter Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Chapter *
                </label>
                <div className="relative">
                  <select
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(e.target.value)}
                    disabled={!selectedSubject || chapters.length === 0}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{chapters.length === 0 ? 'Select subject first' : 'Choose chapter'}</option>
                    {chapters.map(ch => (
                      <option key={ch} value={ch}>{ch}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Question Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <HelpCircle className="w-4 h-4 inline mr-2" />
                  Your Question *
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Ask your doubt or question. You can use mathematical equations using $ signs.
                </p>
                <MathInput
                  value={questionText}
                  onChange={setQuestionText}
                  placeholder="Type your question here... Use $ signs for math: $x^2 + y^2 = z^2$"
                  showToolbar={true}
                  multiline={true}
                  rows={5}
                  className="w-full"
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tip:</strong> Your question will appear on Victory Lane and also on the chapter page where other students studying the same chapter can help answer it!
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedClass || !selectedSubject || !selectedChapter || !questionText.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Post Question</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcademicQuestionModal;
