export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
export const ACCEPTED_FILES = '.pdf,.jpg,.jpeg,.png,.webp';

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇮🇳' },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', flag: '🇮🇳' },
  { code: 'te', label: 'Telugu', flag: '🇮🇳' },
  { code: 'kn', label: 'Kannada', flag: '🇮🇳' },
  { code: 'bn', label: 'Bengali', flag: '🇮🇳' },
];

export const LEARNING_MODES = {
  concept: {
    label: 'Concept',
    guidance: 'Explain clearly in simple steps with one everyday example and end with a quick check question.',
  },
  exam: {
    label: 'Exam Boost',
    guidance: 'Prioritize exam-important points, likely question framing, and one fast recall trick.',
  },
  revision: {
    label: 'Quick Revision',
    guidance: 'Keep answers short in bullet style with key formulas/facts and common mistakes to avoid.',
  },
};

export const QUICK_PROMPTS = [
  'Explain this like I am in class 8',
  'Give me 3 exam-important points',
  'Ask me one quick quiz question',
];

export const GOAL_QUICK_PROMPTS = {
  school: [
    'Explain with CBSE curriculum examples',
    'Which topics come in board exams?',
    'Help me solve this NCERT problem',
  ],
  jee_neet: [
    'What is the tricky part in this concept?',
    'Show me one JEE/NEET-style question',
    'Give me the fastest solving trick',
  ],
  govt: [
    'Explain the factual key points for exams',
    'What is asked in SSC/Bank exams?',
    'Show me 3 frequently asked questions',
  ],
  spoken: [
    'Correct my pronunciation and explain usage',
    'Give me 5 phrases for this situation',
    'How do I say this naturally in English?',
  ],
};

export const AUDIO_MODES = {
  default: { label: 'Balanced Voice' },
  calm: { label: 'Calm Teacher' },
  energetic: { label: 'Energetic Mentor' },
  exam: { label: 'Exam Drill' },
};

export const STUDENT_GOALS = {
  school: 'CBSE/State School',
  jee_neet: 'JEE / NEET',
  govt: 'Govt Exams',
  spoken: 'Spoken English',
};

export const TUTORS = {
  divya: {
    name: 'Divya', tagline: 'Warm & Encouraging',
    desc: 'Explains with examples & analogies. Makes learning fun!',
    avatar: '/images/divya_avatar.png',
    bg: 'from-purple-500 to-pink-500', light: 'bg-purple-50',
    border: 'border-purple-200', text: 'text-purple-600', pulse: 'bg-purple-400',
  },
  sher: {
    name: 'Sher', tagline: 'Sharp & Exam-Focused',
    desc: 'Mnemonics, tricks & strategies to ace your exams.',
    avatar: '/images/sher_avatar.png',
    bg: 'from-teal-500 to-cyan-500', light: 'bg-teal-50',
    border: 'border-teal-200', text: 'text-teal-600', pulse: 'bg-teal-400',
  },
};
