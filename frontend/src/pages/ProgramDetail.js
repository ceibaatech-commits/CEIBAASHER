import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ArrowLeft, Clock, Users, Trophy, Microscope, Briefcase, Cpu, Heart, Sun,
  CheckCircle2, GraduationCap, Sparkles, ChevronRight, Send, User, Mail, Phone, School
} from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const DOMAIN_CONFIG = {
  competition:      { label: 'Competition',   color: 'bg-amber-100 text-amber-800 border-amber-200',   accent: 'from-amber-500 to-orange-500',   bg: 'bg-amber-50',   icon: Trophy },
  research:         { label: 'Research',       color: 'bg-violet-100 text-violet-800 border-violet-200', accent: 'from-violet-500 to-purple-600',  bg: 'bg-violet-50',  icon: Microscope },
  entrepreneurship: { label: 'Internship',     color: 'bg-amber-100 text-amber-800 border-amber-200',   accent: 'from-amber-500 to-yellow-500',   bg: 'bg-amber-50',   icon: Briefcase },
  ai_tech:          { label: 'AI & Tech',      color: 'bg-teal-100 text-teal-800 border-teal-200',       accent: 'from-teal-500 to-cyan-500',      bg: 'bg-teal-50',    icon: Cpu },
  healthcare:       { label: 'Healthcare',     color: 'bg-rose-100 text-rose-800 border-rose-200',       accent: 'from-rose-500 to-pink-500',      bg: 'bg-rose-50',    icon: Heart },
  summer:           { label: 'Summer Program', color: 'bg-sky-100 text-sky-800 border-sky-200',          accent: 'from-sky-500 to-blue-500',       bg: 'bg-sky-50',     icon: Sun },
};

const EXAM_ROUTES = {
  'JEE': '/exam/jee-main',
  'NEET': '/exam/neet',
  'UPSC': '/exam/upsc-cse',
  'SSC': '/exam/ssc-cgl',
};

