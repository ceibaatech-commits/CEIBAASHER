// Quiz Room Categories for VictoryLane
export const QUIZ_CATEGORIES = [
  // Engineering & Medical
  'JEE Main - Physics',
  'JEE Main - Chemistry',
  'JEE Main - Mathematics',
  'NEET - Physics',
  'NEET - Chemistry',
  'NEET - Biology',
  'GATE - General Aptitude',
  'GATE - Engineering Mathematics',
  'NATA - Drawing & Composition',
  'NATA - General Aptitude',
  
  // UPSC & Civil Services
  'UPSC - General Studies',
  'UPSC - History',
  'UPSC - Geography',
  'UPSC - Polity',
  'UPSC - Economy',
  'UPSC - Science & Technology',
  'UPSC - Current Affairs',
  'IES/ISS - General Studies',
  'IES/ISS - Engineering',
  
  // Defense Services
  'NDA - Mathematics',
  'NDA - General Ability Test',
  'CDS - English',
  'CDS - General Knowledge',
  'CDS - Elementary Mathematics',
  'AFCAT - General Awareness',
  'AFCAT - Verbal Ability',
  'AFCAT - Numerical Ability',
  'AFCAT - Reasoning',
  
  // Banking & Finance
  'IBPS PO - Reasoning Ability',
  'IBPS PO - Quantitative Aptitude',
  'IBPS PO - English Language',
  'IBPS PO - General Awareness',
  'IBPS Clerk - Numerical Ability',
  'IBPS Clerk - Reasoning Ability',
  'IBPS Clerk - English Language',
  'SBI PO - Reasoning',
  'SBI PO - Quantitative Aptitude',
  'SBI PO - English Language',
  'SBI Clerk - Reasoning',
  'SBI Clerk - Quantitative Aptitude',
  'RBI Grade B - General Awareness',
  'RBI Grade B - English Language',
  'NABARD Grade B - Reasoning',
  'LIC AAO - Reasoning',
  'LIC AAO - Quantitative Aptitude',
  
  // SSC Exams
  'SSC CGL - General Intelligence',
  'SSC CGL - General Awareness',
  'SSC CGL - Quantitative Aptitude',
  'SSC CGL - English Comprehension',
  'SSC CHSL - English Language',
  'SSC CHSL - General Intelligence',
  'SSC GD - Reasoning',
  'SSC GD - General Knowledge',
  
  // Railway Exams
  'RRB NTPC - Mathematics',
  'RRB NTPC - General Intelligence',
  'RRB NTPC - General Awareness',
  
  // Teaching Exams
  'CTET - Child Development',
  'CTET - Language I',
  'CTET - Language II',
  'CTET - Mathematics',
  'CTET - Environmental Studies',
  'UGC NET - General Paper',
  
  // State PSC
  'UPPSC - General Studies',
  'BPSC - General Studies',
  'MPSC - General Studies',
  
  // General Categories
  'General Knowledge',
  'Current Affairs',
  'Logical Reasoning',
  'Quantitative Aptitude',
  'Verbal Ability',
  'English Grammar',
  'Computer Awareness',
  'Science & Technology',
  'History',
  'Geography',
  'Indian Polity',
  'Economics',
  'Environmental Science',
  'Sports',
  'Art & Culture',
  'Books & Authors',
  'Awards & Honours',
  'Important Days',
  'Inventions & Discoveries',
  'Abbreviations'
];

// Utility functions
export const getDifficultyColor = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return 'text-green-600 bg-green-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'hard': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getGradientColor = (category) => {
  if (category?.includes('JEE') || category?.includes('Engineering')) return 'from-blue-500 to-cyan-500';
  if (category?.includes('NEET') || category?.includes('Medical')) return 'from-green-500 to-emerald-500';
  if (category?.includes('UPSC')) return 'from-purple-500 to-indigo-500';
  if (category?.includes('Banking') || category?.includes('IBPS') || category?.includes('SBI')) return 'from-amber-500 to-orange-500';
  if (category?.includes('SSC')) return 'from-red-500 to-pink-500';
  if (category?.includes('NDA') || category?.includes('CDS') || category?.includes('Defence')) return 'from-emerald-500 to-teal-500';
  return 'from-violet-500 to-purple-500';
};

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Initial quiz form state
export const getInitialQuizForm = () => ({
  title: '',
  category: '',
  difficulty: 'Medium',
  timeLimit: 15,
  maxParticipants: 150,
  accessControl: 'public',
  questions: Array(5).fill({ question: '', options: ['', '', '', ''], correctAnswer: 0 })
});
