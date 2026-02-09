import React, { useState } from 'react';
import { X, Plus, Upload, FileSpreadsheet, Link as LinkIcon, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { QUIZ_CATEGORIES, getDifficultyColor, getInitialQuizForm } from './constants';

const BACKEND_URL = window.location.origin;

const QuizRoomModal = ({ isOpen, onClose, user, onSuccess }) => {
  const [quizForm, setQuizForm] = useState(getInitialQuizForm());
  const [quizInputMethod, setQuizInputMethod] = useState('manual');
  const [selectedQuizImage, setSelectedQuizImage] = useState(null);
  const [quizImagePreview, setQuizImagePreview] = useState(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [extractingQuestions, setExtractingQuestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateQuestion = (index, field, value) => {
    setQuizForm(prev => {
      const newQuestions = [...prev.questions];
      if (field === 'question') {
        newQuestions[index] = { ...newQuestions[index], question: value };
      } else if (field === 'correctAnswer') {
        newQuestions[index] = { ...newQuestions[index], correctAnswer: value };
      } else if (field.startsWith('option')) {
        const optIdx = parseInt(field.replace('option', ''));
        const newOptions = [...newQuestions[index].options];
        newOptions[optIdx] = value;
        newQuestions[index] = { ...newQuestions[index], options: newOptions };
      }
      return { ...prev, questions: newQuestions };
    });
  };

  const addQuestion = () => {
    if (quizForm.questions.length >= 50) {
      toast.error('Maximum 50 questions allowed');
      return;
    }
    setQuizForm(prev => ({
      ...prev,
      questions: [...prev.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]
    }));
  };

  const removeQuestion = (index) => {
    if (quizForm.questions.length <= 1) {
      toast.error('At least one question is required');
      return;
    }
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleImageExtraction = async () => {
    if (!selectedQuizImage) {
      toast.error('Please select an image first');
      return;
    }
    
    setExtractingQuestions(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedQuizImage);
      
      const response = await axios.post(
        `${BACKEND_URL}/api/extract-questions`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      
      if (response.data.success) {
        const questions = response.data.questions.slice(0, 50);
        const formattedQuestions = questions.map(q => ({
          question: q.question || '',
          options: q.options || ['', '', '', ''],
          correctAnswer: q.correct_answer || 0
        }));
        
        setQuizForm(prev => ({ ...prev, questions: formattedQuestions }));
        toast.success(`Extracted ${formattedQuestions.length} questions!`);
      }
    } catch (error) {
      toast.error('Failed to extract questions from image');
    } finally {
      setExtractingQuestions(false);
    }
  };

  const handleGoogleSheetExtraction = async () => {
    if (!googleSheetUrl) {
      toast.error('Please enter a Google Sheet URL');
      return;
    }
    
    setExtractingQuestions(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/extract-questions-from-sheet`, {
        sheet_url: googleSheetUrl
      });
      
      if (response.data.success) {
        const questions = response.data.questions.slice(0, 50);
        const formattedQuestions = questions.map(q => ({
          question: q.question || '',
          options: q.options || ['', '', '', ''],
          correctAnswer: q.correct_answer || 0
        }));
        
        setQuizForm(prev => ({ ...prev, questions: formattedQuestions }));
        toast.success(`Extracted ${formattedQuestions.length} questions!`);
      }
    } catch (error) {
      toast.error('Failed to extract questions from sheet');
    } finally {
      setExtractingQuestions(false);
    }
  };

  const handleCreateQuizRoom = async () => {
    const validQuestions = quizForm.questions.filter(q => q.question.trim());
    
    if (!quizForm.title.trim()) {
      toast.error('Please enter a quiz title');
      return;
    }
    if (!quizForm.category) {
      toast.error('Please select a category');
      return;
    }
    if (validQuestions.length < 1) {
      toast.error('Please add at least one question');
      return;
    }
    
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/battle/create-room`, {
        title: quizForm.title,
        category: quizForm.category,
        difficulty: quizForm.difficulty,
        time_limit: quizForm.timeLimit,
        max_participants: quizForm.maxParticipants,
        access_control: quizForm.accessControl,
        questions: validQuestions.map(q => ({
          question: q.question,
          options: q.options.filter(o => o.trim()),
          correct_answer: q.correctAnswer
        })),
        host_id: user?.id,
        host_name: user?.name || user?.username
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Quiz room created!');
        onSuccess?.(response.data);
        handleClose();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to create quiz room';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setQuizForm(getInitialQuizForm());
    setQuizInputMethod('manual');
    setSelectedQuizImage(null);
    setQuizImagePreview(null);
    setGoogleSheetUrl('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Create Quiz Room</h2>
          <button onClick={handleClose} className="text-white/80 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title *</label>
              <input
                type="text"
                value={quizForm.title}
                onChange={(e) => setQuizForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter quiz title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={quizForm.category}
                onChange={(e) => setQuizForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select Category</option>
                {QUIZ_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                value={quizForm.difficulty}
                onChange={(e) => setQuizForm(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time per Question (sec)</label>
              <input
                type="number"
                value={quizForm.timeLimit}
                onChange={(e) => setQuizForm(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 15 }))}
                min="5"
                max="120"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Input Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Add Questions Via</label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setQuizInputMethod('manual')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${quizInputMethod === 'manual' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <Plus className="w-4 h-4" /> Manual Entry
              </button>
              <button
                onClick={() => setQuizInputMethod('image')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${quizInputMethod === 'image' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <Upload className="w-4 h-4" /> From Image
              </button>
              <button
                onClick={() => setQuizInputMethod('sheet')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${quizInputMethod === 'sheet' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <FileSpreadsheet className="w-4 h-4" /> Google Sheet
              </button>
            </div>
          </div>

          {/* Image/Sheet Upload */}
          {quizInputMethod === 'image' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setSelectedQuizImage(file);
                    const reader = new FileReader();
                    reader.onloadend = () => setQuizImagePreview(reader.result);
                    reader.readAsDataURL(file);
                  }
                }}
                className="mb-2"
              />
              {quizImagePreview && (
                <img src={quizImagePreview} alt="Preview" className="max-h-40 rounded-lg mb-2" />
              )}
              <button
                onClick={handleImageExtraction}
                disabled={!selectedQuizImage || extractingQuestions}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                {extractingQuestions ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Extract Questions
              </button>
            </div>
          )}

          {quizInputMethod === 'sheet' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  placeholder="Paste Google Sheet URL"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={handleGoogleSheetExtraction}
                  disabled={!googleSheetUrl || extractingQuestions}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {extractingQuestions ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                  Extract
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Sheet format: Question | Option A | Option B | Option C | Option D | Correct Answer (A/B/C/D)
              </p>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Questions ({quizForm.questions.length})</h3>
              <button
                onClick={addQuestion}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Question
              </button>
            </div>
            
            {quizForm.questions.map((q, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-gray-700">Question {idx + 1}</span>
                  {quizForm.questions.length > 1 && (
                    <button
                      onClick={() => removeQuestion(idx)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <textarea
                  value={q.question}
                  onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                  placeholder="Enter question"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm"
                  rows={2}
                />
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${idx}`}
                        checked={q.correctAnswer === optIdx}
                        onChange={() => updateQuestion(idx, 'correctAnswer', optIdx)}
                        className="w-4 h-4 text-purple-600"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateQuestion(idx, `option${optIdx}`, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateQuizRoom}
            disabled={isSubmitting}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Create Quiz Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizRoomModal;
