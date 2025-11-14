import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Clock, Users, TrendingUp, BookOpen, 
  CheckCircle, AlertCircle, ExternalLink, Play,
  Award, Target, Zap, Calendar
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const RRB_NTPC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('ceibaa_user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  };

  const sections = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'notification', label: 'Latest Updates', icon: AlertCircle },
    { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
    { id: 'pattern', label: 'Exam Pattern', icon: Target },
    { id: 'eligibility', label: 'Eligibility', icon: CheckCircle },
    { id: 'weightage', label: 'Weightage Analysis', icon: TrendingUp }
  ];

  const syllabusData = {
    'General Awareness': {
      subjects: [
        'Current Affairs',
        'Static GK',
        'Banking Awareness',
        'Economics'
      ],
      weight: 'High',
      questions_cbt1: 40,
      questions_cbt2: 50
    },
    'Mathematics': {
      subjects: [
        'Algebra',
        'Calculus',
        'Coordinate Geometry',
        'Trigonometry',
        'Statistics',
        'Probability',
        'Vectors',
        'Differential Equations'
      ],
      weight: 'High',
      questions_cbt1: 30,
      questions_cbt2: 35
    },
    'General Intelligence': {
      subjects: [
        'Verbal Reasoning',
        'Non-Verbal Reasoning',
        'Analytical Reasoning'
      ],
      weight: 'High',
      questions_cbt1: 30,
      questions_cbt2: 35
    }
  };

  const examPattern = {
    cbt1: {
      name: 'Computer Based Test (CBT) - Stage 1',
      duration: '90 minutes',
      subjects: [
        { name: 'General Awareness', questions: 40, marks: 40 },
        { name: 'Mathematics', questions: 30, marks: 30 },
        { name: 'General Intelligence & Reasoning', questions: 30, marks: 30 }
      ],
      total: { questions: 100, marks: 100 },
      negativeMarking: '1/3 mark for each wrong answer'
    },
    cbt2: {
      name: 'Computer Based Test (CBT) - Stage 2',
      duration: '90 minutes (120 minutes for PwD candidates)',
      subjects: [
        { name: 'General Awareness', questions: 50, marks: 50 },
        { name: 'Mathematics', questions: 35, marks: 35 },
        { name: 'General Intelligence & Reasoning', questions: 35, marks: 35 }
      ],
      total: { questions: 120, marks: 120 },
      negativeMarking: '1/3 mark for each wrong answer'
    }
  };

  const eligibilityCriteria = {
    age: {
      minimum: '18 years',
      maximum: '33 years (as on 01.01.2026)',
      relaxation: 'Age relaxation as per government norms for SC/ST/OBC/PwD candidates'
    },
    education: {
      undergraduate: '12th Pass or equivalent from a recognized board (for Graduate posts like Commercial cum Ticket Clerk, Accounts Clerk cum Typist, etc.)',
      graduate: 'Graduation in any discipline from a recognized university (for posts like Station Master, Goods Guard, etc.)'
    },
    physical: {
      general: 'Candidates should be physically fit as per Railway standards',
      vision: 'Vision requirements vary by post'
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <SEO 
        title="RRB NTPC 2026 Syllabus, Exam Pattern, Eligibility & Weightage Analysis | Ceibaa"
        description="Complete RRB NTPC 2026 preparation guide: detailed syllabus, exam pattern, weightage analysis, eligibility criteria, and free practice tests. Railway Recruitment Board Non-Technical Popular Categories exam preparation."
        keywords="RRB NTPC 2026, RRB NTPC syllabus, RRB NTPC exam pattern, Railway exam, NTPC weightage, RRB preparation, Station Master exam, Railway recruitment"
      />

      <Header 
        isLoggedIn={isLoggedIn}
        user={user}
        onLogin={() => navigate('/login')}
        onLogout={() => {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('ceibaa_user');
          setUser(null);
          setIsLoggedIn(false);
        }}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full mb-4">
              <span className="text-3xl mr-3">🚂</span>
              <span className="font-bold text-lg">Railway Recruitment 2026</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              RRB NTPC 2026 Complete Guide
            </h1>
            <p className="text-xl text-white/90 mb-6 max-w-3xl mx-auto">
              Railway Recruitment Board - Non-Technical Popular Categories
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-lg">
                <p className="text-sm text-white/80">Expected Vacancies</p>
                <p className="text-2xl font-bold">5,800+</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-lg">
                <p className="text-sm text-white/80">Exam Stages</p>
                <p className="text-2xl font-bold">CBT 1 & 2</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-lg">
                <p className="text-sm text-white/80">Total Marks</p>
                <p className="text-2xl font-bold">100 (CBT 1)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Navigation */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto scrollbar-hide py-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${
                    activeSection === section.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Overview Section */}
            {activeSection === 'overview' && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <FileText className="w-8 h-8 mr-3 text-blue-600" />
                  RRB NTPC Exam Overview
                </h2>
                <div className="prose max-w-none">
                  <p className="text-lg text-gray-700 leading-relaxed mb-4">
                    The Railway Recruitment Board (RRB) conducts the Non-Technical Popular Categories (NTPC) examination for recruitment to various non-technical posts in Indian Railways. This exam is one of the most sought-after government job examinations in India.
                  </p>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mt-6 mb-4">Conducting Body</h3>
                  <p className="text-gray-700">Railway Recruitment Board (RRB) - Ministry of Railways, Government of India</p>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mt-6 mb-4">Selection Process</h3>
                  <div className="grid md:grid-cols-3 gap-4 my-6">
                    <div className="bg-blue-50 p-6 rounded-xl text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">Stage 1</div>
                      <p className="font-semibold">CBT 1</p>
                      <p className="text-sm text-gray-600">100 MCQs</p>
                    </div>
                    <div className="bg-indigo-50 p-6 rounded-xl text-center">
                      <div className="text-3xl font-bold text-indigo-600 mb-2">Stage 2</div>
                      <p className="font-semibold">CBT 2</p>
                      <p className="text-sm text-gray-600">120 MCQs</p>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-xl text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">Stage 3</div>
                      <p className="font-semibold">Skill Test/CBAT</p>
                      <p className="text-sm text-gray-600">Final Round</p>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mt-6 mb-4">Important Posts</h3>
                  <ul className="grid md:grid-cols-2 gap-3 mb-6">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span>Station Master</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span>Goods Guard</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span>Commercial cum Ticket Clerk</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span>Accounts Clerk cum Typist</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span>Junior Clerk cum Typist</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span>Train Clerk</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Latest Notification Section */}
            {activeSection === 'notification' && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <AlertCircle className="w-8 h-8 mr-3 text-orange-600" />
                  Latest Updates & Notifications
                </h2>
                <div className="space-y-4">
                  <div className="bg-orange-50 border-l-4 border-orange-600 p-6 rounded-lg">
                    <div className="flex items-start">
                      <Calendar className="w-6 h-6 text-orange-600 mr-3 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 mb-2">RRB NTPC 2026 Notification Expected</h3>
                        <p className="text-gray-700 mb-3">
                          The official notification for RRB NTPC 2026 is expected to be released soon. Approximately 5,800+ vacancies are anticipated across various non-technical posts.
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Expected Application Start:</strong> March 2026<br />
                          <strong>Expected Last Date:</strong> April 2026<br />
                          <strong>Expected Exam Date:</strong> June-July 2026
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">How to Apply</h3>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700">
                      <li>Visit the official RRB website</li>
                      <li>Click on "Apply Online" for RRB NTPC</li>
                      <li>Register with basic details</li>
                      <li>Fill the application form</li>
                      <li>Upload required documents</li>
                      <li>Pay the application fee</li>
                      <li>Submit and save the application</li>
                    </ol>
                  </div>

                  <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded-lg">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">Application Fee</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li><strong>General/OBC/EWS:</strong> ₹500</li>
                      <li><strong>SC/ST/Ex-Servicemen/PwD/Women:</strong> ₹250</li>
                      <li><strong>Payment Mode:</strong> Online (Credit Card/Debit Card/Net Banking/UPI)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Syllabus Section */}
            {activeSection === 'syllabus' && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <BookOpen className="w-8 h-8 mr-3 text-purple-600" />
                  Detailed Syllabus & Topics
                </h2>
                <div className="space-y-6">
                  {Object.entries(syllabusData).map(([subject, data]) => (
                    <div key={subject} className="border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold text-gray-900">{subject}</h3>
                        <div className="flex gap-3">
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                            CBT 1: {data.questions_cbt1}Q
                          </span>
                          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                            CBT 2: {data.questions_cbt2}Q
                          </span>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        {data.subjects.map((subjectItem, index) => (
                          <div key={index} className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">{subjectItem}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => navigate('/exam/RRB_NTPC')}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all inline-flex items-center space-x-2"
                        >
                          <Play className="w-5 h-5" />
                          <span>Practice {subject}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exam Pattern Section */}
            {activeSection === 'pattern' && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <Target className="w-8 h-8 mr-3 text-green-600" />
                  Exam Pattern & Marking Scheme
                </h2>
                <div className="space-y-8">
                  {/* CBT 1 */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{examPattern.cbt1.name}</h3>
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <p className="text-gray-700"><strong>Duration:</strong> {examPattern.cbt1.duration}</p>
                      <p className="text-gray-700"><strong>Total Questions:</strong> {examPattern.cbt1.total.questions}</p>
                      <p className="text-gray-700"><strong>Total Marks:</strong> {examPattern.cbt1.total.marks}</p>
                      <p className="text-red-600"><strong>Negative Marking:</strong> {examPattern.cbt1.negativeMarking}</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-3 text-left">Subject</th>
                            <th className="border border-gray-300 px-4 py-3 text-center">Questions</th>
                            <th className="border border-gray-300 px-4 py-3 text-center">Marks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {examPattern.cbt1.subjects.map((subject, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-3">{subject.name}</td>
                              <td className="border border-gray-300 px-4 py-3 text-center font-semibold">{subject.questions}</td>
                              <td className="border border-gray-300 px-4 py-3 text-center font-semibold">{subject.marks}</td>
                            </tr>
                          ))}
                          <tr className="bg-blue-100 font-bold">
                            <td className="border border-gray-300 px-4 py-3">Total</td>
                            <td className="border border-gray-300 px-4 py-3 text-center">{examPattern.cbt1.total.questions}</td>
                            <td className="border border-gray-300 px-4 py-3 text-center">{examPattern.cbt1.total.marks}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* CBT 2 */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{examPattern.cbt2.name}</h3>
                    <div className="bg-indigo-50 p-4 rounded-lg mb-4">
                      <p className="text-gray-700"><strong>Duration:</strong> {examPattern.cbt2.duration}</p>
                      <p className="text-gray-700"><strong>Total Questions:</strong> {examPattern.cbt2.total.questions}</p>
                      <p className="text-gray-700"><strong>Total Marks:</strong> {examPattern.cbt2.total.marks}</p>
                      <p className="text-red-600"><strong>Negative Marking:</strong> {examPattern.cbt2.negativeMarking}</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-3 text-left">Subject</th>
                            <th className="border border-gray-300 px-4 py-3 text-center">Questions</th>
                            <th className="border border-gray-300 px-4 py-3 text-center">Marks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {examPattern.cbt2.subjects.map((subject, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-3">{subject.name}</td>
                              <td className="border border-gray-300 px-4 py-3 text-center font-semibold">{subject.questions}</td>
                              <td className="border border-gray-300 px-4 py-3 text-center font-semibold">{subject.marks}</td>
                            </tr>
                          ))}
                          <tr className="bg-indigo-100 font-bold">
                            <td className="border border-gray-300 px-4 py-3">Total</td>
                            <td className="border border-gray-300 px-4 py-3 text-center">{examPattern.cbt2.total.questions}</td>
                            <td className="border border-gray-300 px-4 py-3 text-center">{examPattern.cbt2.total.marks}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Eligibility Section */}
            {activeSection === 'eligibility' && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <CheckCircle className="w-8 h-8 mr-3 text-blue-600" />
                  Eligibility Criteria
                </h2>
                <div className="space-y-6">
                  {/* Age Limit */}
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Age Limit</h3>
                    <div className="space-y-3">
                      <p className="text-gray-700">
                        <strong className="text-blue-600">Minimum Age:</strong> {eligibilityCriteria.age.minimum}
                      </p>
                      <p className="text-gray-700">
                        <strong className="text-blue-600">Maximum Age:</strong> {eligibilityCriteria.age.maximum}
                      </p>
                      <p className="text-gray-600 text-sm bg-yellow-50 p-4 rounded-lg">
                        <strong>Note:</strong> {eligibilityCriteria.age.relaxation}
                      </p>
                    </div>
                  </div>

                  {/* Educational Qualification */}
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Educational Qualification</h3>
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-bold text-gray-900 mb-2">For Undergraduate Level Posts</h4>
                        <p className="text-gray-700">{eligibilityCriteria.education.undergraduate}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-bold text-gray-900 mb-2">For Graduate Level Posts</h4>
                        <p className="text-gray-700">{eligibilityCriteria.education.graduate}</p>
                      </div>
                    </div>
                  </div>

                  {/* Physical Standards */}
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Physical Standards</h3>
                    <div className="space-y-3">
                      <p className="text-gray-700">{eligibilityCriteria.physical.general}</p>
                      <p className="text-gray-700"><strong>Vision:</strong> {eligibilityCriteria.physical.vision}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Weightage Analysis Section */}
            {activeSection === 'weightage' && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <TrendingUp className="w-8 h-8 mr-3 text-orange-600" />
                  Subject-wise Weightage Analysis
                </h2>
                <p className="text-gray-700 mb-6">
                  Understanding the weightage of different subjects and topics is crucial for effective preparation. Focus more time on high-weightage areas.
                </p>

                <div className="space-y-6">
                  {Object.entries(syllabusData).map(([subject, data]) => (
                    <div key={subject} className="border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold text-gray-900">{subject}</h3>
                        <span className={`px-4 py-2 rounded-full font-bold ${
                          data.weight === 'High' ? 'bg-red-100 text-red-700' :
                          data.weight === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {data.weight} Priority
                        </span>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6 mb-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">CBT Stage 1</p>
                          <p className="text-3xl font-bold text-blue-600">{data.questions_cbt1}</p>
                          <p className="text-sm text-gray-700">Questions ({data.questions_cbt1}% of total)</p>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">CBT Stage 2</p>
                          <p className="text-3xl font-bold text-indigo-600">{data.questions_cbt2}</p>
                          <p className="text-sm text-gray-700">Questions ({Math.round(data.questions_cbt2/120*100)}% of total)</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-bold text-gray-900 mb-2">Preparation Strategy</h4>
                        <p className="text-gray-700 text-sm">
                          {data.weight === 'High' 
                            ? `This is a high-weightage section. Allocate maximum study time here. Master all ${data.subjects.length} subjects thoroughly.`
                            : `Focus on core concepts and practice regularly. Cover all ${data.subjects.length} subjects systematically.`
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
                  <h4 className="font-bold text-xl text-gray-900 mb-4">Preparation Tips</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Zap className="w-5 h-5 text-orange-600 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-700">Focus 40% of your time on <strong>General Awareness</strong> as it has the highest weightage</span>
                    </li>
                    <li className="flex items-start">
                      <Zap className="w-5 h-5 text-orange-600 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-700">Practice <strong>Mathematics</strong> daily to improve speed and accuracy</span>
                    </li>
                    <li className="flex items-start">
                      <Zap className="w-5 h-5 text-orange-600 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-700">Take regular mock tests to assess your preparation level</span>
                    </li>
                    <li className="flex items-start">
                      <Zap className="w-5 h-5 text-orange-600 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-700">Revise important topics weekly and solve previous year papers</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl shadow-lg p-6 text-white sticky top-24">
              <h3 className="text-xl font-bold mb-4">Start Practicing</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/exam/RRB_NTPC')}
                  className="w-full bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                >
                  <Play className="w-5 h-5" />
                  <span>Practice Quiz</span>
                </button>
                <button
                  onClick={() => navigate('/join-room')}
                  className="w-full bg-white/10 backdrop-blur-sm border-2 border-white hover:bg-white/20 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
                >
                  <Users className="w-5 h-5" />
                  <span>Join Battle</span>
                </button>
                <button
                  onClick={() => navigate('/social-feed')}
                  className="w-full bg-white/10 backdrop-blur-sm border-2 border-white hover:bg-white/20 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
                >
                  <Award className="w-5 h-5" />
                  <span>Leaderboard</span>
                </button>
              </div>
            </div>

            {/* Key Highlights */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Key Highlights</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">100% Syllabus Coverage</p>
                    <p className="text-sm text-gray-600">All topics covered</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Free Practice Tests</p>
                    <p className="text-sm text-gray-600">Unlimited access</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Live Battles</p>
                    <p className="text-sm text-gray-600">Compete with peers</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Performance Analytics</p>
                    <p className="text-sm text-gray-600">Track your progress</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RRB_NTPC;
