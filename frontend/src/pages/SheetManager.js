import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Plus, Trash2, Check, X, ExternalLink } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SheetManager = () => {
  const navigate = useNavigate();
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [testResult, setTestResult] = useState(null);
  
  const [formData, setFormData] = useState({
    exam_id: 'JEE',
    subject: '',
    topic: '',
    sheet_url: '',
    sheet_name: ''
  });

  // All 38 Exams with their complete syllabus structure
  const examSyllabusData = {
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
      "name": "Agniveer Exam",
      "subjects": {
        "General Knowledge": ["Indian History", "Geography", "Current Affairs"],
        "General Science": ["Physics", "Chemistry", "Biology"],
        "Mathematics": ["Arithmetic", "Algebra", "Geometry"]
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

  const handleAdd = async (e) => {
    e.preventDefault();
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
                    onChange={(e) => setFormData({ ...formData, exam_id: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    required
                  >
                    {exams.map(exam => (
                      <option key={exam} value={exam}>{exam}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Physics"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="e.g., Mechanics"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

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
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Add Mapping
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
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-green-400 transition-all">
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
