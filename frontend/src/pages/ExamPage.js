import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Award } from 'lucide-react';
import axios from 'axios';

const API_URL = window.location.origin;
const QUIZ_API_URL = window.location.origin; // Use main backend

const SoloOperationIcon = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M5 6H16L19 9V19H5V6Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 6V9H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 12H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M8 15H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="17.5" cy="16.5" r="3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M17.5 15V18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M16 16.5H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const RoomConsultIcon = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="16" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3.5 18C3.8 15.9 5.6 14.4 7.8 14.4H8.2C10.4 14.4 12.2 15.9 12.5 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M11.5 18C11.8 15.9 13.6 14.4 15.8 14.4H16.2C18.4 14.4 20.2 15.9 20.5 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <rect x="7" y="19" width="10" height="2" rx="1" fill="currentColor" />
  </svg>
);

const BattleInteractIcon = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="7.5" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="16.5" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M7.5 10.5V14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M16.5 10.5V14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M9 14.5L12 12L15 14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 18.5H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M14 18.5H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ExamPage = () => {
  const { examName } = useParams();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
  // eslint-disable-next-line
  }, [examName]);

  const fetchSubjects = async () => {
    try {
      const response = await axios.get(`${QUIZ_API_URL}/api/quiz/subjects/${examName}`);
      if (response.data.success) {
        setSubjects(response.data.subjects);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const examInfo = {
    NEET: {
      fullName: 'National Eligibility cum Entrance Test',
      icon: '🏥',
      color: 'from-blue-500 to-cyan-500',
      description: 'Medical entrance exam for MBBS, BDS, and other medical courses in India'
    },
    JEE: {
      fullName: 'Joint Entrance Examination',
      icon: '🎓',
      color: 'from-purple-500 to-pink-500',
      description: 'Engineering entrance exam for IITs, NITs, and other premier engineering institutes'
    }
  };

  const info = examInfo[examName] || {};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#f7f9fc_0%,_#eef3f7_42%,_#e7edf4_100%)]">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </button>
          <div className="flex items-center space-x-4">
            <div className="text-5xl">{info.icon}</div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">{examName}</h1>
              <p className="text-slate-600 font-medium">{info.fullName}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Exam Description */}
        <div className="bg-white/95 rounded-2xl shadow-[0_18px_45px_-24px_rgba(15,23,42,0.45)] border border-slate-200/70 p-6 mb-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-3">About {examName}</h2>
          <p className="text-slate-700 leading-relaxed font-medium">{info.description}</p>
        </div>

        {/* Subjects Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-6">Choose a Subject</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <div
                key={subject.name}
                className="bg-white rounded-2xl shadow-[0_14px_36px_-20px_rgba(15,23,42,0.35)] border border-slate-200/70 overflow-hidden hover:shadow-[0_22px_44px_-18px_rgba(15,23,42,0.35)] transition-all"
              >
                <div className={`bg-gradient-to-r ${info.color} p-6 text-white relative`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <h3 className="text-2xl font-extrabold tracking-tight relative">{subject.name}</h3>
                </div>
                
                <div className="p-6">
                  <div className="space-y-3">
                    {/* Solo Practice Button */}
                    <button
                      onClick={() => navigate(`/solo-practice/${examName}/${subject.name}`)}
                      className="w-full flex items-center justify-between bg-gradient-to-r from-sky-600 to-cyan-600 text-white py-3 px-4 rounded-xl hover:shadow-lg hover:translate-y-[-1px] transition-all"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-8 h-8 rounded-lg bg-white/20 inline-flex items-center justify-center">
                          <SoloOperationIcon className="w-4 h-4" />
                        </span>
                        <span className="font-bold tracking-tight">Solo Practice</span>
                      </div>
                      <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-semibold">10 Qs</span>
                    </button>

                    {/* Room Code Button */}
                    <button
                      onClick={() => navigate('/join-room', { state: { examName, subjectName: subject.name } })}
                      className="w-full flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 rounded-xl hover:shadow-lg hover:translate-y-[-1px] transition-all"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-8 h-8 rounded-lg bg-white/20 inline-flex items-center justify-center">
                          <RoomConsultIcon className="w-4 h-4" />
                        </span>
                        <span className="font-bold tracking-tight">Room Code</span>
                      </div>
                      <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-semibold">Join</span>
                    </button>

                    {/* Battle Mode Button */}
                    <button
                      onClick={() => navigate(`/battle/${examName}/${subject.name}`)}
                      className="w-full flex items-center justify-between bg-gradient-to-r from-rose-600 to-red-600 text-white py-3 px-4 rounded-xl hover:shadow-lg hover:translate-y-[-1px] transition-all"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-8 h-8 rounded-lg bg-white/20 inline-flex items-center justify-center">
                          <BattleInteractIcon className="w-4 h-4" />
                        </span>
                        <span className="font-bold tracking-tight">Battle Mode</span>
                      </div>
                      <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-semibold">1v1</span>
                    </button>
                  </div>

                  {/* Subject Info */}
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between text-sm text-slate-600 font-medium">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>30s per question</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Award className="w-4 h-4" />
                        <span>Score points</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Syllabus Section */}
        <div className="bg-white/95 rounded-2xl shadow-[0_18px_45px_-24px_rgba(15,23,42,0.45)] border border-slate-200/70 p-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-4">Syllabus Overview</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <div key={subject.name} className="border-l-4 border-sky-500 pl-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{subject.name}</h3>
                <p className="text-slate-600 text-sm font-medium">
                  Comprehensive questions covering all topics from the {examName} {subject.name} syllabus.
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExamPage;