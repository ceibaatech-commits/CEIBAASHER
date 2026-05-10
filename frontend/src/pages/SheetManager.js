import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Plus, Trash2, Check, X, ExternalLink } from 'lucide-react';
import axios from 'axios';

const API_URL = window.location.origin;

const SheetManager = () => {
  const navigate = useNavigate();
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [inputMethod, setInputMethod] = useState('sheet'); // 'sheet' or 'image'
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState(null);
  
  const [formData, setFormData] = useState({
    exam_id: 'JEE',
    subject: '',
    topic: '',
    sheet_url: '',
    sheet_name: ''
  });

  // All Exams with their complete syllabus structure (including CBSE Classes)
  const examSyllabusData = {
    "Class 6": {
      "name": "Class 6 - CBSE",
      "subjects": {
        "Hindi - Malhar": ["1. Mathru Bhumi (Poem)", "2. Gol", "3. Pehli Boond (Poem)", "4. Haar Ki Jeet", "5. Rahim ke dohe (Poem)", "6. Meri ma", "7. Jalate Chalo", "8. Satriya Aur Bihu Nruthya", "9. Maiya Me nahi maakna koyo (Poem)", "10. Pariksha", "11. Chetak ki veeratha", "12. Hindh mahasagar me chota-sa hindustan", "13. Ped Ki Bhata"],
        "Social Science - Exploring Society India and Beyond": ["1. Locating Places on the Earth", "2. Oceans and Continents", "3. Landforms and Life", "4. Timeline and Sources of History", "5. India, That Is Bharat", "6. The Beginnings of Indian Civilisation", "7. India's Cultural Roots", "8. Unity in Diversity, or 'Many in the One'", "9. Family and Community", "10. Grassroots Democracy — Part 1: Governance", "11. Grassroots Democracy — Part 2: Local Government in Rural Areas", "12. Grassroots Democracy — Part 3: Local Government in Urban Areas", "13. The Value of Work", "14. Economic Activities Around Us"],
        "Mathematics - Ganita Prakash": ["1. Patterns in Mathematics", "2. Lines and Angles", "3. Number Play Solutions", "4. Data Handling and Presentation", "5. Prime Time", "6. Perimeter and Area", "7. Fractions", "8. Playing with Construction", "9. Symmetry", "10. The Other Side of Zero"],
        "English - Poorvi": ["1. Fables and Folk Tales", "2. Friendship", "3. Nurturing Nature", "4. Sports and Wellness", "5. Culture and Tradition"],
        "Science - Curiosity": ["1. The Wonderful World of Science", "2. Diversity in the Living World", "3. Mindful Eating: A Path to a Healthy Body", "4. Exploring Magnets", "5. Measurement of Length and Motion", "6. Materials Around Us", "7. Temperature and its Measurement", "8. A Journey through States of Water", "9. Methods of Separation in Everyday Life", "10. Living Creatures: Exploring their Characteristics", "11. Nature's Treasures", "12. Beyond Earth"],
        "Sanskrit - Deepakam": ["1. वयं वर्णमालां पठामः", "2. एषः कः ? एषा का ? एतत् किम् ?", "3. अहं च त्वं च", "4. अहं प्रातः उत्तिष्ठामि", "5. शूराः वयं धीराः वयम्", "6. सः एव महान् चित्रकारः", "7. अतिथिदेवो भव", "8. बुद्धिः सर्वार्थसाधिका", "9. यो जानाति सः पण्डितः", "10. त्वम् आपणं गच्छ", "11. पृथिव्यां त्रीणि रत्नानि", "12. आलस्यं हि मनुष्याणां शरीरस्थो महान् रिपुः", "13. सङ्ख्यागणना ननु सरला", "14. माधवस्य प्रियम् अङ्गम्", "15. वृक्षाः सत्पुरुषाः इव"]
      }
    },
    "JEE": {
      "name": "JEE Main & Advanced",
      "subjects": {
        "Physics": ["Mechanics", "Thermodynamics", "Electromagnetism", "Optics", "Modern Physics"],
        "Chemistry": ["Physical Chemistry", "Organic Chemistry", "Inorganic Chemistry"],
        "Mathematics": ["Algebra", "Calculus", "Coordinate Geometry", "Vectors and 3D", "Trigonometry"]
      }
    },
    "NEET": {
      "name": "NEET UG",
      "subjects": {
        "Physics": ["Mechanics", "Thermodynamics", "Electrodynamics", "Optics & Modern Physics"],
        "Chemistry": ["Physical Chemistry", "Organic Chemistry", "Inorganic Chemistry"],
        "Biology": ["Plant Physiology", "Human Physiology", "Genetics", "Cell Biology", "Ecology"]
      }
    },
    "UPSC": {
      "name": "UPSC CSE",
      "subjects": {
        "General Studies": ["History", "Geography", "Polity", "Economy", "Science & Technology", "Current Affairs"]
      }
    },
    "Agriculture": {
      "name": "Agriculture Exams",
      "subjects": {
        "Agriculture": ["Agronomy", "Horticulture", "Soil Science", "Plant Protection", "Agricultural Economics"],
        "General Studies": ["Current Affairs", "Reasoning & Aptitude"]
      }
    },
    "RPSC": {
      "name": "RPSC Statistical Officer",
      "subjects": {
        "General Knowledge": ["Rajasthan GK", "Indian GK"],
        "Reasoning": ["Logical Reasoning"],
        "Mathematics": ["Arithmetic"],
        "Computer Knowledge": ["Basics"]
      }
    },
    "NDA": {
      "name": "NDA Exam",
      "subjects": {
        "Mathematics": ["Algebra", "Matrices & Determinants", "Trigonometry", "Calculus", "Vector Algebra"],
        "General Ability": ["English", "General Knowledge", "Physics", "Chemistry"]
      }
    },
    "Agniveer": {
      "name": "Tradesman Agniveer",
      "subjects": {
        "General Knowledge": [
          "India and Its Neighboring Countries",
          "Abbreviations",
          "Sports",
          "Awards and Prizes",
          "Terminology",
          "Indian Armed Forces",
          "Continents and Subcontinents",
          "Inventions and Discoveries",
          "The Constitution of India",
          "International Organizations",
          "Books and Authors",
          "Important Events",
          "Current World Events",
          "Prominent Personalities"
        ],
        "Logical Reasoning": ["Logical Ability"],
        "Mathematics": [
          "Number Systems",
          "Fundamental Arithmetical Operations",
          "Algebra",
          "Geometry",
          "Mensuration",
          "Trigonometry"
        ],
        "General Science": [
          "Physics and Chemistry",
          "Biology"
        ]
      }
    },
    "CDS": {
      "name": "CDS Exam",
      "subjects": {
        "English": ["Grammar", "Vocabulary", "Comprehension"],
        "General Knowledge": ["History", "Geography", "Polity", "Economics", "Science"],
        "Elementary Mathematics": ["Arithmetic", "Algebra", "Trigonometry", "Geometry"]
      }
    },
    "CAPF": {
      "name": "UPSC CAPF AC",
      "subjects": {
        "General Ability": ["General Knowledge", "Current Affairs", "Logical Reasoning"],
        "General Studies": ["Essay Writing", "Comprehension", "Communication Skills"]
      }
    },
    "GATE": {
      "name": "GATE",
      "subjects": {
        "Engineering Mathematics": ["Linear Algebra", "Calculus", "Probability"],
        "General Aptitude": ["Verbal Ability", "Numerical Ability"],
        "Core Engineering": ["Technical Fundamentals"]
      }
    },
    "CUET": {
      "name": "CUET",
      "subjects": {
        "General Test": ["General Knowledge", "General Mental Ability", "Numerical Ability"],
        "Language": ["English"],
        "Domain Subject": ["Subject Specific"]
      }
    },
    "UGC_NET": {
      "name": "UGC NET",
      "subjects": {
        "Teaching Aptitude": ["Teaching Methods", "Research Aptitude"],
        "Reasoning": ["Logical Reasoning", "Mathematical Reasoning"],
        "General Awareness": ["Current Affairs", "Higher Education"],
        "Subject Specific": ["Core Subject"]
      }
    },
    "CAT": {
      "name": "CAT",
      "subjects": {
        "Verbal Ability": ["Reading Comprehension", "Verbal Reasoning"],
        "Data Interpretation": ["Tables & Charts", "Data Analysis"],
        "Quantitative Ability": ["Arithmetic", "Algebra", "Geometry"]
      }
    },
    "CLAT": {
      "name": "CLAT",
      "subjects": {
        "English Language": ["Comprehension"],
        "Current Affairs": ["General Knowledge"],
        "Legal Reasoning": ["Legal Aptitude"],
        "Logical Reasoning": ["Critical Thinking"]
      }
    },
    "NATA": {
      "name": "NATA",
      "subjects": {
        "Mathematics": ["Algebra", "Calculus", "Coordinate Geometry"],
        "General Aptitude": ["Visual Perception", "Aesthetic Sensitivity", "Logical Reasoning"],
        "Drawing Ability": ["Sketching"]
      }
    },
    "GMAT": {
      "name": "GMAT",
      "subjects": {
        "Quantitative Reasoning": ["Problem Solving"],
        "Verbal Reasoning": ["Reading Comprehension", "Sentence Correction"],
        "Data Insights": ["Data Analysis"]
      }
    },
    "IBPS_PO": {
      "name": "IBPS PO",
      "subjects": {
        "Reasoning Ability": ["Verbal Reasoning", "Non-Verbal Reasoning", "Puzzles & Seating Arrangement"],
        "Quantitative Aptitude": ["Arithmetic", "Data Interpretation", "Number System"],
        "English Language": ["Reading Comprehension", "Grammar"],
        "General Awareness": ["Banking Awareness", "Current Affairs"]
      }
    },
    "IBPS_CLERK": {
      "name": "IBPS Clerk",
      "subjects": {
        "Reasoning Ability": ["Logical Reasoning", "Seating Arrangement"],
        "Quantitative Aptitude": ["Arithmetic", "Data Interpretation"],
        "English Language": ["Reading Comprehension", "Grammar"],
        "General Awareness": ["Banking & Financial Awareness"],
        "Computer Knowledge": ["Computer Fundamentals"]
      }
    },
    "IBPS_SO": {
      "name": "IBPS SO",
      "subjects": {
        "Reasoning": ["Analytical Reasoning"],
        "Quantitative Aptitude": ["Mathematics"],
        "English Language": ["English Proficiency"],
        "General Awareness": ["Banking & Economy"],
        "Professional Knowledge": ["Specialized Subject"]
      }
    },
    "SBI_PO": {
      "name": "SBI PO",
      "subjects": {
        "Reasoning Ability": ["Puzzles & Seating", "Verbal Reasoning"],
        "Quantitative Aptitude": ["Arithmetic", "Data Interpretation"],
        "English Language": ["Reading Comprehension", "Grammar"],
        "General Awareness": ["Banking Awareness"],
        "Data Analysis": ["Data Interpretation"]
      }
    },
    "SBI_CLERK": {
      "name": "SBI Clerk",
      "subjects": {
        "Reasoning Ability": ["Logical Reasoning", "Puzzles"],
        "Quantitative Aptitude": ["Arithmetic", "DI"],
        "English Language": ["Reading Comprehension", "Grammar"],
        "General Awareness": ["Banking & Current Affairs"],
        "Computer Aptitude": ["Computer Knowledge"]
      }
    },
    "RBI_GRADE_B": {
      "name": "RBI Grade B",
      "subjects": {
        "General Awareness": ["Economy & Banking", "Current Affairs"],
        "English Language": ["Reading Comprehension", "Grammar & Vocabulary"],
        "Quantitative Aptitude": ["Advanced Mathematics"],
        "Reasoning": ["Analytical Reasoning"],
        "Economic & Social Issues": ["Economics"]
      }
    },
    "NABARD": {
      "name": "NABARD Grade A/B",
      "subjects": {
        "Reasoning": ["Logical Reasoning"],
        "Quantitative Aptitude": ["Mathematics & DI"],
        "English Language": ["English Proficiency"],
        "General Awareness": ["Agriculture & Rural Dev"],
        "Computer Knowledge": ["IT & Computers"]
      }
    },
    "IES_ISS": {
      "name": "IES/ISS",
      "subjects": {
        "General English": ["English Proficiency"],
        "General Studies": ["Economics", "Statistics", "Current Affairs"]
      }
    },
    "EPFO": {
      "name": "EPFO EO/AO",
      "subjects": {
        "General Intelligence": ["Reasoning"],
        "General Awareness": ["Current Affairs", "Indian Polity"],
        "Quantitative Aptitude": ["Mathematics"],
        "English Language": ["English"]
      }
    },
    "SSC_CGL": {
      "name": "SSC CGL",
      "subjects": {
        "General Intelligence": ["Reasoning"],
        "General Awareness": ["Current Affairs", "Static GK"],
        "Quantitative Aptitude": ["Arithmetic", "Algebra", "Geometry"],
        "English Comprehension": ["Vocabulary", "Grammar", "Reading Comprehension"]
      }
    },
    "SSC_CHSL": {
      "name": "SSC CHSL",
      "subjects": {
        "General Intelligence": ["Reasoning"],
        "General Awareness": ["GK & Current Affairs"],
        "Quantitative Aptitude": ["Mathematics"],
        "English Language": ["English"]
      }
    },
    "SSC_GD": {
      "name": "SSC GD Constable",
      "subjects": {
        "General Intelligence": ["Reasoning"],
        "General Knowledge": ["General Awareness"],
        "Elementary Mathematics": ["Mathematics"],
        "English": ["English Language"]
      }
    },
    "SSC_STENO": {
      "name": "SSC Stenographer",
      "subjects": {
        "General Intelligence": ["Reasoning"],
        "General Awareness": ["GK"],
        "English Language": ["English"]
      }
    },
    "DSSB_PGT": {
      "name": "DSSB PGT",
      "subjects": {
        "General Awareness": ["General Knowledge", "Delhi GK"],
        "General Intelligence": ["Reasoning", "Numerical Ability"],
        "Subject Specific Knowledge": ["Core Subject"],
        "Teaching Methodology": ["Teaching Aptitude", "Educational Psychology"]
      }
    },
    "DSSB_TGT": {
      "name": "DSSB TGT",
      "subjects": {
        "General Awareness": ["General Knowledge", "Delhi Specific GK"],
        "Reasoning & Aptitude": ["Logical Reasoning", "Numerical Aptitude"],
        "Subject Knowledge": ["Core Subject"],
        "Teaching Methodology": ["Child Psychology", "Teaching Skills"]
      }
    },
    "KVS_PRT": {
      "name": "KVS PRT",
      "subjects": {
        "General Awareness": ["General Knowledge", "KVS & Education"],
        "Reasoning Ability": ["Logical Reasoning"],
        "Child Development & Pedagogy": ["Child Psychology", "Pedagogy"],
        "Language I (Hindi)": ["Hindi"],
        "Language II (English)": ["English"],
        "Mathematics & EVS": ["Mathematics", "Environmental Studies"]
      }
    },
    "CTET": {
      "name": "CTET",
      "subjects": {
        "Child Development & Pedagogy": ["Child Development", "Pedagogy"],
        "Language I": ["Comprehension", "Language Pedagogy"],
        "Language II": ["Comprehension", "Pedagogy"],
        "Mathematics & Science": ["Mathematics", "Science"]
      }
    },
    "MPSET": {
      "name": "MPSET",
      "subjects": {
        "Paper I - Teaching Aptitude": ["Teaching Aptitude", "Research Aptitude"],
        "Reasoning & Comprehension": ["Logical Reasoning", "Comprehension"],
        "General Awareness": ["Higher Education", "ICT & Environment"],
        "Paper II - Subject Specific": ["Core Subject Knowledge", "Subject Pedagogy"]
      }
    },
    "TS_SET": {
      "name": "TS SET",
      "subjects": {
        "Teaching Aptitude": ["Pedagogy"],
        "Research Aptitude": ["Research Methods"],
        "Comprehension": ["Reading & Communication"],
        "Subject Knowledge": ["Subject Specific"]
      }
    },
    "UP_TGT": {
      "name": "UP TGT",
      "subjects": {
        "General Knowledge": ["GK & Current Affairs"],
        "General Hindi": ["Hindi Language"],
        "Subject Knowledge": ["Subject Specific"],
        "General Intelligence": ["Reasoning"]
      }
    },
    "UP_PGT": {
      "name": "UP PGT",
      "subjects": {
        "General Knowledge": ["GK"],
        "General Hindi": ["Hindi"],
        "Subject Knowledge": ["Subject Specific"],
        "Teaching Aptitude": ["Pedagogy"]
      }
    },
    "HTET": {
      "name": "HTET",
      "subjects": {
        "Child Development": ["CDP & Pedagogy"],
        "Language I": ["Hindi/English"],
        "Language II": ["Sanskrit/Other"],
        "Mathematics/Science": ["Subject & Pedagogy"],
        "Social Studies/EVS": ["Subject & Pedagogy"]
      }
    },
    // Language Proficiency Tests - Standardized (3 Categories Only)
    "SPANISH": {
      "name": "Spanish Language Proficiency",
      "subjects": {
        "Gap-fill": ["Fill in the blanks", "Complete the sentence"],
        "Vocabulary Building": ["Synonyms", "Antonyms", "Word meanings"],
        "One Word Substitution": ["Replace phrases with single words"]
      }
    },
    "FRENCH": {
      "name": "French Language Proficiency",
      "subjects": {
        "Gap-fill": ["Fill in the blanks", "Complete the sentence"],
        "Vocabulary Building": ["Synonyms", "Antonyms", "Word meanings"],
        "One Word Substitution": ["Replace phrases with single words"]
      }
    },
    "TAMIL": {
      "name": "Tamil Language Proficiency",
      "subjects": {
        "Gap-fill": ["Fill in the blanks", "Complete the sentence"],
        "Vocabulary Building": ["Synonyms", "Antonyms", "Word meanings"],
        "One Word Substitution": ["Replace phrases with single words"]
      }
    },
    "TELUGU": {
      "name": "Telugu Language Proficiency",
      "subjects": {
        "Gap-fill": ["Fill in the blanks", "Complete the sentence"],
        "Vocabulary Building": ["Synonyms", "Antonyms", "Word meanings"],
        "One Word Substitution": ["Replace phrases with single words"]
      }
    },
    "KANNADA": {
      "name": "Kannada Language Proficiency",
      "subjects": {
        "Gap-fill": ["Fill in the blanks", "Complete the sentence"],
        "Vocabulary Building": ["Synonyms", "Antonyms", "Word meanings"],
        "One Word Substitution": ["Replace phrases with single words"]
      }
    },
    "CHINESE": {
      "name": "Chinese Language Proficiency",
      "subjects": {
        "Gap-fill": ["Fill in the blanks", "Complete the sentence"],
        "Vocabulary Building": ["Synonyms", "Antonyms", "Word meanings"],
        "One Word Substitution": ["Replace phrases with single words"]
      }
    },
    "JAPANESE": {
      "name": "Japanese Language Proficiency",
      "subjects": {
        "Gap-fill": ["Fill in the blanks", "Complete the sentence"],
        "Vocabulary Building": ["Synonyms", "Antonyms", "Word meanings"],
        "One Word Substitution": ["Replace phrases with single words"]
      }
    },
    "KOREAN": {
      "name": "Korean Language Proficiency",
      "subjects": {
        "Gap-fill": ["Fill in the blanks", "Complete the sentence"],
        "Vocabulary Building": ["Synonyms", "Antonyms", "Word meanings"],
        "One Word Substitution": ["Replace phrases with single words"]
      }
    }
  };

  const exams = Object.keys(examSyllabusData);
  const selectedExamData = examSyllabusData[formData.exam_id] || { subjects: {} };
  const availableSubjects = Object.keys(selectedExamData.subjects);
  const availableTopics = selectedExamData.subjects[formData.subject] || [];

  useEffect(() => {
    fetchSheets();
  }, []);

  const fetchSheets = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/sheets/list`);
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

    if (!formData.exam_id || !formData.subject) {
      alert('Please select Exam and Subject');
      return;
    }

    setExtracting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('image', selectedImage);
      formDataToSend.append('exam_id', formData.exam_id);
      formDataToSend.append('exam_name', examSyllabusData[formData.exam_id].name);
      formDataToSend.append('syllabus_topic', formData.subject);
      formDataToSend.append('subject', formData.topic || formData.subject);
      if (formData.sub_topic) {
        formDataToSend.append('sub_topic', formData.sub_topic);
      }

      const response = await axios.post(
        `${API_URL}/api/extract-questions-from-image`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setExtractedQuestions(response.data);
        alert(`Successfully extracted and saved ${response.data.questions_count} questions!`);
        setShowAddForm(false);
        setSelectedImage(null);
        setImagePreview(null);
        fetchSheets();
      }
    } catch (error) {
      console.error('Error extracting questions:', error);
      alert(error.response?.data?.detail || 'Failed to extract questions from image');
    } finally {
      setExtracting(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();

    // If image method, use image extraction
    if (inputMethod === 'image') {
      return handleImageExtraction(e);
    }
    try {
      const response = await axios.post(`${API_URL}/api/sheets/add`, formData);
      if (response.data.success) {
        alert('Sheet mapping added successfully!');
        setShowAddForm(false);
        setFormData({ exam_id: 'NEET', subject: '', topic: '', sheet_url: '', sheet_name: '' });
        fetchSheets();
      }
    } catch (error) {
      alert('Error adding sheet: ' + error.message);
    }
  };

  const handleDelete = async (sheet) => {
    if (window.confirm(`Delete sheet mapping for ${sheet.exam_id} > ${sheet.subject} > ${sheet.topic}?`)) {
      try {
        await axios.delete(`${API_URL}/api/sheets/delete/${sheet.exam_id}/${sheet.subject}/${sheet.topic}`);
        fetchSheets();
      } catch (error) {
        alert('Error deleting sheet: ' + error.message);
      }
    }
  };

  const testSheetAccess = async () => {
    setTestResult(null);
    try {
      const response = await axios.post(`${API_URL}/api/sheets/test`, {
        sheet_url: formData.sheet_url
      });
      setTestResult(response.data);
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FileSpreadsheet className="w-8 h-8 text-green-600 mr-3" />
                Google Sheets Manager
              </h1>
              <p className="text-gray-600 mt-2">Configure question banks for each exam topic</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span>Add Sheet</span>
            </button>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Sheet Mapping</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam</label>
                  <select
                    value={formData.exam_id}
                    onChange={(e) => setFormData({ ...formData, exam_id: e.target.value, subject: '', topic: '' })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    required
                  >
                    {exams.map(exam => (
                      <option key={exam} value={exam}>{examSyllabusData[exam].name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value, topic: '' })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    required
                  >
                    <option value="">-- Select Subject --</option>
                    {availableSubjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Topic (Optional)</label>
                  <select
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    disabled={!formData.subject}
                  >
                    <option value="">-- Select Topic (Optional) --</option>
                    {availableTopics.map(topic => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Input Method Selection */}
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => {setInputMethod('sheet'); setSelectedImage(null); setImagePreview(null);}}
                  className={`flex-1 py-3 rounded-lg font-semibold transition ${inputMethod === 'sheet' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Google Sheet URL
                </button>
                <button
                  type="button"
                  onClick={() => {setInputMethod('image'); setFormData({...formData, sheet_url: ''});}}
                  className={`flex-1 py-3 rounded-lg font-semibold transition ${inputMethod === 'image' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Extract from Image
                </button>
              </div>

              {inputMethod === 'sheet' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Google Sheet URL</label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={formData.sheet_url}
                      onChange={(e) => setFormData({ ...formData, sheet_url: e.target.value })}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={testSheetAccess}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                    >
                      Test Access
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Question Image</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto mb-4" />
                      ) : (
                        <div className="text-gray-500">
                          <p className="text-lg font-semibold mb-2">Click to upload image</p>
                          <p className="text-sm">PNG, JPG, JPEG supported</p>
                        </div>
                      )}
                    </label>
                  </div>
                  {selectedImage && (
                    <p className="text-sm text-gray-600 mt-2">Selected: {selectedImage.name}</p>
                  )}
                </div>
              )}

              {testResult && (
                <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-100 border-2 border-green-500' : 'bg-red-100 border-2 border-red-500'}`}>
                  {testResult.success ? (
                    <div className="flex items-center text-green-800">
                      <Check className="w-5 h-5 mr-2" />
                      <span>Sheet accessible! Found {testResult.row_count} rows</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-800">
                      <X className="w-5 h-5 mr-2" />
                      <span>Error: {testResult.error}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-4">
                <button
                  type="submit"
                  disabled={extracting}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {extracting ? 'Extracting Questions...' : inputMethod === 'image' ? 'Extract & Save Questions' : 'Add Mapping'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setTestResult(null);
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sheets List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Configured Sheets ({sheets.length})</h2>
          
          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : sheets.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No sheet mappings configured yet</p>
              <p className="text-sm text-gray-500 mt-2">Click "Add Sheet" to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sheets.map((sheet, index) => (
                <div key={sheet.id || sheet.sheet_url || `sheet-${index}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-green-400 transition-all">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-lg text-gray-900">{sheet.exam_id}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-blue-600 font-semibold">{sheet.subject}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-purple-600 font-semibold">{sheet.topic}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <ExternalLink className="w-4 h-4" />
                      <a 
                        href={sheet.sheet_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 truncate"
                      >
                        {sheet.sheet_url}
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(sheet)}
                    className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors ml-4"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mt-6">
          <h3 className="font-bold text-blue-900 mb-3">📝 How to Use:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Create a Google Sheet with your questions in this format: <code className="bg-white px-2 py-1 rounded">QUESTION NUMBER | Question | A | B | C | D | Answer | Explanation</code></li>
            <li>Make the sheet public (Anyone with the link can view)</li>
            <li>Copy the sheet URL and add it here with Exam/Subject/Topic mapping</li>
            <li>Test access to verify the sheet is readable</li>
            <li>Students will now get questions from your Google Sheet when they start a quiz for that topic!</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default SheetManager;
