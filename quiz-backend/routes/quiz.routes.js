const express = require('express');
const router = express.Router();
const GoogleSheetsService = require('../services/googleSheets.service');
const sheetsConfig = require('../config/sheets.config');

const sheetsService = new GoogleSheetsService(process.env.GOOGLE_API_KEY);

/**
 * GET /api/quiz/exams
 * Get list of all available exams
 */
router.get('/exams', (req, res) => {
  const exams = Object.keys(sheetsConfig).map(examName => ({
    name: examName,
    subjects: Object.keys(sheetsConfig[examName])
  }));
  
  res.json({ success: true, exams });
});

/**
 * GET /api/quiz/subjects/:exam
 * Get subjects for a specific exam
 */
router.get('/subjects/:exam', (req, res) => {
  const { exam } = req.params;
  const examConfig = sheetsConfig[exam];
  
  if (!examConfig) {
    return res.status(404).json({ success: false, message: 'Exam not found' });
  }
  
  const subjects = Object.keys(examConfig).map(subject => ({
    name: subject,
    sheetId: examConfig[subject]
  }));
  
  res.json({ success: true, exam, subjects });
});

/**
 * POST /api/quiz/start
 * Start a solo practice quiz
 * Body: { exam, subject }
 */
router.post('/start', async (req, res) => {
  try {
    const { exam, subject } = req.body;
    
    if (!exam || !subject) {
      return res.status(400).json({ success: false, message: 'Exam and subject are required' });
    }
    
    const sheetId = sheetsConfig[exam]?.[subject];
    
    if (!sheetId) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    
    let questions;
    
    // Try to fetch from Google Sheets first
    try {
      questions = await sheetsService.getRandomQuestions(sheetId, 10);
      console.log(`✅ Fetched ${questions.length} questions from Google Sheets for ${exam} - ${subject}`);
    } catch (sheetsError) {
      // If Google Sheets fails, use demo data
      console.log(`⚠️  Google Sheets failed: ${sheetsError.message}`);
      console.log(`📚 Falling back to demo data for ${exam} - ${subject}`);
      questions = await sheetsService.getRandomQuestionsByExamSubject(exam, subject, 10);
    }
    
    // Remove correct answers from response (will validate on submission)
    const questionsForClient = questions.map(({ id, question, options, explanation }) => ({
      id,
      question,
      options
    }));
    
    // Store quiz session (in production, use Redis or database)
    const quizId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({
      success: true,
      quizId,
      exam,
      subject,
      questions: questionsForClient,
      totalQuestions: questions.length,
      timePerQuestion: 30, // seconds
      usingDemoData: sheetsService.useDemoData
    });
    
    // Store answers for validation (simplified - in production use proper session storage)
    global.quizSessions = global.quizSessions || {};
    global.quizSessions[quizId] = {
      questions,
      exam,
      subject,
      startTime: Date.now()
    };
    
  } catch (error) {
    console.error('Error starting quiz:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/quiz/submit
 * Submit quiz answers and get results
 * Body: { quizId, answers: [{ questionId, selectedOption }] }
 */
router.post('/submit', (req, res) => {
  try {
    const { quizId, answers } = req.body;
    
    if (!quizId || !answers) {
      return res.status(400).json({ success: false, message: 'Quiz ID and answers are required' });
    }
    
    const session = global.quizSessions?.[quizId];
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Quiz session not found' });
    }
    
    // Calculate score
    let correctAnswers = 0;
    const results = session.questions.map(question => {
      const userAnswer = answers.find(a => a.questionId === question.id);
      const isCorrect = userAnswer && userAnswer.selectedOption === question.correctAnswer;
      
      if (isCorrect) correctAnswers++;
      
      return {
        questionId: question.id,
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        userAnswer: userAnswer?.selectedOption,
        isCorrect,
        explanation: question.explanation
      };
    });
    
    const score = (correctAnswers / session.questions.length) * 100;
    const timeTaken = Math.floor((Date.now() - session.startTime) / 1000);
    
    // Clean up session
    delete global.quizSessions[quizId];
    
    res.json({
      success: true,
      score: Math.round(score),
      correctAnswers,
      totalQuestions: session.questions.length,
      timeTaken,
      results
    });
    
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
