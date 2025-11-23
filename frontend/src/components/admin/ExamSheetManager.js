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

  // FIXED: Use exact exam IDs from exam_data.py (backend)
  // This ensures perfect matching between admin and frontend
  const examNames = [
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
    'SBI_PO',
    'SBI_CLERK',
    'RBI_GRADE_B',
    'NABARD',
    
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
  const classNames = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

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
        sub_topic: ''
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
        sub_topic: ''
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
        sub_topic: ''
      }));
    }
  }, [examForm.subject]);

  useEffect(() => {
    // Update chapters based on class and subject
    if (classForm.class_name && classForm.subject) {
      // Define comprehensive chapter data for each class and subject
      const classWiseChapters = {
        'Class 6': {
          'Mathematics': [
            '1. Knowing Our Numbers',
            '2. Whole Numbers',
            '3. Playing with Numbers',
            '4. Basic Geometrical Ideas',
            '5. Understanding Elementary Shapes',
            '6. Integers',
            '7. Fractions',
            '8. Decimals',
            '9. Data Handling',
            '10. Mensuration',
            '11. Algebra',
            '12. Ratio and Proportion'
          ],
          'Science': [
            '1. Components of Food',
            '2. Sorting Materials and Groups',
            '3. Separation of Substances',
            '4. Getting to Know Plants',
            '5. Body Movement',
            '6. The Living Organisms – Characteristics and Habitats',
            '7. Motion and Measurement of Distances',
            '8. Light, Shadows and Reflections',
            '9. Electricity and Circuits',
            '10. Fun with Magnets',
            '11. Air Around Us'
          ],
          'Poorvi': [
            '1. A Bottle of Dew',
            '2. The Raven and the Fox',
            '3. Rama to the Rescue',
            '4. The Unlikely Best Friends',
            '5. A Friend\'s Prayer',
            '6. The Chair',
            '7. Neem Baba',
            '8. What a Bird Thought',
            '9. Spices that Heal Us',
            '10. Change of Heart',
            '11. The Winner',
            '12. Yoga—A Way of Life',
            '13. Hamara Bharat—Incredible India!',
            '14. The Kites',
            '15. Ila Sachani: Embroidering Dreams with her Feet',
            '16. National War Memorial'
          ],
          'History': [
            '1. What, Where, How and When?',
            '2. From Hunting – Gathering to Growing Food',
            '3. In the Earliest Cities',
            '4. What Books and Burials Tell Us',
            '5. Kingdoms, Kings and an Early Republic',
            '6. New Questions and Ideas',
            '7. From a Kingdom to an Empire',
            '8. Villages, Towns and Trade',
            '9. New Empires and Kingdoms',
            '10. Buildings, Paintings and Books'
          ],
          'Social Science': [
            'History - What, Where, How and When?',
            'History - On the Trail of the Earliest People',
            'History - From Gathering to Growing Food',
            'History - In the Earliest Cities',
            'History - What Books and Burials Tell Us',
            'History - Kingdoms, Kings and an Early Republic',
            'History - New Questions and Ideas',
            'History - Ashoka, The Emperor Who Gave Up War',
            'History - Vital Villages, Thriving Towns',
            'History - Traders, Kings and Pilgrims',
            'History - New Empires and Kingdoms',
            'History - Buildings, Paintings and Books',
            'Geography - The Earth in the Solar System',
            'Geography - Globe: Latitudes and Longitudes',
            'Geography - Motions of the Earth',
            'Geography - Maps',
            'Geography - Major Domains of the Earth',
            'Geography - Major Landforms of the Earth',
            'Geography - Our Country – India',
            'Geography - Climate, Vegetation and Wildlife',
            'Civics - Understanding Diversity',
            'Civics - Diversity and Discrimination',
            'Civics - What is Government?',
            'Civics - Key Elements of a Democratic Government',
            'Civics - Panchayati Raj',
            'Civics - Rural Administration',
            'Civics - Urban Administration',
            'Civics - Rural Livelihoods',
            'Civics - Urban Livelihoods'
          ],
          'English': [
            'Grammar - Nouns',
            'Grammar - Pronouns',
            'Grammar - Verbs',
            'Grammar - Adjectives',
            'Grammar - Adverbs',
            'Grammar - Prepositions',
            'Grammar - Conjunctions',
            'Grammar - Tenses',
            'Grammar - Articles',
            'Reading Comprehension',
            'Letter Writing',
            'Essay Writing',
            'Story Writing',
            'Poetry',
            'Prose'
          ],
          'Hindi': [
            '1. Vah Pakshee Jo',
            '2. Bachapan',
            '3. Naadaan Dost',
            '4. Ch Se Sa See Gappe',
            '5. Akshar Ka Mahatv',
            '6. Paar Nazar Ke',
            '7. Saathee Haath Badhaana',
            '8. Aise',
            '9. Tikat Alabam',
            '10. Jhaansee Kee Raanee',
            '11. Jo Dekhakar Bhee Nahin Dekha',
            '12. Sansaar Pustak Hai',
            '13. Main Sabase Chhotee Hooon',
            '14. Lokageet',
            '15. Sarv',
            '16. Van Ke Maarg Mein',
            '17. Shvaas-shvaas Mein Baans'
          ]
        },
        'Class 7': {
          'Mathematics': [
            '1. Integers',
            '2. Fractions and Decimals',
            '3. Data Handling',
            '4. Simple Equations',
            '5. Lines and Angles',
            '6. The Triangle and Its Properties',
            '7. Comparing Quantities',
            '8. Rational Numbers',
            '9. Perimeter and Area',
            '10. Algebraic Expressions',
            '11. Exponents and Powers',
            '12. Symmetry',
            '13. Visualising Solid Shapes'
          ],
          'Science': [
            '1. Nutrition in Plants',
            '2. Nutrition in Animals',
            '3. Heat',
            '4. Acids, Bases and Salts',
            '5. Physical and Chemical Changes',
            '6. Respiration in Organisms',
            '7. Transportation in Animals and Plants',
            '8. Reproduction in Plants',
            '9. Motion and Time',
            '10. Electric Current and Its Effects',
            '11. Light',
            '12. Forests: Our Lifeline',
            '13. Wastewater Story'
          ],
          'Geography': [
            '1. Environment',
            '2. Inside Our Earth',
            '3. Our Changing Earth',
            '4. Air',
            '5. Water',
            '6. Human Environment Interactions - The Tropical and the Subtropical Region',
            '7. Life in the Deserts'
          ],
          'History': [
            '1. Introduction: Tracing Changes Through A Thousand Years',
            '2. Kings and Kingdoms',
            '3. Delhi: 12th to 15th Century',
            '4. The Mughals',
            '5. Tribes, Nomads and Settled Communities',
            '6. Devotional Paths To The Divine',
            '7. The Making Of Regional Cultures',
            '8. Eighteenth-Century Political Formation'
          ],
          'Civics': [
            '1. On Equality',
            '2. Role of the Government in Health',
            '3. How The State Government Works',
            '4. Growing Up As Boys And Girls',
            '5. Women Change The World',
            '6. Understanding Media',
            '7. Markets Around Us',
            '8. A Shirt In The Market'
          ],
          'English Honeycomb': [
            '1. Three Questions',
            '2. A Gift of Chappals',
            '3. Gopal and the Hilsa Fish',
            '4. The Ashes That Made Trees Bloom',
            '5. Quality',
            '6. Expert Detectives',
            '7. The Invention of Vita – Wonk',
            '8. Fire Friend and Foe',
            '9. A Bicycle in Good Repair',
            '10. The Story of Cricket'
          ],
          'Hindi Vasant': [
            '1. Hum Panchi Unmukt Gagan Ke',
            '2. Himalaya Ki Betiyan',
            '3. Kathputli',
            '4. Meethaiwala',
            '5. Raja Kho Gaye',
            '6. Shaam - Ek Kisan',
            '7. Apoorv Anubhav',
            '8. Rahim Ke Dohe',
            '9. Ek Tinka',
            '10. Khanpan Ki Badalti Tasveer',
            '11. Neelkanth',
            '12. Bhor Aur Bharkha',
            '13. Veer Kunwar Singh',
            '14. Sangatkaar Ki Karuna Mein Tungnathji Ho Gaye: Dhanraj',
            '15. Atma Ka Anumanit Vyay'
          ]
        },
        'Class 8': {
          'Mathematics': [
            '1. Rational Numbers',
            '2. Linear Equations in One Variable',
            '3. Understanding Quadrilaterals',
            '4. Practical Geometry',
            '5. Data Handling',
            '6. Squares and Square Roots',
            '7. Cubes and Cube Roots',
            '8. Comparing Quantities',
            '9. Algebraic Expressions and Identities',
            '10. Visualising Solid Shapes',
            '11. Mensuration',
            '12. Exponents and Powers',
            '13. Direct and Inverse Proportions',
            '14. Factorisation',
            '15. Introduction to Graphs',
            '16. Playing with Numbers'
          ],
          'Science': [
            '1. Crop Production and Management',
            '2. Microorganisms: Friend and Foe',
            '3. Synthetic Fibres and Plastics',
            '4. Materials: Metals and Non-Metals',
            '5. Coal and Petroleum',
            '6. Combustion and Flame',
            '7. Conservation of Plants and Animals',
            '8. Cell – Structure and Functions',
            '9. Reproduction in Animals',
            '10. Reaching the Age of Adolescence',
            '11. Force and Pressure',
            '12. Friction',
            '13. Sound',
            '14. Chemical Effects of Electric Current',
            '15. Some Natural Phenomena',
            '16. Light',
            '17. Stars and the Solar System',
            '18. Pollution of Air and Water'
          ],
          'Social Science': [
            'History - How, When and Where',
            'History - From Trade to Territory',
            'History - Ruling the Countryside',
            'History - Tribals, Dikus and the Vision of a Golden Age',
            'History - When People Rebel',
            'History - Weavers, Iron Smelters and Factory Owners',
            'History - Civilising the "Native", Educating the Nation',
            'History - Women, Caste and Reform',
            'History - The Making of the National Movement: 1870s–1947',
            'History - India After Independence',
            'Geography - Resources',
            'Geography - Land, Soil, Water, Natural Vegetation and Wildlife Resources',
            'Geography - Mineral and Power Resources',
            'Geography - Agriculture',
            'Geography - Industries',
            'Geography - Human Resources',
            'Civics - The Indian Constitution',
            'Civics - Understanding Secularism',
            'Civics - Why Do We Need a Parliament?',
            'Civics - Understanding Laws',
            'Civics - Judiciary',
            'Civics - Understanding Our Criminal Justice System',
            'Civics - Understanding Marginalization',
            'Civics - Confronting Marginalization',
            'Civics - Public Facilities',
            'Civics - Law and Social Justice'
          ],
          'English': [
            'Grammar - Tenses',
            'Grammar - Active and Passive Voice',
            'Grammar - Direct and Indirect Speech',
            'Grammar - Modals',
            'Grammar - Prepositions',
            'Comprehension',
            'Letter Writing',
            'Essay Writing',
            'Story Writing',
            'Poetry',
            'Prose'
          ],
          'Hindi Vasant': [
            '1. Laakh Ki Chudiyan',
            '2. Bus Ki Yatra',
            '3. Diwanon Ki Hasti',
            '4. Bhagwan Ke Dakiye',
            '5. Kya Nirash Hua Jaye',
            '6. Yah Sabse Kathin Samay Nahi',
            '7. Kabir Ki Saakhiyan',
            '8. Surdas Charit',
            '9. Jahan Pahiya Hai',
            '10. Akbari Lota',
            '11. Surdas Ke Pad',
            '12. Paani Ki Kahani',
            '13. Baaz Aur Saap'
          ],
          'Hindi Durva': [
            '1. Gudiya',
            '2. Do Gauraiya',
            '3. Chiththiyon Mein Europe',
            '4. Os',
            '5. Natak Mein Natak',
            '6. Sagar Yatra',
            '7. Uth Kisan O',
            '8. Saste Ka Chakkar',
            '9. Ek Khiladi Ki Kuch Yadein',
            '10. Bus Ki Sair',
            '11. Hindi Ne Jinki Jindagi Badal Di Maria Nezheshi',
            '12. Ashadh Ka Pehla Din',
            '13. Anyay Ke Khilaf',
            '14. Baccho Ke Priya Shri Keshav Shankar Pillai',
            '15. Farsh Par',
            '16. Budhi Amma Ki Baat',
            '17. Vah Subah Kabhi To Aayegi'
          ],
          'Hindi Bharat Ki Khoj': [
            '1. Ahmadnagar Ka Kila',
            '2. Talash',
            '3. Sindhu Ghati Sabhyata',
            '4. Yugon Ka Daur',
            '5. Nayi Samasyaen',
            '6. Antim Daur Ek',
            '7. Antim Daur Do',
            '8. Tanav',
            '9. Do Prishthabhoomian Bhartiya Aur Angrezi'
          ],
          'English Honeydew': [
            '1. The Best Christmas Present in the World & The Ant and the Cricket',
            '2. The Tsunami & Geography Lesson',
            '3. Glimpses of the Past Macavity – The Mystery Cat',
            '4. Bepin Choudhury\'s Lapse of Memory & The Last Bargain',
            '5. The Summit Within & The School Boy',
            '6. This is Jody\'s Fawn & The Duck and the Kangaroo',
            '7. A Visit to Cambridge & When I Set out for Lyonnesse',
            '8. A Short Monsoon Diary & On the Grasshopper and Cricket'
          ],
          'English It So Happened': [
            '1. How the Camel Got His Hump',
            '2. Children at Work',
            '3. The Selfish Giant',
            '4. The Treasure Within',
            '5. Princess September',
            '6. The Fight',
            '7. Jalebis',
            '8. Ancient Education System of India'
          ],
          'Geography': [
            '1. Resources',
            '2. Land, Soil, Water, Natural Vegetation and Wildlife Resources',
            '3. Agriculture',
            '4. Industries',
            '5. Human Resources'
          ],
          'History': [
            '1. Introduction: How, When and Where',
            '2. Trade to Territory',
            '3. Ruling The Countryside',
            '4. Tribals, Dikus, and the Vision of a Golden Age',
            '5. When People Revolt 1857 and After',
            '6. Civilising the Native Educating the Nation',
            '7. Women Caste and Reform',
            '8. The Making of National Movement: 1870s–1947'
          ],
          'Civics': [
            '1. The Indian Constitution',
            '2. Understanding Secularism',
            '3. Parliament and The Making of Laws',
            '4. Judiciary',
            '5. Understanding Marginalisation',
            '6. Confronting Marginalisation',
            '7. Public Facilities',
            '8. Law and Social Justice'
          ]
        },
        'Class 9': {
          'Mathematics': [
            '1. Number Systems',
            '2. Polynomials',
            '3. Coordinate Geometry',
            '4. Linear Equations in Two Variables',
            '5. Introduction to Euclids Geometry',
            '6. Lines and Angles',
            '7. Triangles',
            '8. Quadrilaterals',
            '9. Circles',
            '10. Heron\'s Formula',
            '11. Surface Areas and Volumes',
            '12. Statistics'
          ],
          'Science': [
            '1. Matters in Our Surroundings',
            '2. Is Matter Around Us Pure',
            '3. Atoms and Molecules',
            '4. Structure of the Atom',
            '5. The Fundamental Unit of Life',
            '6. Tissues',
            '7. Motion',
            '8. Force and Laws of Motion',
            '9. Gravitation',
            '10. Work and Energy',
            '11. Sound',
            '12. Improvement in Food Resources'
          ],
          'Geography': [
            '1. India - Size and Location',
            '2. Physical Features of India',
            '3. Drainage',
            '4. Climate',
            '5. Natural Vegetation and Wildlife',
            '6. Population'
          ],
          'Hindi Kshitij': [
            '1. Do Bailon Ki Katha',
            '2. Lhasa Ki Aur',
            '3. Upbhoktaavad Ki Sanskriti',
            '4. Saanvle Sapno Ki Yaad',
            '5. Premchand Ke Fate Joote',
            '6. Mere Bachpan Ke Din',
            '7. Sakhiyan Evam Sabad',
            '8. Vaakh',
            '9. Savaiye',
            '10. Kaidi Aur Kokila',
            '11. Gram Shri',
            '12. Megh Aaye',
            '13. Bacche Kaam Par Ja Rahe Hain'
          ],
          'English Beehive Poems': [
            '1. The Road Not Taken',
            '2. Wind',
            '3. Rain On The Roof',
            '4. The Lake Isle of Innisfree',
            '5. A Legend of The Northland',
            '6. No Men Are Foreign',
            '7. On Killing A Tree',
            '8. A Slumber Did My Spirit Seal'
          ],
          'English Beehive Prose': [
            '1. The Fun They Had',
            '2. The Sound of Music',
            '3. The Little Girl',
            '4. A Truly Beautiful Mind',
            '5. The Snake and The Mirror',
            '6. My Childhood',
            '7. Reach for the Top',
            '8. The Bond of Love',
            '9. If I Were You'
          ],
          'English Moments': [
            '1. The Lost Child',
            '2. The Adventures of Toto',
            '3. Iswaran The Storyteller',
            '4. In The Kingdom of Fools',
            '5. The Happy Prince',
            '6. The Last Leaf',
            '7. A House is Not a Home',
            '8. The Beggar'
          ],
          'Civics': [
            '1. What is Democracy? Why Is Democracy?',
            '2. Constitutional Design',
            '3. Electoral Politics',
            '4. Working of Institutions',
            '5. Democratic Rights'
          ],
          'Economics': [
            '1. The Story of Village Palampur',
            '2. People as Resource',
            '3. Poverty as a Challenge',
            '4. Food Security in India'
          ],
          'History': [
            '1. The French Revolution',
            '2. Socialism in Europe and the Russian Revolution',
            '3. Nazism and the Rise of Hitler',
            '4. Forest Society and Colonialism',
            '5. Pastoralists in the Modern World'
          ]
        },
        'Class 10': {
          'Mathematics': [
            '1. Real Numbers',
            '2. Polynomials',
            '3. Pair Of Linear Equations In Two Variables',
            '4. Quadratic Equations',
            '5. Arithmetic Progressions',
            '6. Triangles',
            '7. Coordinate Geometry',
            '8. Introduction To Trigonometry',
            '9. Some Applications of Trigonometry',
            '10. Circles',
            '11. Areas Related to Circles',
            '12. Surface Area and Volume',
            '13. Statistics',
            '14. Probability'
          ],
          'Science': [
            '1. Chemical Reactions and Equations',
            '2. Acids, Bases and Salts',
            '3. Metals and Non Metals',
            '4. Carbon and Its Compounds',
            '5. Life Processes',
            '6. Control And Coordination',
            '7. How do Organisms Reproduce',
            '8. Heredity and Evolution',
            '9. Light Reflection and Refraction',
            '10. The Human Eye and the Colourful World',
            '11. Electricity',
            '12. Magnetic Effects of Electric Current',
            '13. Our Environment'
          ],
          'Economics': [
            '1. Development',
            '2. Sectors of the Indian Economy',
            '3. Money and Credit',
            '4. Globalisation and the Indian Economy',
            '5. Consumer Rights'
          ],
          'History': [
            '1. The Rise of Nationalism in Europe',
            '2. Nationalism in India',
            '3. The Making of the Global World',
            '4. The Age of Industrialisation',
            '5. Print Culture and the Modern World'
          ],
          'Civics': [
            '1. Power-sharing',
            '2. Federalism',
            '3. Gender, Religion, and Caste',
            '4. Political Parties',
            '5. Outcomes of Democracy'
          ],
          'Geography': [
            '1. Resources and Development',
            '2. Forest and Wildlife Resources',
            '3. Water Resources',
            '4. Agriculture',
            '5. Minerals and Energy Resources',
            '6. Manufacturing Industries',
            '7. Lifelines of National Economy'
          ],
          'English First Flight Prose': [
            '1. A Letter to God',
            '2. Nelson Mandela: Long Walk to Freedom',
            '3. Two Stories about Flying',
            '4. From the Diary of Anne Frank',
            '5. The Hundred Dresses – I',
            '6. The Hundred Dresses – II',
            '7. Glimpses of India',
            '8. Mijbil the Otter',
            '9. Madam Rides the Bus',
            '10. The Sermon at Benares',
            '11. The Proposal'
          ],
          'English First Flight Poems': [
            '1. Dust of Snow',
            '2. Fire and Ice',
            '3. A Tiger in the zoo',
            '4. How to tell Wild Animals',
            '5. The Ball Poem',
            '6. Amanda',
            '7. The Trees',
            '8. Fog',
            '9. The Tale of Custard the Dragon',
            '10. For Anne Gregory'
          ],
          'English Footprints Without Feet': [
            '1. A Triumph of Surgery',
            '2. The Thief\'s Story',
            '3. The Midnight Visitor',
            '4. A Question of Trust',
            '5. Footprints without Feet',
            '6. The Making of a Scientist',
            '7. The Necklace',
            '8. The Hack Driver',
            '9. Bholi',
            '10. The Book that Saved the Earth'
          ],
          'Hindi Kshitij': [
            '1. Surdas',
            '2. Ram-Lakshman-Parshuram Samvad',
            '3. Aatmakathya',
            '4. Utsah & Aat Nahi Rahi Hai',
            '5. Yeh Danturit Muskaan & Fasal',
            '6. Sangatkar',
            '7. Netaji Ka Chashma',
            '8. Balgobin Bhagat',
            '9. Lakhnavi Andaaz',
            '10. Ek Kahani Yeh Bhi',
            '11. Naubatkhane Mein Ibadat',
            '12. Sanskriti'
          ],
          'Hindi Kritika': [
            '1. Mata Ka Anchal',
            '2. Saana Saana Hath Jodi',
            '3. Main Kyun Likhta hun'
          ],
          'Hindi Sparsh': [
            '1. Saakhi',
            '2. Pad',
            '3. Manushyata',
            '4. Parvat Pradesh Mein Paavat',
            '5. Top',
            '6. Kar Chale Hum Fida',
            '7. Aatmatran',
            '8. Bade Bhai Sahab',
            '9. Diary Ka Ek Panna',
            '10. Tatara-Vamiro Katha',
            '11. Teesri Kasam Ke Shilpkar Shailendra',
            '12. Ab Kahan Dusro Ke Dukh Se Dukhi Hone Wale',
            '13. Patjhad Mein Tooti Pattiyan',
            '14. Karthus'
          ]
        }
      };

      // Get chapters based on selected class and subject
      const selectedClassChapters = classWiseChapters[classForm.class_name];
      if (selectedClassChapters && selectedClassChapters[classForm.subject]) {
        setChapters(selectedClassChapters[classForm.subject]);
      } else {
        // Fallback to generic chapters if specific class data not found
        setChapters([]);
      }
      
      // Reset chapter when subject changes
      setClassForm(prev => ({
        ...prev,
        chapter: ''
      }));
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
                      disabled={!classForm.class_name}
                    >
                      <option value="">Select Subject</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Science">Science</option>
                      {classForm.class_name === 'Class 7' ? (
                        <>
                          <option value="Geography">Geography</option>
                          <option value="History">History</option>
                          <option value="Civics">Civics</option>
                          <option value="English Honeycomb">English Honeycomb</option>
                          <option value="Hindi Vasant">Hindi Vasant</option>
                        </>
                      ) : classForm.class_name === 'Class 8' ? (
                        <>
                          <option value="Geography">Geography</option>
                          <option value="History">History</option>
                          <option value="Civics">Civics</option>
                          <option value="English Honeydew">English Honeydew</option>
                          <option value="English It So Happened">English It So Happened</option>
                          <option value="Hindi Vasant">Hindi Vasant</option>
                          <option value="Hindi Durva">Hindi Durva</option>
                          <option value="Hindi Bharat Ki Khoj">Hindi Bharat Ki Khoj</option>
                        </>
                      ) : classForm.class_name === 'Class 9' ? (
                        <>
                          <option value="Geography">Geography</option>
                          <option value="History">History</option>
                          <option value="Civics">Civics</option>
                          <option value="Economics">Economics</option>
                          <option value="Hindi Kshitij">Hindi Kshitij</option>
                          <option value="English Beehive Poems">English Beehive Poems</option>
                          <option value="English Beehive Prose">English Beehive Prose</option>
                          <option value="English Moments">English Moments</option>
                        </>
                      ) : classForm.class_name === 'Class 10' ? (
                        <>
                          <option value="Economics">Economics</option>
                          <option value="History">History</option>
                          <option value="Civics">Civics</option>
                          <option value="Geography">Geography</option>
                          <option value="English First Flight Prose">English First Flight Prose</option>
                          <option value="English First Flight Poems">English First Flight Poems</option>
                          <option value="English Footprints Without Feet">English Footprints Without Feet</option>
                          <option value="Hindi Kshitij">Hindi Kshitij</option>
                          <option value="Hindi Kritika">Hindi Kritika</option>
                          <option value="Hindi Sparsh">Hindi Sparsh</option>
                        </>
                      ) : (
                        <>
                          <option value="Social Science">Social Science</option>
                          <option value="English">English</option>
                          <option value="Hindi">Hindi</option>
                        </>
                      )}
                      {classForm.class_name === 'Class 6' && <option value="Poorvi">Poorvi</option>}
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
