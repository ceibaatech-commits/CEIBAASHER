import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileSpreadsheet, Plus, Edit, Trash2, ExternalLink, 
  Search, Filter, Download, Upload, CheckCircle, XCircle,
  ChevronDown, AlertCircle, RefreshCw, Save, Link as LinkIcon
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ExamSheetManager = () => {
  const [selectedOption, setSelectedOption] = useState('exam'); // 'exam', 'class', or 'book'
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
    sheet_link: ''
  });

  const [inputMethod, setInputMethod] = useState('sheet');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [extracting, setExtracting] = useState(false);

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

  // Fetch CBSE data from centralized API on mount
  useEffect(() => {
    const fetchCbseData = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/cbse-data/admin/class-subjects`);
        if (response.data.success) {
          setCbseClassSubjects(response.data.class_subjects);
        }
      } catch (error) {
        console.error('Error fetching CBSE data:', error);
      } finally {
        setLoadingCbseData(false);
      }
    };
    fetchCbseData();
  }, []);

  // Class names for dropdowns
  const classNames = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11 (Science)', 'Class 11 (Commerce)', 'Class 11 (Humanities)', 'Class 12 (Science)', 'Class 12 (Commerce)', 'Class 12 (Humanities)'];
  
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
  const syllabusTopicsMap = {
    // Engineering & Medical
    'JEE': ['Physics', 'Chemistry', 'Mathematics'],
    'NEET': ['Physics', 'Chemistry', 'Biology'],
    'GATE': ['General Aptitude (GA)', 'Engineering Mathematics', 'Core Subject (e.g., CSE)'],
    'NATA': ['Drawing & Composition', 'General Aptitude', 'Mathematics & Physics'],
    
    // UPSC & Defense
    'UPSC': ['General Studies', 'Essay', 'Optional Subjects'],
    'NDA': ['Mathematics (300 Marks)', 'General Ability Test - GAT (600 Marks)'],
    'Agniveer': ['General Knowledge (30 Marks)', 'Logical Reasoning (10 Marks)', 'Mathematics (30 Marks)', 'General Science (30 Marks)'],
    'CDS': ['English', 'General Knowledge', 'Elementary Mathematics'],
    'CAPF': ['General Ability', 'General Studies', 'Quantitative Aptitude'],
    'IES_ISS': ['General Studies', 'Engineering', 'General English'],
    'EPFO': ['General English', 'General Reasoning', 'Quantitative Aptitude', 'General Awareness'],
    
    // Banking & Finance
    'IBPS_PO': ['Reasoning Ability', 'English Language', 'Quantitative Aptitude', 'General Awareness', 'Computer Knowledge'],
    'IBPS_CLERK': ['Numerical Ability', 'Reasoning Ability', 'English Language'],
    'IBPS_RRB_PO': ['Reasoning Ability', 'Numerical Ability'],
    'LIC_AAO': ['Reasoning Ability', 'Quantitative Aptitude', 'English Language'],
    'LIC_ADO': ['Reasoning Ability', 'Numerical Ability', 'English Language'],
    'IBPS_SO': ['Reasoning', 'Quantitative Aptitude', 'English Language', 'General Awareness'],
    'SBI_PO': ['Quantitative Aptitude', 'Reasoning Ability', 'English Language'],
    'SBI_CLERK': ['Numerical Ability', 'Reasoning Ability', 'English Language'],
    'RBI_GRADE_B': ['General Awareness', 'Reasoning Ability', 'English Language', 'Quantitative Aptitude'],
    'NABARD': ['Reasoning Ability', 'Quantitative Aptitude', 'Economic & Social Issues', 'Agriculture & Rural Development', 'General Awareness'],
    
    // SSC
    'SSC_CGL': ['General Intelligence', 'General Awareness', 'Quantitative Aptitude', 'English Comprehension'],
    'SSC_CHSL': ['General Intelligence', 'General Awareness', 'Quantitative Aptitude', 'English Language'],
    'SSC_GD': ['General Intelligence', 'General Knowledge', 'Elementary Mathematics', 'English', 'Hindi'],
    'SSC_STENO': ['General Intelligence', 'General Awareness', 'English Language', 'Stenography'],
    
    // Teaching
    'DSSB_PGT': ['Subject Knowledge', 'General Awareness', 'Reasoning', 'English Language'],
    'DSSB_TGT': ['Subject Knowledge', 'Child Psychology', 'Teaching Methodology', 'General Awareness'],
    'KVS_PRT': ['Child Development', 'Language Proficiency', 'Environmental Studies', 'Mathematics'],
    'CTET': ['Child Development & Pedagogy', 'Language I', 'Language II', 'Mathematics', 'Environmental Studies'],
    'MPSET': ['Teaching Aptitude', 'Research Aptitude', 'Comprehension', 'Subject Knowledge'],
    'TS_SET': ['Teaching Aptitude', 'Research Aptitude', 'Comprehension', 'Subject Knowledge'],
    'UP_TGT': ['Subject Knowledge', 'General Knowledge', 'Hindi', 'English', 'Teaching Methodology'],
    'UP_PGT': ['Subject Knowledge', 'General Studies', 'Hindi', 'English'],
    'HTET': ['Child Development', 'Language I', 'Language II', 'Mathematics', 'Environmental Studies'],
    
    // Railways & Others
    'RRB_NTPC': ['General Awareness', 'Mathematics', 'General Intelligence'],
    'AFCAT': ['English', 'General Awareness', 'Numerical Ability', 'Reasoning & Military Aptitude'],
    
    // Management & Law
    'CAT': ['Verbal Ability & RC (VARC)', 'Data Interpretation & LR (DILR)', 'Quantitative Aptitude (QA)'],
    'CLAT': ['English Language', 'Current Affairs & GK', 'Legal Reasoning', 'Logical Reasoning', 'Quantitative Techniques'],
    'GMAT': ['Quantitative Reasoning', 'Verbal Reasoning', 'Data Insights'],
    'CUET': ['Section I: Languages', 'Section II: Domain Subjects', 'Section III: General Test'],
    'UGC_NET': ['Teaching Aptitude', 'Reasoning', 'General Awareness', 'Subject Specific'],
    
    // Agriculture
    'Agriculture': ['Agriculture', 'Horticulture', 'Animal Husbandry', 'Agricultural Economics'],
    
    // State Exams
    'RPSC': ['General Knowledge', 'General Science', 'Geography', 'History', 'Political Science'],
    
    // Language Proficiency Tests (Standardized - 3 Categories Only)
    'SPANISH': ['Gap-fill', 'Vocabulary Building', 'One Word Substitution'],
    'FRENCH': ['Gap-fill', 'Vocabulary Building', 'One Word Substitution'],
    'TAMIL': ['Gap-fill', 'Vocabulary Building', 'One Word Substitution'],
    'TELUGU': ['Gap-fill', 'Vocabulary Building', 'One Word Substitution'],
    'KANNADA': ['Gap-fill', 'Vocabulary Building', 'One Word Substitution'],
    'CHINESE': ['Gap-fill', 'Vocabulary Building', 'One Word Substitution'],
    'JAPANESE': ['Gap-fill', 'Vocabulary Building', 'One Word Substitution'],
    'KOREAN': ['Gap-fill', 'Vocabulary Building', 'One Word Substitution']
  };

  // Comprehensive subjects map
  const subjectsMap = {
    // Science subjects (JEE Main)
    'Physics': ['Mechanics', 'Thermodynamics & Waves', 'E&M & Optics', 'Modern Physics'],
    'Chemistry': ['Physical Chemistry', 'Inorganic Chemistry', 'Organic Chemistry'],
    'Biology': ['Botany', 'Zoology', 'Ecology', 'Genetics', 'Evolution', 'Human Physiology'],
    'Mathematics': ['Algebra', 'Calculus', 'Coordinate Geometry', 'Statistics & Probability'],
    
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
    'Verbal Ability & RC (VARC)': ['Reading Comprehension', 'Verbal Ability (VA)'],
    'Data Interpretation & LR (DILR)': ['Data Interpretation (DI)', 'Logical Reasoning (LR)'],
    'Quantitative Aptitude (QA)': ['Arithmetic', 'Algebra', 'Geometry & Mensuration', 'Modern Math', 'Number System'],
    'Verbal Ability': ['Reading Comprehension', 'Para Jumbles', 'Grammar', 'Vocabulary'],
    'Data Interpretation': ['Tables', 'Graphs', 'Charts', 'Data Analysis'],
    'Logical Reasoning': ['Puzzles', 'Arrangements', 'Blood Relations', 'Direction Sense'],
    
    // CLAT subjects
    'English Language': ['Reading Comprehension', 'Vocabulary & Grammar'],
    'Current Affairs & GK': ['Current Affairs', 'Static GK'],
    'Legal Reasoning': ['Legal Principles', 'Case Law & Policy'],
    'Current Affairs': ['National Events', 'International Events', 'Sports', 'Awards'],
    'Quantitative Techniques': ['Data Interpretation', 'Basic Arithmetic'],
    
    // GATE subjects
    'General Aptitude (GA)': ['Verbal Ability', 'Quantitative Aptitude'],
    'Engineering Mathematics': ['Discrete Mathematics', 'Linear Algebra & Calculus', 'Probability & Statistics'],
    'Core Subject (e.g., CSE)': ['Computer Org. & Architecture', 'Programming & DS', 'Algorithms', 'Operating System'],
    'General Aptitude': ['Verbal Ability', 'Numerical Ability', 'Reasoning'],
    'Technical Subject': ['Core Concepts', 'Advanced Topics', 'Problem Solving'],
    
    // AFCAT subjects
    'English': ['Reading Comprehension', 'Vocabulary', 'Grammar', 'Error Detection', 'Sentence Improvement'],
    'Numerical Ability': ['Arithmetic', 'Algebra', 'Mensuration', 'Data Interpretation'],
    'Reasoning & Military Aptitude': ['Verbal Reasoning', 'Non-Verbal Reasoning', 'Spatial Ability', 'Military Aptitude'],
    
    // Banking & Finance specific
    'Professional Knowledge': ['Banking', 'Finance', 'Marketing', 'IT', 'HR', 'Law'],
    'Data Analysis': ['Data Interpretation', 'Data Sufficiency', 'Charts & Graphs'],
    'Economic & Social Issues': ['Indian Economy', 'Economic Survey', 'Union Budget', 'Social Issues'],
    'Agriculture & Rural Development': ['Agriculture Basics', 'Rural Development', 'Credit & Finance', 'Government Schemes'],
    
    // Teaching subjects
    'Subject Knowledge': ['Content Knowledge', 'Pedagogy', 'Assessment', 'Curriculum'],
    'Child Development': ['Development Stages', 'Learning Theories', 'Individual Differences', 'Special Needs'],
    'Teaching Methodology': ['Teaching Methods', 'Classroom Management', 'Evaluation Techniques', 'Educational Technology'],
    'Child Development & Pedagogy': ['Cognitive Development', 'Learning & Motivation', 'Individual Differences', 'Assessment'],
    'Teaching Aptitude': ['Teaching Skills', 'Learner Characteristics', 'Communication Skills', 'Evaluation'],
    'Research Aptitude': ['Research Methodology', 'Research Ethics', 'Data Interpretation', 'ICT'],
    'Comprehension': ['Reading Comprehension', 'Passage Understanding', 'Critical Analysis'],
    'Language Proficiency': ['Reading', 'Writing', 'Listening', 'Speaking', 'Grammar'],
    'Environmental Studies': ['Environment', 'Plants', 'Animals', 'Food', 'Water', 'Shelter'],
    
    // GMAT subjects
    'Quantitative Reasoning': ['Arithmetic', 'Algebra'],
    'Verbal Reasoning': ['Reading Comprehension', 'Critical Reasoning'],
    'Data Insights': ['Data Analysis', 'Integrated Reasoning'],
    'Integrated Reasoning': ['Multi-Source Reasoning', 'Graphics Interpretation', 'Table Analysis'],
    'Analytical Writing': ['Analysis of Argument', 'Issue Analysis'],
    
    // CUET & UGC NET
    'Section I: Languages': ['Reading Comprehension', 'Language Proficiency'],
    'Section II: Domain Subjects': ['Subject Specific'],
    'Section III: General Test': ['General Awareness & CA', 'Reasoning & Mental Ability', 'Quantitative Reasoning'],
    'Domain Subjects': ['Subject-Specific Topics', 'Core Concepts', 'Advanced Topics'],
    'General Test': ['General Knowledge', 'Current Affairs', 'Numerical Ability', 'Logical Reasoning'],
    'Optional Subjects': ['Subject Choice 1', 'Subject Choice 2', 'Subject Choice 3'],
    
    // NATA subjects
    'Drawing & Composition': ['Composition & Sketching', 'Spatial Visualization'],
    'Mathematics & Physics': ['Mathematics', 'Physics'],
    
    // Agriculture
    'Agriculture': ['Crop Production', 'Soil Science', 'Plant Breeding', 'Agronomy'],
    'Horticulture': ['Fruits', 'Vegetables', 'Floriculture', 'Landscaping'],
    'Animal Husbandry': ['Livestock', 'Poultry', 'Dairy', 'Animal Nutrition'],
    'Agricultural Economics': ['Farm Management', 'Marketing', 'Cooperatives', 'Agricultural Finance'],
    
    // State exams
    'Geography': ['Physical Geography', 'Indian Geography', 'World Geography', 'Map Reading'],
    'History': ['Ancient History', 'Medieval History', 'Modern History', 'Rajasthan History'],
    'Political Science': ['Indian Polity', 'Constitution', 'Political Theory', 'International Relations'],
    'General Knowledge': ['Static GK', 'Current Affairs', 'Awards', 'Books & Authors'],
    'General Science': ['Physics', 'Chemistry', 'Biology', 'General Science'],
    
    // Defense & Physical
    'Physical Fitness': ['Running', 'Push-ups', 'Sit-ups', 'Medical Standards'],
    'Elementary Mathematics': ['Arithmetic', 'Algebra', 'Geometry', 'Mensuration'],
    
    // Language Proficiency Tests - STANDARDIZED CATEGORIES (Sub-topic optional)
    'Gap-fill': ['Fill in the blanks', 'Complete the sentence'],
    'Vocabulary Building': ['Synonyms', 'Antonyms', 'Word meanings'],
    'One Word Substitution': ['Replace phrases with single words'],
    
    // General Studies (CAPF and other exams)
    'General Studies': ['Essay Writing', 'Comprehension', 'Communication Skills'],
    
    // NDA specific syllabus topics
    'Mathematics (300 Marks)': ['Algebra', 'Trigonometry', 'Analytical Geometry 2D', 'Analytical Geometry 3D', 'Differential Calculus', 'Integral Calculus & Differential Equations', 'Vector Algebra', 'Statistics & Probability'],
    'General Ability Test - GAT (600 Marks)': ['English (200 Marks)', 'General Knowledge'],
    
    // Agniveer specific syllabus topics
    'General Knowledge (30 Marks)': ['India and Its Neighboring Countries', 'Abbreviations', 'Sports', 'Awards and Prizes', 'Terminology', 'Indian Armed Forces', 'Continents and Subcontinents', 'Inventions and Discoveries', 'The Constitution of India', 'International Organizations', 'Books and Authors', 'Knowledge of Important Events', 'Current Important World Events', 'Prominent Personalities'],
    'Logical Reasoning (10 Marks)': ['Logical Ability'],
    'Mathematics (30 Marks)': ['Number Systems', 'Fundamental Arithmetical Operations', 'Algebra', 'Geometry', 'Mensuration', 'Trigonometry'],
    'General Science (30 Marks)': ['Physics and Chemistry', 'Biology'],
    
    // Additional mappings for GAT sub-syllabus
    'English (200 Marks)': ['Grammar', 'Vocabulary', 'Comprehension'],
    'General Knowledge': ['History', 'Geography', 'Polity', 'Economics', 'Science', 'Current Affairs'],
    
    // Other Language subjects (for non-language-proficiency exams)
    'Grammar': ['Parts of Speech', 'Tenses', 'Sentence Structure', 'Punctuation'],
    'Vocabulary': ['Synonyms', 'Antonyms', 'Idioms', 'Phrases'],
    'Reading Comprehension': ['Passage Reading', 'Inference', 'Main Idea', 'Vocabulary in Context'],
    'Writing': ['Essay Writing', 'Letter Writing', 'Composition', 'Creative Writing'],
    'Listening': ['Audio Comprehension', 'Note Taking', 'Conversation', 'Lectures'],
    'Speaking': ['Conversation', 'Pronunciation', 'Fluency', 'Presentation'],
    'Literature': ['Poetry', 'Prose', 'Drama', 'Literary Criticism'],
    'Composition': ['Essay', 'Story', 'Letter', 'Report'],
    'Translation': ['Source to Target', 'Technical Translation', 'Literary Translation'],
    'Characters': ['Writing', 'Reading', 'Recognition', 'Stroke Order'],
    'Kanji': ['Reading', 'Writing', 'Meaning', 'Compounds'],
    'Hangul': ['Reading', 'Writing', 'Pronunciation', 'Grammar'],
    
    // Stenography
    'Stenography': ['Shorthand', 'Typing Speed', 'Transcription', 'Dictation'],
    
    // Hindi
    'Hindi': ['Grammar', 'Vocabulary', 'Comprehension', 'Composition']
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
    'Networking': ['LAN', 'WAN', 'Protocols', 'IP Address'],
    
    // AFCAT specific sub-topics
    'Reading Comprehension': ['Passage Reading', 'Inference Questions', 'Main Idea', 'Vocabulary in Context'],
    'Vocabulary': ['Synonyms', 'Antonyms', 'Idioms and Phrases', 'One Word Substitution'],
    'Grammar': ['Tenses', 'Articles', 'Prepositions', 'Active Passive Voice', 'Error Detection', 'Sentence Improvement'],
    'Error Detection': ['Grammatical Errors', 'Spelling Errors', 'Punctuation Errors'],
    'Sentence Improvement': ['Sentence Correction', 'Phrase Replacement', 'Sentence Completion'],
    'Mensuration': ['Area', 'Perimeter', 'Volume', 'Surface Area', 'Height and Distance'],
    'Spatial Ability': ['Figure Series', 'Paper Folding', 'Mirror Images', 'Water Images', 'Embedded Figures'],
    'Military Aptitude': ['Logical Reasoning', 'Critical Thinking', 'Decision Making', 'Problem Solving'],
    
    // RRB NTPC specific sub-topics
    'Analytical Reasoning': ['Logical Deductions', 'Statement Arguments', 'Assumptions', 'Courses of Action'],
    'Number System': ['HCF LCM', 'Divisibility Rules', 'Fractions Decimals', 'Squares Cubes'],
    'Banking Awareness': ['Banking Terms', 'RBI Functions', 'Monetary Policy', 'Banking News'],
    'Economics': ['Indian Economy', 'Economic Terms', 'Budget', 'GDP'],
    
    // CAPF specific sub-topics
    'Essay Writing': ['Current Topics', 'Social Issues', 'National Security'],
    'Comprehension': ['Reading', 'Analysis', 'Inference'],
    'Communication Skills': ['Grammar', 'Vocabulary', 'Sentence Formation'],
    
    // AFCAT Defence exam sub-topics
    'English': ['Passage Reading', 'Inference Questions', 'Main Idea', 'Vocabulary in Context'],
    'Numerical Ability': ['Number System', 'Percentage', 'Profit Loss', 'Simple Interest', 'Compound Interest', 'Time Work', 'Time Speed Distance', 'Ratio Proportion', 'Average', 'Mixture Alligation'],
    'Reasoning & Military Aptitude': ['Analogies', 'Classification', 'Series', 'Coding-Decoding', 'Blood Relations', 'Direction Sense'],
    
    // CAT Admission Test sub-topics
    'Verbal Ability & RC (VARC)': ['Passages (Philosophy', 'Science', 'Economics', 'History) followed by questions on Main Idea', 'Tone', 'Inference', 'Structure'],
    'Verbal Ability (VA)': ['Para Jumbles (Ordering Sentences)', 'Para Summary', 'Odd Sentence Out (Critical Reasoning elements)'],
    'Data Interpretation & LR (DILR)': ['Caselets (Text-based)', 'Tables', 'Charts (Bar', 'Line', 'Pie)', 'Venn Diagrams (Set Theory)', 'Analytical Puzzle-based DI'],
    'Logical Reasoning (LR)': ['Seating Arrangements', 'Puzzles (Scheduling', 'Distribution)', 'Blood Relations', 'Series', 'Critical Reasoning (Inference', 'Assumption', 'Conclusion)'],
    'Quantitative Aptitude (QA)': ['Percentage', 'Profit/Loss', 'Ratio/Proportion', 'Average/Mixtures', 'Time/Speed/Distance', 'Time & Work', 'Simple/Compound Interest'],
    'Geometry & Mensuration': ['Lines/Angles', 'Triangles', 'Circles', 'Polygons', 'Coordinate Geometry', 'Mensuration (Area/Volume of 2D & 3D Shapes)'],
    'Modern Math': ['Permutations & Combinations (P&C)', 'Probability', 'Set Theory'],
    
    // CLAT Admission Test sub-topics
    'English Language': ['Passages (~450 words) followed by questions on Main Idea', 'Vocabulary', 'Grammar', 'Inference'],
    'Vocabulary & Grammar': ['Synonyms', 'Antonyms', 'Error Detection', 'Sentence Correction', 'Tenses', 'Parts of Speech'],
    'Current Affairs & GK': ['National and International events (last 9-12 months)', 'Summits', 'Reports', 'Awards'],
    'Legal Reasoning': ['Application of legal principles to factual scenarios (Torts', 'Contracts', 'Criminal Law', 'Family Law', 'Constitutional Law)'],
    'Case Law & Policy': ['Awareness of important contemporary legal and public policy issues', 'major Supreme Court judgments'],
    'Logical Reasoning': ['Identifying Argument Structure', 'Premise', 'Conclusion', 'Inference', 'Strengthening/Weakening Arguments'],
    'Quantitative Techniques': ['Sets of Facts', 'Graphs', 'Diagrams (Testing Class 10th level Maths application)'],
    'Basic Arithmetic': ['Ratios', 'Percentages', 'Averages', 'P&L', 'Interest', 'Time/Speed/Distance'],
    
    // CUET Admission Test sub-topics
    'Section I: Languages': ['Factual', 'Literary', 'and Narrative Passages (Testing Central Theme', 'Vocabulary', 'Tone)'],
    'Language Proficiency': ['Verbal Ability', 'Grammar (Tenses', 'Parts of Speech)', 'Vocabulary (Synonyms', 'Antonyms)', 'Error Spotting'],
    'Section II: Domain Subjects': ['Subject syllabi are strictly based on the Class 12 NCERT syllabus only (e.g.', 'Physics', 'History', 'Accountancy', 'Psychology', 'etc.)'],
    'Section III: General Test': ['General Knowledge', 'Current Affairs (National & International)'],
    'Reasoning & Mental Ability': ['General Mental Ability', 'Logical & Analytical Reasoning'],
    'Quantitative Reasoning': ['Numerical Ability', 'Quantitative Reasoning (Arithmetic', 'Algebra', 'Geometry', 'Mensuration up to Grade 8)'],
    
    // GATE Admission Test sub-topics
    'General Aptitude (GA)': ['English Grammar', 'Vocabulary', 'Reading Comprehension', 'Verbal Analogies'],
    'Quantitative Aptitude': ['Numerical Computation', 'Data Interpretation (Graphs', 'Charts)', 'Quantitative Reasoning'],
    'Engineering Mathematics': ['Propositional/First-Order Logic', 'Sets', 'Relations', 'Functions', 'Graph Theory', 'Combinatorics'],
    'Linear Algebra & Calculus': ['Matrices', 'Determinants', 'Eigenvalues/Eigenvectors', 'Limits', 'Continuity', 'Differentiation', 'Integration'],
    'Probability & Statistics': ['Random Variables', 'Distributions (Uniform', 'Normal', 'Poisson', 'Binomial)', 'Mean', 'Median', 'Mode', "Bayes' Theorem"],
    'Core Subject (e.g., CSE)': ['Machine Instructions', 'ALU', 'Data Path', 'Control Unit', 'Pipelining', 'Memory Hierarchy (Cache', 'Main Memory)'],
    'Programming & DS': ['C Programming', 'Recursion', 'Arrays', 'Stacks', 'Queues', 'Linked Lists', 'Trees', 'Binary Search Trees', 'Graphs'],
    'Algorithms': ['Searching', 'Sorting', 'Hashing', 'Time & Space Complexity', 'Algorithm Design Techniques (Greedy', 'Dynamic', 'Divide-and-Conquer)'],
    'Operating System': ['System Calls', 'Processes', 'Threads', 'Concurrency', 'Synchronization', 'Deadlock', 'CPU Scheduling', 'Memory Management', 'File Systems'],
    
    // GMAT Admission Test sub-topics
    'Quantitative Reasoning': ['Arithmetic', 'Algebra', 'Geometry'],
    'Verbal Reasoning': ['Passages', 'Critical Reasoning', 'Inference'],
    'Sentence Correction': ['Grammar', 'Idioms', 'Meaning'],
    'Data Insights': ['Graphics', 'Tables', 'Multi-source Reasoning'],
    
    // JEE Admission Test sub-topics
    'Physics': ['Kinematics', 'Laws of Motion', 'Work/Energy/Power', 'Rotational Motion', 'Gravitation', 'Oscillations', 'SHM'],
    'Thermodynamics & Waves': ['Thermal Properties of Matter', 'Kinetic Theory of Gases', 'Thermodynamics', 'Waves and Sound', 'Simple Harmonic Motion'],
    'E&M & Optics': ['Electrostatics', 'Current Electricity', 'Magnetism (Moving Charges and Matter)', 'EMI', 'AC', 'Ray Optics', 'Wave Optics'],
    'Chemistry': ['Atomic Structure', 'Chemical Bonding', 'States of Matter', 'Thermodynamics', 'Equilibrium', 'Solutions', 'Electrochemistry', 'Chemical Kinetics'],
    'Mathematics': ['Sets/Relations/Functions', 'Complex Numbers', 'Quadratic Equations', 'Sequences & Series', 'Permutations & Combinations', 'Binomial Theorem', 'Matrices & Determinants'],
    'Statistics & Probability': ['Statistics', 'Probability', 'Vector Algebra', 'Mathematical Reasoning'],
    
    // NATA Admission Test sub-topics
    'Drawing & Composition': ['Visualizing and sketching scenes (Daily life', 'Urban scape)', 'Creative Composition', 'Proportion & Scale (Human/Building)'],
    'Spatial Visualization': ['Perspective Drawing (One-point', 'Two-point)', '3D Visualization of Objects', 'Memory Drawing', 'Understanding Light and Shadow'],
    'General Aptitude': ['Mental Rotation', 'Pattern Recognition', 'Visualizing different sides of 3D objects', 'Logical Reasoning using Diagrams'],
    'Architectural Awareness': ['General Knowledge of Famous Architects', 'Buildings (National/International)', 'Building Materials', 'Aesthetic Sensitivity', 'Colour Theory'],
    'Mathematics & Physics': ['Algebra', 'Trigonometry (Identities', 'Heights & Distances)', 'Coordinate Geometry', '3D Geometry', 'Mensuration', 'Statistics', 'Probability'],
    
    // UGC NET Admission Test sub-topics
    'Teaching Aptitude': ['Teaching Techniques', 'Evaluation Systems', 'Student Psychology'],
    'Research Aptitude': ['Research Methods', 'Data Analysis', 'Research Ethics'],
    'Reasoning': ['Deduction', 'Induction', 'Analogies'],
    'Mathematical Reasoning': ['Number Series', 'Data Interpretation', 'Problem Solving'],
    'Higher Education': ['Education System', 'ICT', 'Environment'],
    'Subject Specific': ['Fundamentals', 'Advanced Topics', 'Recent Developments'],
    
    // Banking Exams - IBPS CLERK sub-topics
    'Numerical Ability': ['Simplification', 'Approximation', 'Missing Number Series', 'Wrong Number Series', 'Quadratic Equations', 'Quantity Comparison (Q1 & Q2)'],
    'Data Interpretation (DI)': ['Tabular DI', 'Bar Graph', 'Line Graph', 'Pie Chart'],
    'Arithmetic (Word Problems)': ['Percentage', 'Ratio and Proportion', 'Average', 'Age Problems', 'Profit and Loss', 'Simple Interest (SI)', 'Compound Interest (CI)', 'Time and Work', 'Pipes and Cisterns', 'Time Speed and Distance', 'Boats & Streams', 'Mixture and Allegations', 'Partnership', 'Mensuration'],
    'Reasoning Ability': ['Floor/Flat Puzzles', 'Box Puzzles', 'Scheduling (Day/Month/Year)', 'Comparison/Ranking', 'Designation-based', 'Circular Seating', 'Linear Seating (Single Row)', 'Linear Seating (Double Row)', 'Square/Rectangular Arrangement'],
    'Logical Deductions': ["Syllogism (Including 'Only a Few')", 'Inequalities (Direct)', 'Inequalities (Coded)', 'Data Sufficiency (Two statements)'],
    'Miscellaneous Logic': ['Direction Sense', 'Blood Relations (Family Tree)', 'Alphanumeric Series', 'Symbolic Series', 'Order & Ranking', 'Coding-Decoding (Simple)', 'Coding-Decoding (Fictitious)'],
    'Grammar & Structure': ['Error Detection (Spotting Errors)', 'Sentence Improvement/Correction', 'Phrase Replacement'],
    'Vocabulary & Usage': ['Cloze Test (Paragraph completion)', 'Fillers (Single and Double)', 'Word Swap/Usage', 'Para Jumbles (Sentence Rearrangement)'],
    
    // Banking Exams - IBPS PO sub-topics
    'Speed & Calculation': ['Simplification', 'Approximation', 'Missing Number Series', 'Wrong Number Series', 'Quadratic Equations', 'Quantity Comparison (Q1 & Q2)'],
    
    // Banking Exams - IBPS SO sub-topics
    'Reasoning': ['Linear', 'Circular', 'Box', 'Floor'],
    'Syllogism': ['Basic', 'Advanced'],
    'Inequality': ['Direct', 'Coded'],
    'Miscellaneous': ['Blood Relations', 'Direction', 'Coding'],
    'Data Interpretation': ['Table', 'Bar', 'Line', 'Pie Chart'],
    'Simplification': ['BODMAS', 'Approximation'],
    'Number Series': ['Missing', 'Wrong'],
    'Quadratic Equations': ['Roots'],
    'Error Spotting': ['Grammar'],
    'Cloze Test': ['Fill Blanks'],
    'Para Jumbles': ['Rearrangement'],
    
    // Banking Exams - LIC AAO/ADO sub-topics
    'Input-Output': ['Machine Input'],
    'Sentence Correction': ['Grammar'],
    
    // Banking Exams - NABARD sub-topics
    'Economic & Social Issues': ['Poverty Measurement', 'Poverty Alleviation', 'Population Trends', 'Economic Reforms'],
    'Social Justice': ['SC/ST/OBC Issues', 'Human Development', 'Social Movements', 'Positive Discrimination'],
    'Agriculture & Rural Development': ['Soil Science', 'Crop Production', 'Water Resources', 'Farm Machinery', 'Climate Change'],
    'Rural Development': ['Panchayati Raj', 'Rural Credit', 'NABARD Role', 'Government Schemes'],
    'Financial Awareness': ['RBI Updates', 'NABARD Updates', 'Banking Terms'],
    'Government Schemes': ['ARD/ESI Related'],
    'Appointments': ['Key Appointments'],
    
    // Banking Exams - RBI Grade B sub-topics
    'Static Knowledge': ['Indian Financial System', 'Banking Terms'],
    'Reports & Indices': ['World Bank', 'IMF Reports'],
    'Machine Input-Output': ['Complex Logic'],
    'Data Sufficiency': ['Statement Based'],
    
    // Banking Exams - SBI PO sub-topics
    'Calculation Speed': ['Simplification', 'Approximation', 'Missing Number Series', 'Wrong Number Series', 'Basic Arithmetic Operations'],
    'Equations & Relations': ['Quadratic Equations', 'Quantity Comparison (Q1 & Q2)'],
    'Verbal Logic': ["Syllogism (Includes 'Only a Few' concept)", 'Statement and Assumption'],
    'Coded Relations': ['Coded Inequalities (Symbols)', 'Coding-Decoding (New Pattern)'],
    'Non-Verbal/Basic Logic': ['Direction Sense', 'Blood Relations (Family Tree)', 'Order and Ranking', 'Alphanumeric Series', 'Three-digit/Three-letter based problems'],
    'Sentence Structure': ['Para Jumbles (Sentence Rearrangement)'],
    
    // Banking Exams - IBPS RRB PO sub-topics
    'Alphanumeric Series': ['Number Series', 'Symbol Series', 'Alphabet Series'],
    
    // Additional Banking Exam specific subjects
    'Puzzles & Seating Arrangement': ['Floor/Flat Puzzles', 'Box Puzzles', 'Scheduling (Day/Month/Year)', 'Circular Seating', 'Linear Seating', 'Square/Rectangular Arrangement'],
    'Puzzles & Arrangements': ['Linear Seating', 'Circular Seating', 'Box Puzzles', 'Floor Puzzles', 'Scheduling', 'Comparison/Ranking'],
    'Puzzles': ['Linear', 'Circular', 'Box', 'Floor', 'Scheduling'],
    'Puzzles & Seating': ['Linear Seating', 'Circular Seating', 'Floor/Flat Puzzles'],
    'Grammar & Errors': ['Error Detection', 'Sentence Improvement', 'Phrase Replacement'],
    'Reading & Comprehension': ['Passage Reading', 'Inference', 'Main Idea', 'Vocabulary in Context'],
    'Reading Comprehension (RC)': ['Passage Reading', 'Inference Questions', 'Main Idea', 'Vocabulary in Context'],
    'Agriculture': ['Crop Production', 'Soil Science', 'Water Resources', 'Farm Machinery', 'Climate Change'],
    'Rural Development': ['Panchayati Raj', 'Rural Credit', 'NABARD Role', 'Government Schemes'],
    'Socio-Economic Topics': ['Poverty', 'Employment', 'Education', 'Health'],
    'Social Justice': ['SC/ST/OBC Issues', 'Human Development', 'Social Movements'],
    
    // Defence Exams - NDA sub-topics
    'Analytical Geometry 2D': ['Cartesian Coordinate System', 'Distance Formula', 'Section & Midpoint Formula', 'Straight Lines', 'Angle Between Two Lines', 'Circle', 'Conic Sections'],
    'Analytical Geometry 3D': ['Direction Cosines & Direction Ratios', 'Equation of Line in Space', 'Angle Between Two Lines', 'Plane', 'Sphere'],
    'Calculus': ['Differentiation', 'Integration', 'Application of Calculus', 'Differential Equations'],
    'Vectors & Matrices': ['Vector Operations', 'Dot Product', 'Cross Product', 'Matrix Operations', 'Determinants', 'Inverse of Matrix'],
    'Statistics & Probability': ['Statistics', 'Probability', 'Random Variables', 'Distributions', 'Mean', 'Median', 'Mode', "Bayes' Theorem"],
    
    // Defence Exams - Agniveer sub-topics
    'India and Its Neighboring Countries': ['History of India and neighboring countries', 'Culture and traditions', 'Geography', 'Important figures and leaders'],
    'Abbreviations': ['Common abbreviations', 'National and international organization abbreviations'],
    'Sports': ['Major sports events', 'Sports awards', 'National and international sports records', 'Indian sports personalities'],
    'Awards and Prizes': ['National awards (Bharat Ratna, Padma awards)', 'International awards', 'Military awards', 'Significance and history'],
    'Terminology': ['Important terms from various fields', 'Military terminology', 'Scientific and technical terms'],
    'Indian Armed Forces': ['Structure of Indian Armed Forces', 'History and establishment', 'Ranks and hierarchy', 'Role in national defense'],
    'Continents and Subcontinents': ['Knowledge of continents', 'Countries and capitals', 'Major geographical divisions', 'Important rivers and mountains'],
    'Inventions and Discoveries': ['Important inventions', 'Indian contributions to science', 'Scientists and inventors', 'Historical timeline'],
    'The Constitution of India': ['Key features', 'Fundamental Rights', 'Fundamental Duties', 'Directive Principles'],
    'International Organizations': ['UN, WHO, UNESCO', 'International peacekeeping', 'Economic organizations', 'Regional organizations'],
    'Books and Authors': ['Famous books and authors', 'Indian literary works', 'Global literary contributions', 'Award-winning books'],
    'Knowledge of Important Events': ['Major historical events', 'World historical events', 'Independence movement', 'Recent significant events'],
    'Current Important World Events': ['Ongoing political events', 'Economic developments', 'Scientific advancements', 'International relations'],
    'Prominent Personalities': ['Famous personalities from India', 'Global leaders', 'Military heroes', 'Contributions to nation-building'],
    'Logical Ability': ['Logical thinking', 'Pattern recognition', 'Problem-solving', 'Analytical reasoning', 'Sequence and series', 'Coding-decoding', 'Blood relations', 'Direction sense', 'Puzzles'],
    'Number Systems': ['Whole numbers', 'Decimal and fractions', 'Relationship between numbers', 'Types of numbers'],
    'Fundamental Arithmetical Operations': ['HCF and LCM', 'Decimal fraction', 'Percentages', 'Ratio and Proportion', 'Square roots', 'Averages', 'Simple Interest', 'Compound Interest', 'Profit and Loss', 'Discount', 'Partnership', 'Time and Distance', 'Time and Work'],
    'Mensuration': ['Area of triangles', 'Perimeter', 'Area and perimeter of quadrilaterals', 'Area and perimeter of polygons', 'Area and circumference of circles'],
    'Physics and Chemistry': ['Fundamental concepts of physics', 'Laws of motion', 'Force, energy, and power', 'Heat and temperature', 'Light and sound', 'Electricity and magnetism', 'Basic chemistry', 'Elements, compounds, and mixtures', 'Chemical reactions', 'Acids, bases, and salts'],
    'Biology': ['Living and non-living things', 'Cells - structure and functions', 'Tissues - types and functions', 'Growth and reproduction', 'Human body knowledge', 'Human body systems', 'Common diseases', 'Disease prevention', 'Nutrition', 'Vitamins and minerals'],
    
    // Defence Exams - CDS sub-topics (some already exist, adding missing ones)
    'History': ['Indian History', 'World History', 'Freedom Movement', 'Ancient India', 'Medieval India', 'Modern India'],
    'Geography': ['Physical Geography', 'Economic Geography', 'Political Geography', 'Indian Geography', 'World Geography'],
    'Polity': ['Constitution', 'Governance', 'Rights', 'Parliament', 'Judiciary', 'Executive'],
    'Science': ['Physics', 'Chemistry', 'Biology', 'Technology', 'Scientific Developments'],
    
    // Admission Tests - JEE Additional Mappings
    'Thermodynamics & Waves': ['Thermal Properties of Matter', 'Kinetic Theory of Gases', 'Thermodynamics', 'Waves and Sound', 'Simple Harmonic Motion'],
    'E&M & Optics': ['Electrostatics', 'Current Electricity', 'Magnetism', 'EMI', 'AC', 'Ray Optics', 'Wave Optics'],
    'Inorganic Chemistry': ['Chemical Bonding', 'Coordination Chemistry', 'p-Block Elements', 'd & f-Block Elements', 'Periodic Table'],
    'Organic Chemistry': ['Hydrocarbons', 'Alcohols', 'Aldehydes', 'Ketones', 'Carboxylic Acids', 'Amines', 'Biomolecules', 'Polymers'],
    'Physical Chemistry': ['Atomic Structure', 'Thermodynamics', 'Equilibrium', 'Electrochemistry', 'Chemical Kinetics', 'Solutions'],
    'Coordinate Geometry': ['Straight Lines', 'Circles', 'Parabola', 'Ellipse', 'Hyperbola'],
    'Differential Calculus': ['Limits', 'Continuity', 'Differentiation', 'Applications of Derivatives'],
    'Integral Calculus & Differential Equations': ['Integration', 'Definite Integrals', 'Area Under Curves', 'Differential Equations'],
    'Vector Algebra & 3D': ['Vectors', '3D Geometry', 'Scalar Triple Product', 'Vector Triple Product'],
    
    // Banking - Additional mappings for SBI, LIC, IBPS exams
    'Puzzles & Arrangements': ['Linear', 'Circular', 'Box', 'Floor', 'Scheduling'],
    'Miscellaneous': ['Blood Relations', 'Direction', 'Coding', 'Order & Ranking'],
    'Para Jumbles': ['Rearrangement', 'Sequencing', 'Ordering Sentences'],
    'Fillers': ['Single Filler', 'Double Filler', 'Word Usage'],
    'Word Swap': ['Swap Corrections', 'Context-based Usage'],
    'Phrase Replacement': ['Error Correction', 'Phrase Improvement']
  };

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
  }, [examForm.subject, examMetadata.loaded]);

  // Fetch chapters dynamically from backend for Class 11 and 12
  const fetchChaptersFromBackend = async (classNumber, subject) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/chapter-tests/chapters`, {
        params: {
          class_param: classNumber,
          subject: subject
        }
      });
      
      if (response.data.success && response.data.chapters) {
        // Format chapters as "1. Chapter Name" format to match existing chapters
        const formattedChapters = response.data.chapters.map(ch => 
          `${ch.chapter_number}. ${ch.chapter_name}`
        );
        setChapters(formattedChapters);
        console.log(`✅ Loaded ${formattedChapters.length} chapters for Class ${classNumber} ${subject} from backend`);
      } else {
        setChapters([]);
      }
    } catch (error) {
      console.error(`Error fetching chapters for Class ${classNumber} ${subject}:`, error);
      setChapters([]);
    }
  };

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
  }, [classForm.class_name, classForm.subject, cbseClassSubjects]);

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
            </div>

            {inputMethod === 'sheet' ? (
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

            {/* Form Actions */}
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Questions</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Sheet Link</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500">Loading sheets...</p>
                  </td>
                </tr>
              ) : filteredSheets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
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
                            {sheet.sub_topic && <p className="text-gray-500 text-xs">→ {sheet.sub_topic}</p>}
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
                      <div className="text-sm">
                        {sheet.questions_imported ? (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="font-semibold text-green-700">{sheet.question_count || 0} questions</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                            <span className="text-orange-700">Not imported</span>
                          </div>
                        )}
                        {sheet.last_import && (
                          <p className="text-xs text-gray-500 mt-1">
                            Last: {new Date(sheet.last_import).toLocaleDateString()}
                          </p>
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
                          onClick={() => handleImport(sheet.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Import Questions"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTestSheet(sheet.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Test Sheet"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
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
