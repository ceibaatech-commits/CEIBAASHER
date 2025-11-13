import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileSpreadsheet, Plus, Edit, Trash2, ExternalLink, 
  Search, Filter, Download, Upload, CheckCircle, XCircle,
  ChevronDown, AlertCircle, RefreshCw, Save, Link as LinkIcon
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ExamSheetManager = () => {
  const [selectedOption, setSelectedOption] = useState('exam'); // 'exam' or 'class'
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
    sub_sub_topic: '',
    sheet_link: ''
  });

  // Form data for Option 2: Class-based
  const [classForm, setClassForm] = useState({
    class_name: '',
    subject: '',
    chapter: '',
    sheet_link: ''
  });

  // Comprehensive dropdown data
  const examNames = ['NEET', 'JEE Main', 'JEE Advanced', 'UPSC CSE', 'UPSC NDA', 'SSC CGL', 'SSC CHSL', 'IBPS PO', 'IBPS Clerk', 'RRB NTPC', 'AFCAT', 'GATE', 'CAT', 'CLAT', 'AIIMS', 'JIPMER'];
  const classNames = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

  // Comprehensive syllabus topics map
  const syllabusTopicsMap = {
    'NEET': ['Physics', 'Chemistry', 'Biology'],
    'JEE Main': ['Physics', 'Chemistry', 'Mathematics'],
    'JEE Advanced': ['Physics', 'Chemistry', 'Mathematics'],
    'UPSC CSE': ['General Studies Paper 1', 'General Studies Paper 2', 'General Studies Paper 3', 'General Studies Paper 4', 'Optional Subject', 'Essay'],
    'UPSC NDA': ['Mathematics', 'General Ability Test'],
    'SSC CGL': ['General Intelligence', 'General Awareness', 'Quantitative Aptitude', 'English Comprehension'],
    'SSC CHSL': ['General Intelligence', 'General Awareness', 'Quantitative Aptitude', 'English Language'],
    'IBPS PO': ['Reasoning Ability', 'English Language', 'Quantitative Aptitude', 'General Awareness', 'Computer Knowledge'],
    'IBPS Clerk': ['Reasoning Ability', 'English Language', 'Quantitative Aptitude', 'General Awareness', 'Computer Knowledge'],
    'RRB NTPC': ['General Awareness', 'Mathematics', 'General Intelligence'],
    'AFCAT': ['English', 'General Awareness', 'Numerical Ability', 'Reasoning & Military Aptitude'],
    'GATE': ['Engineering Mathematics', 'General Aptitude', 'Technical Subject'],
    'CAT': ['Verbal Ability', 'Data Interpretation', 'Logical Reasoning', 'Quantitative Aptitude'],
    'CLAT': ['English Language', 'Current Affairs', 'Legal Reasoning', 'Logical Reasoning', 'Quantitative Techniques'],
    'AIIMS': ['Physics', 'Chemistry', 'Biology', 'General Knowledge'],
    'JIPMER': ['Physics', 'Chemistry', 'Biology', 'English']
  };

  // Comprehensive subjects map
  const subjectsMap = {
    // Science subjects
    'Physics': ['Mechanics', 'Thermodynamics', 'Optics', 'Electromagnetism', 'Modern Physics', 'Waves', 'Sound', 'Electricity'],
    'Chemistry': ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry'],
    'Biology': ['Botany', 'Zoology', 'Ecology', 'Genetics', 'Evolution', 'Human Physiology'],
    'Mathematics': ['Algebra', 'Calculus', 'Coordinate Geometry', 'Trigonometry', 'Statistics', 'Probability', 'Vectors', 'Differential Equations'],
    
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
    'Verbal Ability': ['Reading Comprehension', 'Para Jumbles', 'Grammar', 'Vocabulary'],
    'Data Interpretation': ['Tables', 'Graphs', 'Charts', 'Data Analysis'],
    'Logical Reasoning': ['Puzzles', 'Arrangements', 'Blood Relations', 'Direction Sense'],
    
    // CLAT subjects
    'Legal Reasoning': ['Legal Principles', 'Case Studies', 'Legal Maxims'],
    'Current Affairs': ['National Events', 'International Events', 'Sports', 'Awards'],
    'Quantitative Techniques': ['Arithmetic', 'Algebra', 'Data Interpretation'],
    
    // GATE subjects
    'Engineering Mathematics': ['Linear Algebra', 'Calculus', 'Probability', 'Differential Equations'],
    'General Aptitude': ['Verbal Ability', 'Numerical Ability', 'Reasoning'],
    'Technical Subject': ['Core Concepts', 'Advanced Topics', 'Problem Solving'],
    
    // AFCAT subjects
    'English': ['Reading Comprehension', 'Vocabulary', 'Grammar', 'Error Detection', 'Sentence Improvement'],
    'Numerical Ability': ['Arithmetic', 'Algebra', 'Mensuration', 'Data Interpretation'],
    'Reasoning & Military Aptitude': ['Verbal Reasoning', 'Non-Verbal Reasoning', 'Spatial Ability', 'Military Aptitude']
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
    'Economics': ['Indian Economy', 'Economic Terms', 'Budget', 'GDP']
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
        sub_topic: '',
        sub_sub_topic: ''
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
        sub_topic: '',
        sub_sub_topic: ''
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
        sub_topic: '',
        sub_sub_topic: ''
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
            '12. Ratio and Proportion',
            '13. Symmetry',
            '14. Practical Geometry'
          ],
          'Science': [
            '1. Food – Where Does it Come From?',
            '2. Components of Food',
            '3. Fibre to Fabric',
            '4. Sorting Materials into Groups',
            '5. Separation of Substances',
            '6. Changes Around Us',
            '7. Getting to Know Plants',
            '8. Body Movements',
            '9. The Living Organisms & Their Surroundings',
            '10. Motion and Measurement of Distances',
            '11. Light, Shadows and Reflections',
            '12. Electricity and Circuits',
            '13. Fun with Magnets',
            '14. Water',
            '15. Air Around Us',
            '16. Garbage In – Garbage Out'
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
            'व्याकरण - संज्ञा',
            'व्याकरण - सर्वनाम',
            'व्याकरण - विशेषण',
            'व्याकरण - क्रिया',
            'व्याकरण - काल',
            'व्याकरण - वाक्य',
            'अपठित गद्यांश',
            'पत्र लेखन',
            'निबंध लेखन',
            'कहानी लेखन',
            'कविता',
            'गद्य पाठ'
          ]
        },
        'Class 7': {
          'Mathematics': [
            '1. Integers',
            '2. Fractions and Decimals',
            '3. Data Handling',
            '4. Simple Equations',
            '5. Lines and Angles',
            '6. The Triangle and its Properties',
            '7. Congruence of Triangles',
            '8. Comparing Quantities',
            '9. Rational Numbers',
            '10. Practical Geometry',
            '11. Perimeter and Area',
            '12. Algebraic Expressions',
            '13. Exponents and Powers',
            '14. Symmetry',
            '15. Visualising Solid Shapes'
          ],
          'Science': [
            '1. Nutrition in Plants',
            '2. Nutrition in Animals',
            '3. Fibre to Fabric',
            '4. Heat',
            '5. Acids, Bases and Salts',
            '6. Physical and Chemical Changes',
            '7. Weather, Climate and Adaptations',
            '8. Winds, Storms and Cyclones',
            '9. Soil',
            '10. Respiration in Organisms',
            '11. Transportation in Animals and Plants',
            '12. Reproduction in Plants',
            '13. Motion and Time',
            '14. Electric Current and its Effects',
            '15. Light',
            '16. Water: A Precious Resource',
            '17. Forests: Our Lifeline',
            '18. Wastewater Story'
          ],
          'Social Science': [
            'History - Tracing Changes Through a Thousand Years',
            'History - New Kings and Kingdoms',
            'History - The Delhi Sultans',
            'History - The Mughal Empire',
            'History - Rulers and Buildings',
            'History - Towns, Traders and Craftspersons',
            'History - Tribes, Nomads and Settled Communities',
            'History - Devotional Paths to the Divine',
            'History - The Making of Regional Cultures',
            'History - Eighteenth-Century Political Formations',
            'Geography - Environment',
            'Geography - Inside Our Earth',
            'Geography - Our Changing Earth',
            'Geography - Air',
            'Geography - Water',
            'Geography - Natural Vegetation and Wildlife',
            'Geography - Human Environment',
            'Civics - On Equality',
            'Civics - Role of the Government in Health',
            'Civics - How the State Government Works',
            'Civics - Growing up as Boys and Girls',
            'Civics - Women Change the World',
            'Civics - Understanding Media',
            'Civics - Understanding Advertising',
            'Civics - Markets Around Us'
          ],
          'English': [
            'Grammar - Tenses',
            'Grammar - Voice',
            'Grammar - Narration',
            'Grammar - Modals',
            'Grammar - Determiners',
            'Comprehension',
            'Letter Writing',
            'Essay Writing',
            'Story Writing',
            'Poetry Analysis',
            'Prose Analysis'
          ],
          'Hindi': [
            'व्याकरण - संज्ञा और उसके भेद',
            'व्याकरण - सर्वनाम',
            'व्याकरण - विशेषण',
            'व्याकरण - क्रिया और उसके भेद',
            'व्याकरण - काल',
            'व्याकरण - वाक्य और उसके भेद',
            'अपठित बोध',
            'पत्र लेखन',
            'निबंध लेखन',
            'कविता',
            'गद्य'
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
          'Hindi': [
            'व्याकरण',
            'अपठित गद्यांश',
            'अपठित काव्यांश',
            'पत्र लेखन',
            'निबंध लेखन',
            'कहानी लेखन',
            'संवाद लेखन',
            'कविता',
            'गद्य पाठ'
          ]
        },
        'Class 9': {
          'Mathematics': [
            '1. Number Systems',
            '2. Polynomials',
            '3. Coordinate Geometry',
            '4. Linear Equations in Two Variables',
            '5. Introduction to Euclid\'s Geometry',
            '6. Lines and Angles',
            '7. Triangles',
            '8. Quadrilaterals',
            '9. Areas of Parallelograms and Triangles',
            '10. Circles',
            '11. Constructions',
            '12. Heron\'s Formula',
            '13. Surface Areas and Volumes',
            '14. Statistics',
            '15. Probability'
          ],
          'Science': [
            '1. Matter in Our Surroundings',
            '2. Is Matter Around Us Pure?',
            '3. Atoms and Molecules',
            '4. Structure of the Atom',
            '5. The Fundamental Unit of Life',
            '6. Tissues',
            '7. Diversity in Living Organisms',
            '8. Motion',
            '9. Force and Laws of Motion',
            '10. Gravitation',
            '11. Work and Energy',
            '12. Sound',
            '13. Why Do We Fall Ill?',
            '14. Natural Resources',
            '15. Improvement in Food Resources'
          ],
          'Social Science': [
            'History - The French Revolution',
            'History - Socialism in Europe and the Russian Revolution',
            'History - Nazism and the Rise of Hitler',
            'History - Forest Society and Colonialism',
            'History - Pastoralists in the Modern World',
            'Geography - India – Size and Location',
            'Geography - Physical Features of India',
            'Geography - Drainage',
            'Geography - Climate',
            'Geography - Natural Vegetation and Wildlife',
            'Geography - Population',
            'Civics - What is Democracy? Why Democracy?',
            'Civics - Constitutional Design',
            'Civics - Electoral Politics',
            'Civics - Working of Institutions',
            'Civics - Democratic Rights',
            'Economics - The Story of Village Palampur',
            'Economics - People as Resource',
            'Economics - Poverty as a Challenge',
            'Economics - Food Security in India'
          ],
          'English': [
            'Grammar - Tenses',
            'Grammar - Modals',
            'Grammar - Active and Passive Voice',
            'Grammar - Direct and Indirect Speech',
            'Grammar - Subject-Verb Agreement',
            'Comprehension',
            'Letter Writing',
            'Essay Writing',
            'Story Writing',
            'Poetry',
            'Prose'
          ],
          'Hindi': [
            'व्याकरण - शब्द और पद',
            'व्याकरण - रचना के आधार पर वाक्य भेद',
            'व्याकरण - समास',
            'व्याकरण - उपसर्ग',
            'व्याकरण - प्रत्यय',
            'अपठित बोध',
            'पत्र लेखन',
            'निबंध लेखन',
            'संवाद लेखन',
            'कविता',
            'गद्य'
          ]
        },
        'Class 10': {
          'Mathematics': [
            '1. Real Numbers',
            '2. Polynomials',
            '3. Pair of Linear Equations in Two Variables',
            '4. Quadratic Equations',
            '5. Arithmetic Progressions',
            '6. Triangles',
            '7. Coordinate Geometry',
            '8. Introduction to Trigonometry',
            '9. Some Applications of Trigonometry',
            '10. Circles',
            '11. Constructions',
            '12. Areas Related to Circles',
            '13. Surface Areas and Volumes',
            '14. Statistics',
            '15. Probability'
          ],
          'Science': [
            '1. Chemical Reactions and Equations',
            '2. Acids, Bases and Salts',
            '3. Metals and Non-metals',
            '4. Carbon and its Compounds',
            '5. Periodic Classification of Elements',
            '6. Life Processes',
            '7. Control and Coordination',
            '8. How do Organisms Reproduce?',
            '9. Heredity and Evolution',
            '10. Light – Reflection and Refraction',
            '11. Human Eye and Colourful World',
            '12. Electricity',
            '13. Magnetic Effects of Electric Current',
            '14. Sources of Energy',
            '15. Our Environment',
            '16. Management of Natural Resources'
          ],
          'Social Science': [
            'History - The Rise of Nationalism in Europe',
            'History - Nationalism in India',
            'History - The Making of a Global World',
            'History - The Age of Industrialisation',
            'History - Print Culture and the Modern World',
            'Geography - Resources and Development',
            'Geography - Forest and Wildlife Resources',
            'Geography - Water Resources',
            'Geography - Agriculture',
            'Geography - Minerals and Energy Resources',
            'Geography - Manufacturing Industries',
            'Geography - Lifelines of National Economy',
            'Civics - Power Sharing',
            'Civics - Federalism',
            'Civics - Democracy and Diversity',
            'Civics - Gender, Religion and Caste',
            'Civics - Popular Struggles and Movements',
            'Civics - Political Parties',
            'Civics - Outcomes of Democracy',
            'Economics - Development',
            'Economics - Sectors of the Indian Economy',
            'Economics - Money and Credit',
            'Economics - Globalisation and the Indian Economy',
            'Economics - Consumer Rights'
          ],
          'English': [
            'Grammar - Tenses',
            'Grammar - Modals',
            'Grammar - Active and Passive Voice',
            'Grammar - Direct and Indirect Speech',
            'Grammar - Clauses',
            'Comprehension',
            'Letter Writing',
            'Essay Writing',
            'Story Writing',
            'Poetry',
            'Prose'
          ],
          'Hindi': [
            'व्याकरण',
            'अपठित बोध',
            'पत्र लेखन',
            'निबंध लेखन',
            'कहानी लेखन',
            'संवाद लेखन',
            'विज्ञापन लेखन',
            'कविता',
            'गद्य'
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
      sub_sub_topic: '',
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
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sub Topic *
                    </label>
                    <select
                      required
                      value={examForm.sub_topic}
                      onChange={(e) => setExamForm({ ...examForm, sub_topic: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!examForm.subject}
                    >
                      <option value="">Select Sub Topic</option>
                      {subTopics.map(topic => (
                        <option key={topic} value={topic}>{topic}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sub-Sub Topic */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sub-Sub Topic (Optional)
                    </label>
                    <input
                      type="text"
                      value={examForm.sub_sub_topic}
                      onChange={(e) => setExamForm({ ...examForm, sub_sub_topic: e.target.value })}
                      placeholder="Enter sub-sub topic if applicable"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
                    >
                      <option value="">Select Subject</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Science">Science</option>
                      <option value="English">English</option>
                      <option value="Social Science">Social Science</option>
                      <option value="Hindi">Hindi</option>
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
                            <p className="text-gray-500 text-xs">{sheet.sub_topic} {sheet.sub_sub_topic && `→ ${sheet.sub_sub_topic}`}</p>
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
