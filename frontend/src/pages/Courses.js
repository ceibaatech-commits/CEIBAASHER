import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  GraduationCap, Trophy, Microscope, Briefcase, Cpu, Heart, Sun,
  Clock, Users, ArrowRight, Sparkles, Filter, ChevronRight, BookOpen
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const DOMAIN_CONFIG = {
  competition:     { label: 'Competition',     color: 'bg-amber-100 text-amber-800 border-amber-200',   accent: 'from-amber-500 to-orange-500',   icon: Trophy },
  research:        { label: 'Research',         color: 'bg-violet-100 text-violet-800 border-violet-200', accent: 'from-violet-500 to-purple-600',  icon: Microscope },
  entrepreneurship:{ label: 'Internship',       color: 'bg-amber-100 text-amber-800 border-amber-200',   accent: 'from-amber-500 to-yellow-500',   icon: Briefcase },
  ai_tech:         { label: 'AI & Tech',        color: 'bg-teal-100 text-teal-800 border-teal-200',       accent: 'from-teal-500 to-cyan-500',      icon: Cpu },
  healthcare:      { label: 'Healthcare',       color: 'bg-rose-100 text-rose-800 border-rose-200',       accent: 'from-rose-500 to-pink-500',      icon: Heart },
  summer:          { label: 'Summer Program',   color: 'bg-sky-100 text-sky-800 border-sky-200',          accent: 'from-sky-500 to-blue-500',       icon: Sun },
};

const FILTERS = [
  { key: 'all', label: 'All Programs' },
  { key: 'competition', label: 'Competitions' },
  { key: 'research', label: 'Research' },
  { key: 'entrepreneurship', label: 'Internships' },
  { key: 'ai_tech', label: 'AI & Tech' },
  { key: 'healthcare', label: 'Healthcare' },
  { key: 'summer', label: 'Summer' },
];

const Courses = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  // Detect if user is in active study (Class 12 or undergrad 1-4 year)
  const isActiveStudent = () => {
    if (!user?.education_profile) return true; // Default: assume active student (Class 12)
    const yearOfStudy = user.education_profile.year_of_study;
    return ['1st Year', '2nd Year', '3rd Year', '4th Year'].includes(yearOfStudy);
  };

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const params = filter !== 'all' ? `?domain=${filter}` : '';
        const res = await axios.get(`${API_URL}/api/programs${params}`);
        setPrograms(res.data.programs || []);
      } catch (error) {
        console.error('Failed to load programs:', error.response?.data || error.message);
        toast.error('Failed to load programs');
      } finally {
        setLoading(false);
      }
    };
    fetchPrograms();
  }, [filter]);

  const filtered = programs.filter(p => 
    !searchText || p.title.toLowerCase().includes(searchText.toLowerCase()) ||
    p.short_description.toLowerCase().includes(searchText.toLowerCase())
  );

  const isStudent = isActiveStudent();

  return (
    <div className="min-h-screen bg-slate-50" data-testid="courses-page">
      <Header isLoggedIn={isAuthenticated()} user={user} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 pt-12 pb-16 px-4">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(139,92,246,0.3), transparent 50%), radial-gradient(circle at 80% 20%, rgba(20,184,166,0.25), transparent 50%)' }} />
        <div className="max-w-5xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-white/90 font-medium">Beyond Exam Prep</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Career Programs <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-teal-400">&amp; Courses</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Go beyond textbooks. Research, intern, innovate &mdash; build skills that colleges and employers value.
          </p>
        </div>
      </section>

      {/* Search + Filters */}
      <div className="max-w-6xl mx-auto px-4 -mt-6 relative z-10 space-y-3">
        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
          <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-2">
            <BookOpen className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search programs by name..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="flex-1 bg-transparent outline-none text-slate-900 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-1.5 flex flex-nowrap gap-1 overflow-x-auto scrollbar-hide" data-testid="program-filters" style={{ WebkitOverflowScrolling: 'touch' }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setLoading(true); }}
              data-testid={`filter-${f.key}`}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                filter === f.key
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Programs Grid */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">No programs found</p>
            <p className="text-sm mt-1">Try a different filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="programs-grid">
            {filtered.map(program => (
              <ProgramCard key={program.id} program={program} onClick={() => navigate(`/programs/${program.slug || program.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-violet-600 to-teal-500 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Already preparing for exams on Ceibaa?</h2>
          <p className="text-white/80 mb-6 text-sm sm:text-base">
            Strengthen your foundation with our mock tests, then level up with career programs.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-white text-violet-700 font-semibold px-6 py-3 rounded-xl hover:shadow-lg transition-all text-sm"
            data-testid="explore-exams-btn"
          >
            Explore Mock Tests
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

function ProgramCard({ program, onClick }) {
  const cfg = DOMAIN_CONFIG[program.domain] || DOMAIN_CONFIG.competition;
  const Icon = cfg.icon;
  const seatsLow = program.seats_left != null && program.seats_left < 30;

  return (
    <div
      onClick={onClick}
      data-testid={`program-card-${program.slug || program.id}`}
      className="group bg-white rounded-2xl border border-slate-200 hover:border-violet-300 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
    >
      {/* Top accent bar */}
      <div className={`h-1.5 bg-gradient-to-r ${cfg.accent}`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Domain tag + Grade badge */}
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
            <Icon className="w-3.5 h-3.5" />
            {cfg.label}
          </span>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
            Grade {program.grade_min}–{program.grade_max}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-violet-700 transition-colors line-clamp-2">
          {program.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-1">
          {program.short_description}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {program.duration}
          </span>
          {program.seats_left != null && (
            <span className={`inline-flex items-center gap-1 ${seatsLow ? 'text-rose-600 font-semibold' : ''}`}>
              <Users className="w-3.5 h-3.5" />
              {program.seats_left} seats left
            </span>
          )}
        </div>

        {/* CTA + Price row */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          {program.price ? (
            <span className="text-sm font-bold text-slate-900">Rs. {program.price}</span>
          ) : (
            <span className="text-sm font-semibold text-emerald-600">Free</span>
          )}
          <span className={`inline-flex items-center gap-1 text-sm font-semibold bg-gradient-to-r ${cfg.accent} text-transparent bg-clip-text group-hover:gap-2 transition-all`}>
            {program.is_enrolling ? 'Enroll Now' : 'Learn More'}
            <ArrowRight className={`w-4 h-4 text-violet-500 group-hover:translate-x-1 transition-transform`} />
          </span>
        </div>
      </div>
    </div>
  );
}

export default Courses;
