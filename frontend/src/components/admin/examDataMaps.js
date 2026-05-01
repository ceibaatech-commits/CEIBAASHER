// Exam data maps extracted from ExamSheetManager.js for maintainability.
// Static configuration — no runtime dependencies.

export const syllabusTopicsMap = {
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
  
  // RSMSSB (Rajasthan)
  'RSMSSB_Patwari': ['General Science & India GK', 'Rajasthan GK', 'General English & Hindi', 'Mental Ability & Reasoning', 'Basic Computer'],
  
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
export const subjectsMap = {
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
  
  // RSMSSB Patwari specific syllabus topics
  'General Science & India GK': ['General Science', 'Indian History', 'Indian Polity', 'Geography of India'],
  'Rajasthan GK': ['History & Culture', 'Geography of Rajasthan', 'Administration', 'Key Movements'],
  'General English & Hindi': ['Hindi Grammar', 'English Grammar', 'Vocabulary'],
  'Mental Ability & Reasoning': ['Logical Reasoning', 'Problem Solving', 'Mathematics', 'Arithmetic'],
  'Basic Computer': ['Computer Fundamentals', 'Software', 'Hardware & IT'],
  
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
export const subTopicsMap = {
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
  'Phrase Replacement': ['Error Correction', 'Phrase Improvement'],
  
  // RSMSSB Patwari specific sub-topics
  'General Science': ['Physical and Chemical changes', 'Human diseases', 'Nutrition', 'Everyday Science'],
  'Indian History': ['Ancient & Medieval history', 'Indian Freedom Movement', '19th-20th Century History'],
  'Indian Polity': ['Constitution of India', 'Public Policy', 'Rights & Duties', 'Fundamental Rights'],
  'Geography of India': ['Physical Geography', 'Environmental issues', 'Ecology', 'Natural Resources'],
  'History & Culture': ['Major Forts', 'Monuments', 'Fairs & Festivals', 'Folk Arts', 'Handicrafts'],
  'Geography of Rajasthan': ['Physiographic divisions', 'Climate', 'Soil', 'Population', 'Crops', 'Water Resources'],
  'Administration': ['Governor', 'State Assembly', 'High Court', 'District Administration', 'Panchayati Raj'],
  'Key Movements': ['Peasant Movements', 'Tribal Movements', 'Political Integration of Rajasthan'],
  'Hindi Grammar': ['Sandhi', 'Samas', 'Upsarg', 'Pratyay', 'Sentence Correction', 'Shuddhi'],
  'English Grammar': ['Tenses', 'Articles', 'Determiners', 'Sentence Correction', 'Active Passive'],
  'Logical Reasoning': ['Series Making', 'Analogy', 'Classification', 'Coding-Decoding', 'Direction Sense'],
  'Problem Solving': ['Blood Relations', 'Sitting Arrangements', 'Syllogism', 'Statement Conclusions'],
  'Mathematics': ['Average', 'Ratio & Proportion', 'Area & Volume', 'Simple Interest', 'Compound Interest'],
  'Arithmetic': ['Profit & Loss', 'Percentage', 'Unitary Method', 'Time & Work', 'Speed Distance'],
  'Computer Fundamentals': ['RAM', 'ROM', 'File System', 'Input/Output Devices', 'Computer Generations'],
  'Software': ['Operating Systems', 'MS Word', 'MS Excel', 'MS PowerPoint', 'Internet Basics'],
  'Hardware & IT': ['Computer Hardware', 'Characteristics of Computers', 'Recent trends in IT', 'Networking Basics']
};
