import React, { useState } from 'react';
import { X, Plus, Upload, FileSpreadsheet, Link as LinkIcon, Loader2, AlertCircle, Edit3, Users } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { QUIZ_CATEGORIES, getInitialQuizForm } from './constants';

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
        `${BACKEND_URL}/api/victory-lane/extract-questions-from-image`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (response.data.success && response.data.questions) {
        const questions = response.data.questions.slice(0, 50);
        const formattedQuestions = questions.map(q => ({
          question: q.question || '',
          options: q.options || ['', '', '', ''],
          correctAnswer: 0,
          explanation: q.explanation || ''
        }));
        setQuizForm(prev => ({ ...prev, questions: formattedQuestions }));
        toast.success(`Extracted ${formattedQuestions.length} questions! Please select correct answers manually.`);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to extract questions from image');
    } finally {
      setExtractingQuestions(false);
    }
  };

  const handleGoogleSheetExtraction = async () => {
    if (!googleSheetUrl.trim()) {
      toast.error('Please enter a Google Sheet URL');
      return;
    }
    if (!googleSheetUrl.includes('docs.google.com/spreadsheets')) {
      toast.error('Please enter a valid Google Sheets URL');
      return;
    }
    setExtractingQuestions(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/extract-questions-from-sheet`, {
        sheet_url: googleSheetUrl
      });
      if (response.data.success && response.data.questions) {
        const questions = response.data.questions.slice(0, 50);
        const formattedQuestions = questions.map(q => ({
          question: q.question || '',
          options: q.options || ['', '', '', ''],
          correctAnswer: q.correctAnswer || 0,
          explanation: q.explanation || ''
        }));
        setQuizForm(prev => ({ ...prev, questions: formattedQuestions }));
        toast.success(`Extracted ${formattedQuestions.length} questions from Google Sheet!`);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to extract questions from Google Sheet');
    } finally {
      setExtractingQuestions(false);
    }
  };

  const handleCreateQuizRoom = async () => {
    const validQuestions = quizForm.questions.filter(q => q.question.trim());

    if (validQuestions.length < 5) {
      toast.error('Minimum 5 questions required');
      return;
    }
    if (validQuestions.length > 50) {
      toast.error('Maximum 50 questions allowed');
      return;
    }
    if (!quizForm.title.trim() || !quizForm.category) {
      toast.error('Please fill in title and category');
      return;
    }
    if (quizForm.maxParticipants < 2 || quizForm.maxParticipants > 150) {
      toast.error('Participants must be between 2 and 150');
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Create the battle room
      const response = await axios.post(`${BACKEND_URL}/api/battle/create-room`, {
        hostName: user?.name || 'Quiz Host',
        subject: quizForm.category,
        maxParticipants: quizForm.maxParticipants,
        timePerQuestion: Math.floor((quizForm.timeLimit * 60) / validQuestions.length),
        questions: validQuestions.map((q, idx) => ({
          id: `q${idx + 1}`,
          question: q.question,
          options: q.options.map((opt, i) => ({ id: String.fromCharCode(97 + i), text: opt })),
          correctAnswer: String.fromCharCode(97 + q.correctAnswer)
        }))
      });

      if (response.data.success) {
        const roomId = response.data.roomId;

        // Step 2: Create social post with quiz room data
        const postResponse = await axios.post(`${BACKEND_URL}/api/social/posts`, {
          post_type: 'quiz_room',
          content: `Created a new quiz room: ${quizForm.title}`,
          quiz_details: {
            title: quizForm.title,
            category: quizForm.category,
            difficulty: quizForm.difficulty,
            questions_count: validQuestions.length,
            room_code: roomId,
            time_limit: quizForm.timeLimit,
            max_participants: quizForm.maxParticipants,
            access_control: quizForm.accessControl,
            host_name: user?.name || 'Quiz Host',
            host_id: user?.id
          }
        });

        if (postResponse.data.success) {
          toast.success(`Quiz room created! PIN: ${roomId}`, { duration: 5000 });
          onSuccess?.();
          handleClose();
        } else {
          toast.error('Quiz room created but failed to post to feed');
        }
      }
    } catch (error) {
      console.error('Error creating quiz room:', error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || 'Failed to create quiz room';
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

  const validCount = quizForm.questions.filter(q => q.question.trim()).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="quiz-room-modal">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Create Quiz Room</h2>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition" data-testid="close-quiz-modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-5">
            {/* Quiz Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Title</label>
              <input
                type="text"
                value={quizForm.title}
                onChange={(e) => setQuizForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Thermodynamics Masterclass"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                data-testid="quiz-title-input"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={quizForm.category}
                onChange={(e) => setQuizForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                data-testid="quiz-category-select"
              >
                <option value="">Select Category</option>
                {QUIZ_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Difficulty & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                <select
                  value={quizForm.difficulty}
                  onChange={(e) => setQuizForm(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={quizForm.timeLimit}
                  onChange={(e) => setQuizForm(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 15 }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Max Participants & Access Control */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Participants</label>
                <input
                  type="number"
                  min="2"
                  max="150"
                  value={quizForm.maxParticipants}
                  onChange={(e) => setQuizForm(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 150 }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Max 150"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Access Control</label>
                <select
                  value={quizForm.accessControl}
                  onChange={(e) => setQuizForm(prev => ({ ...prev, accessControl: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="public">Public - Anyone can join</option>
                  <option value="followers">Followers Only</option>
                </select>
              </div>
            </div>

            {/* Followers info */}
            {quizForm.accessControl === 'followers' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Followers Only:</span> Only users who follow you can join this quiz room
                </p>
              </div>
            )}

            {/* Requirements */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Quiz Room Requirements:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Minimum 5 questions required</li>
                  <li>Maximum 50 questions allowed</li>
                  <li>Participant limit: 2-150 users</li>
                </ul>
              </div>
            </div>

            {/* Input Method Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Add Questions</label>
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setQuizInputMethod('manual')}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition ${
                    quizInputMethod === 'manual'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Edit3 className="w-4 h-4 inline mr-2" />
                  Manual Entry
                </button>
                <button
                  type="button"
                  onClick={() => setQuizInputMethod('image')}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition ${
                    quizInputMethod === 'image'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  From Image
                </button>
                <button
                  type="button"
                  onClick={() => setQuizInputMethod('sheet')}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition ${
                    quizInputMethod === 'sheet'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 inline mr-2" />
                  Google Sheet
                </button>
              </div>

              {/* Image Upload Section */}
              {quizInputMethod === 'image' && (
                <div className="bg-purple-50 border-2 border-purple-200 border-dashed rounded-xl p-6 mb-4">
                  <div className="bg-purple-100 border border-purple-300 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Image Quality Guidelines
                    </h4>
                    <ul className="text-xs text-purple-800 space-y-1.5">
                      <li>High Resolution: Use clear, high-quality screenshots</li>
                      <li>Max Size: Under 3.8 MB recommended</li>
                      <li>Clarity: Ensure text is readable and not blurred</li>
                      <li>Format: PNG or JPEG files work best</li>
                      <li>Note: AI extracts questions & options only. You must select correct answers manually!</li>
                    </ul>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error('Image size must be less than 10MB');
                          return;
                        }
                        if (file.size > 3.8 * 1024 * 1024) {
                          toast.warning('Image larger than 3.8 MB may cause processing errors. Consider compressing it.');
                        }
                        setSelectedQuizImage(file);
                        const reader = new FileReader();
                        reader.onloadend = () => setQuizImagePreview(reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="quiz-image-upload"
                  />
                  <label htmlFor="quiz-image-upload" className="cursor-pointer block">
                    {quizImagePreview ? (
                      <div className="text-center">
                        <img src={quizImagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-md mb-3" />
                        <p className="text-sm text-gray-600 mb-1">{selectedQuizImage?.name}</p>
                        <p className="text-xs text-gray-500 mb-3">
                          Size: {(selectedQuizImage?.size / (1024 * 1024)).toFixed(2)} MB
                          {selectedQuizImage?.size > 3.8 * 1024 * 1024 &&
                            <span className="text-orange-600 font-semibold"> (May be too large)</span>
                          }
                        </p>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); handleImageExtraction(); }}
                          disabled={extractingQuestions}
                          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
                        >
                          {extractingQuestions ? 'Extracting Questions...' : 'Extract Questions (Max 50)'}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center text-gray-600">
                        <Upload className="w-12 h-12 mx-auto mb-3 text-purple-500" />
                        <p className="text-lg font-semibold mb-1">Click to upload question image</p>
                        <p className="text-sm text-gray-600">PNG, JPG, JPEG supported</p>
                        <p className="text-xs text-purple-700 mt-2 font-medium">Recommended: High-resolution screenshots under 3.8 MB</p>
                      </div>
                    )}
                  </label>
                </div>
              )}

              {/* Google Sheet URL Section */}
              {quizInputMethod === 'sheet' && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Google Sheet Public Link</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        value={googleSheetUrl}
                        onChange={(e) => setGoogleSheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Make sure the sheet is publicly accessible. Format: Question | Option A | Option B | Option C | Option D | Correct Answer (0-3)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleSheetExtraction}
                    disabled={extractingQuestions || !googleSheetUrl.trim()}
                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
                  >
                    {extractingQuestions ? 'Extracting...' : 'Extract Questions from Sheet (Max 50)'}
                  </button>
                </div>
              )}
            </div>

            {/* Questions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Questions ({validCount}/{quizForm.questions.length} - Min: 5, Max: 50)
              </label>
              <div className="space-y-4">
                {quizForm.questions.map((q, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-500">Question {idx + 1}</p>
                      {quizForm.questions.length > 1 && (
                        <button
                          onClick={() => removeQuestion(idx)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                      placeholder="Enter your question..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {['A', 'B', 'C', 'D'].map((opt, optIdx) => (
                        <input
                          key={opt}
                          type="text"
                          value={q.options[optIdx]}
                          onChange={(e) => updateQuestion(idx, `option${optIdx}`, e.target.value)}
                          placeholder={`Option ${opt}`}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ))}
                    </div>
                    <select
                      value={q.correctAnswer}
                      onChange={(e) => updateQuestion(idx, 'correctAnswer', parseInt(e.target.value))}
                      className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={0}>Correct: Option A</option>
                      <option value={1}>Correct: Option B</option>
                      <option value={2}>Correct: Option C</option>
                      <option value={3}>Correct: Option D</option>
                    </select>
                  </div>
                ))}
              </div>
              {quizForm.questions.length < 50 ? (
                <button
                  onClick={addQuestion}
                  className="mt-3 text-blue-500 hover:text-blue-600 font-medium text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add More Questions ({quizForm.questions.length}/50)
                </button>
              ) : (
                <div className="mt-3 text-gray-500 font-medium text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Maximum 50 questions reached
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 p-4 flex gap-4">
          <button
            onClick={handleClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateQuizRoom}
            disabled={
              isSubmitting ||
              validCount < 5 ||
              validCount > 50 ||
              !quizForm.title.trim() ||
              !quizForm.category ||
              quizForm.maxParticipants < 2 ||
              quizForm.maxParticipants > 150
            }
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            data-testid="create-quiz-room-btn"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizRoomModal;
