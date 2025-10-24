const axios = require('axios');
const demoQuestions = require('../data/demo-questions');

class GoogleSheetsService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    this.useDemoData = false; // Flag to track if using demo data
  }

  /**
   * Fetch all questions from a Google Sheet
   * @param {string} spreadsheetId - The Google Sheet ID
   * @param {string} range - Sheet range (default: Sheet1!A2:G)
   */
  async fetchQuestions(spreadsheetId, range = 'Sheet1!A2:G') {
    try {
      const url = `${this.baseUrl}/${spreadsheetId}/values/${range}?key=${this.apiKey}`;
      const response = await axios.get(url);
      
      if (!response.data.values || response.data.values.length === 0) {
        return [];
      }

      // Transform sheet rows to question objects
      const questions = response.data.values.map((row, index) => {
        // Column structure: A=Question, B=Option1, C=Option2, D=Option3, E=Option4, F=CorrectAnswer, G=Explanation
        return {
          id: `q_${index + 1}`,
          question: row[0] || '',
          options: [
            row[1] || '',
            row[2] || '',
            row[3] || '',
            row[4] || ''
          ],
          correctAnswer: parseInt(row[5]) - 1 || 0, // Convert 1-based to 0-based index
          explanation: row[6] || 'No explanation available'
        };
      });

      return questions.filter(q => q.question && q.options.every(o => o));
    } catch (error) {
      console.error('Error fetching from Google Sheets:', error.message);
      throw new Error(`Failed to fetch questions: ${error.message}`);
    }
  }

  /**
   * Get random questions from a sheet
   * @param {string} spreadsheetId - The Google Sheet ID
   * @param {number} count - Number of random questions to fetch
   */
  async getRandomQuestions(spreadsheetId, count = 10) {
    try {
      const allQuestions = await this.fetchQuestions(spreadsheetId);
      
      if (allQuestions.length === 0) {
        throw new Error('No questions found in the sheet');
      }

      // Shuffle and select random questions
      const shuffled = allQuestions.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, Math.min(count, allQuestions.length));
    } catch (error) {
      console.error('Error getting random questions:', error.message);
      throw error;
    }
  }

  /**
   * Get random questions for an exam and subject (with demo fallback)
   * @param {string} exam - Exam name (NEET, JEE)
   * @param {string} subject - Subject name
   * @param {number} count - Number of questions
   */
  async getRandomQuestionsByExamSubject(exam, subject, count = 10) {
    // Check if demo data exists for this exam and subject
    if (demoQuestions[exam] && demoQuestions[exam][subject]) {
      console.log(`ℹ️  Using demo data for ${exam} - ${subject}`);
      const questions = demoQuestions[exam][subject];
      const shuffled = questions.sort(() => 0.5 - Math.random());
      this.useDemoData = true;
      return shuffled.slice(0, Math.min(count, questions.length));
    }
    
    // If no demo data, return empty (Google Sheets should be the primary source)
    throw new Error(`Demo data not available for ${exam} - ${subject}`);
  }
}

module.exports = GoogleSheetsService;