export default function ProgramDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', grade: '', school_name: '', message: '' });

  useEffect(() => {
    axios.get(`${API_URL}/api/programs/${slug}`)
      .then(res => setProgram(res.data.program))
      .catch(() => toast.error('Program not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error('Name and email are required'); return; }
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/programs/enquiry`, {
        ...form,
        program_id: program.id,
        program_title: program.title,
      });
      setSubmitted(true);
      toast.success('Interest registered!');
    } catch {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <Header isLoggedIn={isAuthenticated()} user={user} />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-2/3" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );

  if (!program) return (
    <div className="min-h-screen bg-slate-50">
      <Header isLoggedIn={isAuthenticated()} user={user} />
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-lg text-slate-500">Program not found</p>
        <button onClick={() => navigate('/courses')} className="mt-4 text-violet-600 font-medium">Back to Programs</button>
      </div>
    </div>
  );

  const cfg = DOMAIN_CONFIG[program.domain] || DOMAIN_CONFIG.competition;
  const Icon = cfg.icon;
  const seatsLow = program.seats_left != null && program.seats_left < 30;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="program-detail-page">
      <Header isLoggedIn={isAuthenticated()} user={user} />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 pt-8 pb-14 px-4">
        <div className="max-w-4xl mx-auto relative">
          <button onClick={() => navigate('/courses')} className="inline-flex items-center gap-1.5 text-white/70 hover:text-white mb-6 text-sm transition-colors" data-testid="back-to-courses">
            <ArrowLeft className="w-4 h-4" /> Back to Programs
          </button>
          <div className="flex items-start gap-3 mb-4">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${cfg.color}`}>
              <Icon className="w-3.5 h-3.5" /> {cfg.label}
            </span>
            <span className="text-xs font-medium text-white/60 bg-white/10 px-3 py-1.5 rounded-full">
              Grade {program.grade_min}–{program.grade_max}
            </span>
            {program.is_enrolling && (
              <span className="text-xs font-semibold text-emerald-300 bg-emerald-900/40 px-3 py-1.5 rounded-full border border-emerald-700/40">
                Enrolling Now
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">{program.title}</h1>
          <p className="text-base text-slate-300 max-w-2xl">{program.short_description}</p>

          {/* Quick stats */}
          <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-slate-300">
            <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-violet-400" /> {program.duration}</span>
            {program.seats_left != null && (
              <span className={`inline-flex items-center gap-1.5 ${seatsLow ? 'text-rose-400 font-semibold' : ''}`}>
                <Users className="w-4 h-4 text-violet-400" /> {program.seats_left} seats left
              </span>
            )}
            {program.price && <span className="font-bold text-white">Rs. {program.price}</span>}
            {!program.price && <span className="font-semibold text-emerald-400">Free</span>}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-10 pb-16">
        {/* CTA Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-900">Ready to get started?</p>
            <p className="text-sm text-slate-500">Express your interest and we'll reach out with next steps.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            data-testid="express-interest-btn"
            className={`shrink-0 bg-gradient-to-r ${cfg.accent} text-white font-semibold px-6 py-3 rounded-xl hover:shadow-lg transition-all text-sm`}
          >
            Express Interest
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            {program.full_description && (
              <section className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-3">Overview</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{program.full_description}</p>
              </section>
            )}

            {/* What you'll build */}
            {program.what_you_build?.length > 0 && (
              <section className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">What You'll Build</h2>
                <div className="space-y-3">
                  {program.what_you_build.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Highlights */}
            {program.highlights?.length > 0 && (
              <section className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Program Highlights</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {program.highlights.map((h, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${cfg.bg}`}>
                      <Sparkles className="w-4 h-4 text-violet-500 shrink-0" />
                      <span className="text-sm font-medium text-slate-700">{h}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Mentor */}
            {program.mentor_name && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Your Mentor</h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${cfg.accent} flex items-center justify-center text-white font-bold text-lg`}>
                    {program.mentor_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{program.mentor_name}</p>
                    <p className="text-xs text-slate-500">{program.mentor_credentials}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Strengthen your foundation */}
            {program.related_exams?.length > 0 && (
              <div className="bg-gradient-to-br from-violet-50 to-teal-50 rounded-2xl border border-violet-200 p-5">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-1">Strengthen Your Foundation</h3>
                <p className="text-xs text-slate-500 mb-4">Practice with Ceibaa mock tests</p>
                <div className="space-y-2">
                  {program.related_exams.map(exam => (
                    <button
                      key={exam}
                      onClick={() => navigate(EXAM_ROUTES[exam] || '/exam-selection')}
                      className="w-full flex items-center justify-between bg-white rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors border border-slate-200"
                    >
                      <span className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        {exam} Practice
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enquiry Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => !submitting && setShowForm(false)}>
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden"
            data-testid="enquiry-form-modal"
          >
            <div className={`bg-gradient-to-r ${cfg.accent} p-5 text-white`}>
              <h3 className="font-bold text-lg">Express Interest</h3>
              <p className="text-sm text-white/80">{program.title}</p>
            </div>

            {submitted ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
                <p className="font-bold text-lg text-slate-900 mb-2">You're on the list!</p>
                <p className="text-sm text-slate-500 mb-6">We'll reach out to you shortly with next steps.</p>
                <button onClick={() => setShowForm(false)} className="text-sm text-violet-600 font-medium">Close</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text" required placeholder="Full Name"
                    value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-400 focus:border-violet-400 outline-none"
                    data-testid="enquiry-name"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email" required placeholder="Email Address"
                    value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-400 focus:border-violet-400 outline-none"
                    data-testid="enquiry-email"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="tel" placeholder="Phone"
                      value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-400 focus:border-violet-400 outline-none"
                      data-testid="enquiry-phone"
                    />
                  </div>
                  <select
                    value={form.grade} onChange={e => setForm(f => ({...f, grade: e.target.value}))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-400 focus:border-violet-400 outline-none text-slate-600"
                    data-testid="enquiry-grade"
                  >
                    <option value="">Grade</option>
                    {[8,9,10,11,12].map(g => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                </div>
                <div className="relative">
                  <School className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text" placeholder="School Name"
                    value={form.school_name} onChange={e => setForm(f => ({...f, school_name: e.target.value}))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-400 focus:border-violet-400 outline-none"
                    data-testid="enquiry-school"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  data-testid="submit-enquiry-btn"
                  className={`w-full bg-gradient-to-r ${cfg.accent} text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-60`}
                >
                  {submitting ? 'Submitting...' : <><Send className="w-4 h-4" /> Submit Interest</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
