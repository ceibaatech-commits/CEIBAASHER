import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = window.location.origin;

/**
 * Custom hook for managing Quiz Room creation
 */
export const useQuizRoom = (user) => {
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizForm, setQuizForm] = useState({
    title: '',
    category: '',
    difficulty: 'Medium',
    timeLimit: 15,
    maxParticipants: 150,
    accessControl: 'public',
    questions: Array(5).fill({ question: '', options: ['', '', '', ''], correctAnswer: 0 })
  });
  const [quizInputMethod, setQuizInputMethod] = useState('manual');
  const [selectedQuizImage, setSelectedQuizImage] = useState(null);
  const [quizImagePreview, setQuizImagePreview] = useState(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [extractingQuestions, setExtractingQuestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetQuizForm = useCallback(() => {
    setQuizForm({
      title: '',
      category: '',
      difficulty: 'Medium',
      timeLimit: 15,
      maxParticipants: 150,
      accessControl: 'public',
      questions: Array(5).fill({ question: '', options: ['', '', '', ''], correctAnswer: 0 })
    });
    setQuizInputMethod('manual');
    setSelectedQuizImage(null);
    setQuizImagePreview(null);
    setGoogleSheetUrl('');
  }, []);

  const updateQuestion = useCallback((index, field, value) => {
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
  }, []);

  const addQuestion = useCallback(() => {
    if (quizForm.questions.length >= 50) {
      toast.error('Maximum 50 questions allowed');
      return;
    }
    setQuizForm(prev => ({
      ...prev,
      questions: [...prev.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]
    }));
  }, [quizForm.questions.length]);

  const removeQuestion = useCallback((index) => {
    if (quizForm.questions.length <= 1) {
      toast.error('At least one question is required');
      return;
    }
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  }, [quizForm.questions.length]);

  const extractFromImage = useCallback(async () => {
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
  }, [selectedQuizImage]);

  const extractFromSheet = useCallback(async () => {
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
  }, [googleSheetUrl]);

  const createQuizRoom = useCallback(async (onSuccess) => {
    const validQuestions = quizForm.questions.filter(q => q.question.trim());
    
    if (!quizForm.title.trim()) {
      toast.error('Please enter a quiz title');
      return false;
    }
    if (!quizForm.category) {
      toast.error('Please select a category');
      return false;
    }
    if (validQuestions.length < 1) {
      toast.error('Please add at least one question');
      return false;
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
        resetQuizForm();
        setShowQuizModal(false);
        return true;
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to create quiz room';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
    return false;
  }, [quizForm, user, resetQuizForm]);

  return {
    showQuizModal,
    setShowQuizModal,
    quizForm,
    setQuizForm,
    quizInputMethod,
    setQuizInputMethod,
    selectedQuizImage,
    setSelectedQuizImage,
    quizImagePreview,
    setQuizImagePreview,
    googleSheetUrl,
    setGoogleSheetUrl,
    extractingQuestions,
    isSubmitting,
    resetQuizForm,
    updateQuestion,
    addQuestion,
    removeQuestion,
    extractFromImage,
    extractFromSheet,
    createQuizRoom
  };
};

export default useQuizRoom;
