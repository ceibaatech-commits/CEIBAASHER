import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Clock, Users, TrendingUp, BookOpen, 
  CheckCircle, AlertCircle, ExternalLink, Play,
  Award, Target, Zap, Calendar, Shield
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import ExamActions from '../components/ExamActions';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AFCAT = () => {
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
    'English': {
      subjects: [
        'Reading Comprehension',
        'Vocabulary',
        'Grammar',
        'Error Detection',
        'Sentence Improvement'
      ],
      weight: 'High',
      questions: 30,
      marks: 90
    },
    'General Awareness': {
      subjects: [
        'Current Affairs',
        'Static GK',
        'Banking Awareness',
        'Economics'
      ],
      weight: 'High',
      questions: 25,
      marks: 75
    },
    'Numerical Ability': {
      subjects: [
        'Arithmetic',
        'Algebra',
        'Mensuration',
        'Data Interpretation'
      ],
      weight: 'Medium',
      questions: 20,
      marks: 60
    },
    'Reasoning & Military Aptitude': {
      subjects: [
        'Verbal Reasoning',
        'Non-Verbal Reasoning',
        'Spatial Ability',
        'Military Aptitude'
      ],
      weight: 'High',
      questions: 25,
      marks: 75
    }
  };

  const examPattern = {
    afcat: {
      name: 'AFCAT (Air Force Common Admission Test)',
      duration: '120 minutes (2 hours)',
      subjects: [
        { name: 'English', questions: 30, marks: 90 },
        { name: 'General Awareness', questions: 25, marks: 75 },
        { name: 'Numerical Ability', questions: 20, marks: 60 },
        { name: 'Reasoning & Military Aptitude Test', questions: 25, marks: 75 }
      ],
      total: { questions: 100, marks: 300 },
      negativeMarking: '1 mark for each wrong answer'
    },
    ekt: {
      name: 'EKT (Engineering Knowledge Test) - Technical Branch Only',
      duration: '45 minutes',
      description: 'For candidates applying to Technical Branch only',
      note: 'Covers Mechanical, Computer Science, and Electronics Engineering topics'
    }
  };

  const eligibilityCriteria = {
    age: {
      flyingBranch: '20-24 years (as on 01.01.2026)',
      groundDuty: '20-26 years (as on 01.01.2026)',
      ncc: 'Upper age relaxation of 2 years for NCC C Certificate holders'
    },
    education: {
      flyingBranch: 'Graduation in any discipline with minimum 60% marks (50% for defence personnel)',
      groundDutyTechnical: 'B.E./B.Tech in specified streams with minimum 60% marks',
      groundDutyNonTechnical: 'Graduation in any discipline with minimum 60% marks'
    },
    physical: {
      height: 'Minimum 152.5 cm',
      weight: 'Proportionate to height and age',
      eyesight: 'Healthy eyes with good vision (corrective glasses allowed for Ground Duty)',
      flyingStandards: 'Must meet strict medical standards for Flying Branch'
    },
    maritalStatus: 'Only unmarried candidates are eligible'
  };

  const branches = [
    {
      name: 'Flying Branch',
      description: 'Become a pilot in Indian Air Force',
      requirements: 'Any graduation with 60% + Pass in Physics & Maths at 10+2',
      icon: '✈️'
    },
    {
      name: 'Ground Duty (Technical)',
      description: 'Technical roles in maintenance and operations',
      requirements: 'B.E./B.Tech in specified branches with 60%',
      icon: '⚙️'
    },
    {
      name: 'Ground Duty (Non-Technical)',
      description: 'Administrative, logistics, and support roles',
      requirements: 'Any graduation with 60% marks',
      icon: '📋'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <SEO 
        title="AFCAT 2026 Syllabus, Exam Pattern, Eligibility & Preparation Guide | Ceibaa"
        description="Complete AFCAT 2026 preparation: Indian Air Force Common Admission Test syllabus, exam pattern, eligibility criteria, weightage analysis. Free practice tests for Flying & Ground Duty branches."
        keywords="AFCAT 2026, Air Force exam, AFCAT syllabus, Indian Air Force, Flying branch, Ground Duty, AFCAT exam pattern, military aptitude test, Air Force career"
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
      <div className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full mb-4">
              <span className="text-3xl mr-3">✈️</span>
              <span className="font-bold text-lg">Indian Air Force Recruitment 2026</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              AFCAT 2026 Complete Guide
            </h1>
            <p className="text-xl text-white/90 mb-2 max-w-3xl mx-auto">
              Air Force Common Admission Test
            </p>
            <p className="text-lg text-white/80 mb-6 max-w-2xl mx-auto font-semibold">
              Touch the Sky with Glory - Join Indian Air Force
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-lg">
                <p className="text-sm text-white/80">Exam Conducted</p>
                <p className="text-2xl font-bold">Twice a Year</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-lg">
                <p className="text-sm text-white/80">Total Questions</p>
                <p className="text-2xl font-bold">100 MCQs</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-lg">
                <p className="text-sm text-white/80">Total Marks</p>
                <p className="text-2xl font-bold">300</p>
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
                  <Shield className="w-8 h-8 mr-3 text-blue-600" />
                  AFCAT Exam Overview
                </h2>
                <div className="prose max-w-none">
                  <p className="text-lg text-gray-700 leading-relaxed mb-4">
                    The Air Force Common Admission Test (AFCAT) is conducted by the Indian Air Force for the recruitment of officers in Flying and Ground Duty (Technical & Non-Technical) branches. It is one of the most prestigious defense examinations in India.
                  </p>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mt-6 mb-4">Conducting Body</h3>
                  <p className="text-gray-700">Indian Air Force (IAF) - Ministry of Defence, Government of India</p>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mt-6 mb-4">Selection Process</h3>
                  <div className="grid md:grid-cols-3 gap-4 my-6">
                    <div className="bg-sky-50 p-6 rounded-xl text-center">
                      <div className="text-3xl font-bold text-sky-600 mb-2">Stage 1</div>
                      <p className="font-semibold">AFCAT Written Test</p>
                      <p className="text-sm text-gray-600">100 MCQs - 300 Marks</p>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-xl text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">Stage 2</div>
                      <p className="font-semibold">AFSB Interview</p>
                      <p className="text-sm text-gray-600">5 Days Testing</p>
                    </div>
                    <div className="bg-indigo-50 p-6 rounded-xl text-center">
                      <div className="text-3xl font-bold text-indigo-600 mb-2">Stage 3</div>
                      <p className="font-semibold">Medical Examination</p>
                      <p className="text-sm text-gray-600">Final Selection</p>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mt-6 mb-4">Available Branches</h3>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    {branches.map((branch, index) => (
                      <div key={index} className="border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                        <div className="text-4xl mb-3">{branch.icon}</div>
                        <h4 className="font-bold text-lg text-gray-900 mb-2">{branch.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">{branch.description}</p>
                        <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">{branch.requirements}</p>
                      </div>
                    ))}
                  </div>
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
                        <h3 className="font-bold text-lg text-gray-900 mb-2">AFCAT 1/2026 Notification</h3>
                        <p className="text-gray-700 mb-3">
                          The official notification for AFCAT 1/2026 is expected to be released in December 2025. The exam is typically conducted twice a year.
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Expected Application Period:</strong> December 2025 - January 2026<br />
                          <strong>Expected Exam Date:</strong> February-March 2026<br />
                          <strong>AFSB Interviews:</strong> April-July 2026
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">How to Apply</h3>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700">
                      <li>Visit the official Indian Air Force career website (careerairforce.nic.in)</li>
                      <li>Register with valid email ID and mobile number</li>
                      <li>Fill in personal, educational, and other details</li>
                      <li>Upload recent photograph and signature (scanned)</li>
                      <li>Select preferred branch (Flying/Ground Duty Technical/Non-Technical)</li>
                      <li>Pay the application fee online</li>
                      <li>Submit the application and save the confirmation</li>
                    </ol>
                  </div>

                  <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded-lg">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">Application Fee</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li><strong>For Male Candidates:</strong> ₹250</li>
                      <li><strong>For Female Candidates:</strong> No fee</li>
                      <li><strong>Payment Mode:</strong> Online (Credit Card/Debit Card/Net Banking/UPI)</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 border-l-4 border-purple-600 p-6 rounded-lg">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">Important Links</h3>
                    <div className="space-y-2">
                      <a href="https://careerairforce.nic.in" target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:text-blue-800 font-semibold">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Official IAF Career Website
                      </a>
                      <a href="https://careerairforce.nic.in/afcat" target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:text-blue-800 font-semibold">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        AFCAT Notification Portal
                      </a>
                    </div>
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
                            {data.questions} Questions
                          </span>
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                            {data.marks} Marks
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
                          onClick={() => navigate('/exam/AFCAT')}
                          className="bg-gradient-to-r from-sky-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all inline-flex items-center space-x-2"
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
                  {/* AFCAT */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{examPattern.afcat.name}</h3>
                    <div className="bg-sky-50 p-4 rounded-lg mb-4">
                      <p className="text-gray-700"><strong>Duration:</strong> {examPattern.afcat.duration}</p>
                      <p className="text-gray-700"><strong>Total Questions:</strong> {examPattern.afcat.total.questions}</p>
                      <p className="text-gray-700"><strong>Total Marks:</strong> {examPattern.afcat.total.marks}</p>
                      <p className="text-gray-700"><strong>Marks per Question:</strong> 3 marks</p>
                      <p className="text-red-600"><strong>Negative Marking:</strong> {examPattern.afcat.negativeMarking}</p>
                      <p className="text-gray-600 text-sm mt-2"><strong>Note:</strong> All questions are Multiple Choice Questions (MCQs) with 4 options</p>
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
                          {examPattern.afcat.subjects.map((subject, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-3">{subject.name}</td>
                              <td className="border border-gray-300 px-4 py-3 text-center font-semibold">{subject.questions}</td>
                              <td className="border border-gray-300 px-4 py-3 text-center font-semibold">{subject.marks}</td>
                            </tr>
                          ))}
                          <tr className="bg-sky-100 font-bold">
                            <td className="border border-gray-300 px-4 py-3">Total</td>
                            <td className="border border-gray-300 px-4 py-3 text-center">{examPattern.afcat.total.questions}</td>
                            <td className="border border-gray-300 px-4 py-3 text-center">{examPattern.afcat.total.marks}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* EKT */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{examPattern.ekt.name}</h3>
                    <div className="bg-indigo-50 p-6 rounded-lg">
                      <p className="text-gray-700 mb-2"><strong>Duration:</strong> {examPattern.ekt.duration}</p>
                      <p className="text-gray-700 mb-2">{examPattern.ekt.description}</p>
                      <p className="text-gray-700">{examPattern.ekt.note}</p>
                      <div className="mt-4 pt-4 border-t border-indigo-200">
                        <p className="text-sm text-gray-600">
                          <strong>Covered Disciplines:</strong> Mechanical, Computer Science, Electronics & Communication
                        </p>
                      </div>
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
                        <strong className="text-blue-600">Flying Branch:</strong> {eligibilityCriteria.age.flyingBranch}
                      </p>
                      <p className="text-gray-700">
                        <strong className="text-blue-600">Ground Duty (Technical & Non-Technical):</strong> {eligibilityCriteria.age.groundDuty}
                      </p>
                      <p className="text-gray-600 text-sm bg-yellow-50 p-4 rounded-lg">
                        <strong>NCC Advantage:</strong> {eligibilityCriteria.age.ncc}
                      </p>
                    </div>
                  </div>

                  {/* Educational Qualification */}
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Educational Qualification</h3>
                    <div className="space-y-4">
                      <div className="bg-sky-50 p-4 rounded-lg">
                        <h4 className="font-bold text-gray-900 mb-2">Flying Branch</h4>
                        <p className="text-gray-700">{eligibilityCriteria.education.flyingBranch}</p>
                        <p className="text-sm text-gray-600 mt-2">Must have studied Physics & Mathematics at 10+2 level</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-bold text-gray-900 mb-2">Ground Duty (Technical)</h4>
                        <p className="text-gray-700">{eligibilityCriteria.education.groundDutyTechnical}</p>
                      </div>
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <h4 className="font-bold text-gray-900 mb-2">Ground Duty (Non-Technical)</h4>
                        <p className="text-gray-700">{eligibilityCriteria.education.groundDutyNonTechnical}</p>
                      </div>
                    </div>
                  </div>

                  {/* Physical Standards */}
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Physical Standards</h3>
                    <div className="space-y-3">
                      <p className="text-gray-700"><strong>Height:</strong> {eligibilityCriteria.physical.height}</p>
                      <p className="text-gray-700"><strong>Weight:</strong> {eligibilityCriteria.physical.weight}</p>
                      <p className="text-gray-700"><strong>Eyesight:</strong> {eligibilityCriteria.physical.eyesight}</p>
                      <p className="text-gray-600 text-sm bg-red-50 p-4 rounded-lg">
                        <strong>Flying Branch:</strong> {eligibilityCriteria.physical.flyingStandards}
                      </p>
                    </div>
                  </div>

                  {/* Marital Status */}
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Marital Status</h3>
                    <p className="text-gray-700">{eligibilityCriteria.maritalStatus}</p>
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
                  Understanding the marks distribution helps you prioritize your preparation. Allocate study time proportional to the weightage.
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
                      
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Questions</p>
                          <p className="text-3xl font-bold text-blue-600">{data.questions}</p>
                          <p className="text-sm text-gray-700">Out of 100 total</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Total Marks</p>
                          <p className="text-3xl font-bold text-green-600">{data.marks}</p>
                          <p className="text-sm text-gray-700">3 marks each</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Percentage</p>
                          <p className="text-3xl font-bold text-purple-600">{Math.round(data.marks/300*100)}%</p>
                          <p className="text-sm text-gray-700">Of total marks</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-bold text-gray-900 mb-2">Preparation Strategy</h4>
                        <p className="text-gray-700 text-sm">
                          {data.weight === 'High' 
                            ? `This is a high-weightage section contributing ${Math.round(data.marks/300*100)}% to total marks. Allocate maximum study time here. Master all ${data.subjects.length} subjects thoroughly.`
                            : `This section contributes ${Math.round(data.marks/300*100)}% to total marks. Focus on core concepts and practice regularly. Cover all ${data.subjects.length} subjects systematically.`
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 bg-gradient-to-r from-sky-50 to-blue-50 p-6 rounded-xl">
                  <h4 className="font-bold text-xl text-gray-900 mb-4">Preparation Tips for AFCAT</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Zap className="w-5 h-5 text-orange-600 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-700">English carries the highest weightage (30%) - focus on vocabulary and comprehension</span>
                    </li>
                    <li className="flex items-start">
                      <Zap className="w-5 h-5 text-orange-600 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-700">General Awareness and Reasoning each contribute 25% - stay updated with current affairs</span>
                    </li>
                    <li className="flex items-start">
                      <Zap className="w-5 h-5 text-orange-600 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-700">Practice time management - 120 minutes for 100 questions means 1.2 minutes per question</span>
                    </li>
                    <li className="flex items-start">
                      <Zap className="w-5 h-5 text-orange-600 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-700">Take regular mock tests and analyze your performance for improvement</span>
                    </li>
                    <li className="flex items-start">
                      <Zap className="w-5 h-5 text-orange-600 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-700">Focus on accuracy - negative marking can significantly impact your score</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-sky-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white sticky top-24">
              <h3 className="text-xl font-bold mb-4">Start Practicing</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/exam/AFCAT')}
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
                    <p className="text-sm text-gray-600">All AFCAT topics</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Free Mock Tests</p>
                    <p className="text-sm text-gray-600">Unlimited access</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Live Battle Mode</p>
                    <p className="text-sm text-gray-600">Compete with aspirants</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Performance Tracking</p>
                    <p className="text-sm text-gray-600">Detailed analytics</p>
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

export default AFCAT;
