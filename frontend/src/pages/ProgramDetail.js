import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ArrowLeft, Clock, Users, Trophy, Microscope, Briefcase, Cpu, Heart, Sun,
  CheckCircle2, GraduationCap, Sparkles, ChevronRight, ChevronDown, Send,
  User, Mail, Phone, School, Play, BookOpen, Star, Zap, Target, MessageCircle, X
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const DOMAIN_CONFIG = {
  competition:      { label: 'Competition',   color: 'bg-amber-100 text-amber-800 border-amber-200',   accent: 'from-amber-500 to-orange-500',   ring: 'ring-amber-400',   icon: Trophy },
  research:         { label: 'Research',       color: 'bg-violet-100 text-violet-800 border-violet-200', accent: 'from-violet-500 to-purple-600',  ring: 'ring-violet-400',  icon: Microscope },
  entrepreneurship: { label: 'Internship',     color: 'bg-amber-100 text-amber-800 border-amber-200',   accent: 'from-amber-500 to-yellow-500',   ring: 'ring-amber-400',   icon: Briefcase },
  ai_tech:          { label: 'AI & Tech',      color: 'bg-teal-100 text-teal-800 border-teal-200',       accent: 'from-teal-500 to-cyan-500',      ring: 'ring-teal-400',    icon: Cpu },
  healthcare:       { label: 'Healthcare',     color: 'bg-rose-100 text-rose-800 border-rose-200',       accent: 'from-rose-500 to-pink-500',      ring: 'ring-rose-400',    icon: Heart },
  summer:           { label: 'Summer Program', color: 'bg-sky-100 text-sky-800 border-sky-200',          accent: 'from-sky-500 to-blue-500',       ring: 'ring-sky-400',     icon: Sun },
};

const EXAM_ROUTES = { 'JEE': '/exam/jee-main', 'NEET': '/exam/neet', 'UPSC': '/exam/upsc-cse', 'SSC': '/exam/ssc-cgl' };

/* ── Countdown Timer ── */
function CountdownTimer({ accent }) {
  const [time, setTime] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  useEffect(() => {
    const target = new Date();
    target.setDate(target.getDate() + 12);
    target.setHours(23, 59, 59, 0);
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const Box = ({ val, label }) => (
    <div className="text-center">
      <div className={`bg-gradient-to-b ${accent} text-white text-2xl sm:text-3xl font-bold w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center shadow-lg`}>{String(val).padStart(2, '0')}</div>
      <span className="text-xs text-slate-500 mt-1.5 block font-medium uppercase tracking-wider">{label}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-3 sm:gap-4 justify-center">
      <Box val={time.days} label="Days" /><span className="text-2xl font-bold text-slate-300">:</span>
      <Box val={time.hours} label="Hrs" /><span className="text-2xl font-bold text-slate-300">:</span>
      <Box val={time.mins} label="Min" /><span className="text-2xl font-bold text-slate-300">:</span>
      <Box val={time.secs} label="Sec" />
    </div>
  );
}

/* ── FAQ Accordion ── */
function FAQAccordion({ items, accent }) {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
            data-testid={`faq-item-${i}`}
          >
            <span className="font-semibold text-sm text-slate-800">{item.q}</span>
            <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 ml-3 transition-transform duration-200 ${openIdx === i ? 'rotate-180' : ''}`} />
          </button>
          <div className={`overflow-hidden transition-all duration-200 ${openIdx === i ? 'max-h-40 pb-4 px-4' : 'max-h-0'}`}>
            <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Chatbot Widget ── */
function ChatbotWidget({ program, accent }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: `Hi! I'm here to help you learn more about "${program.title}". What would you like to know?` }
  ]);
  const [input, setInput] = useState('');
  const chatEnd = useRef(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const quickReplies = ['What will I learn?', 'Who is the mentor?', 'How do I enroll?', 'Is there a certificate?'];

  const respond = (q) => {
    const ql = q.toLowerCase();
    if (ql.includes('learn') || ql.includes('syllabus') || ql.includes('build'))
      return program.what_you_build?.length ? `In this program you'll build: ${program.what_you_build.join(', ')}. ${program.highlights?.slice(0,2).join('. ')}.` : `This program covers: ${program.short_description}`;
    if (ql.includes('mentor'))
      return program.mentor_name ? `Your mentor is ${program.mentor_name} — ${program.mentor_credentials}.` : 'Our mentors are industry professionals with top credentials. Details will be shared upon enrollment.';
    if (ql.includes('enroll') || ql.includes('register') || ql.includes('join'))
      return `Click the "Express Interest" button on this page and fill in your details. We'll reach out with enrollment steps within 24 hours!`;
    if (ql.includes('certificate') || ql.includes('badge'))
      return 'Yes! All participants receive a certificate of completion. Top performers also get a special badge on their Ceibaa profile.';
    if (ql.includes('price') || ql.includes('cost') || ql.includes('fee'))
      return program.price ? `The program fee is Rs. ${program.price}. Scholarships may be available for eligible students.` : 'This program is currently free of cost!';
    if (ql.includes('duration') || ql.includes('long'))
      return `The program duration is ${program.duration}. It's designed to be manageable alongside your regular studies.`;
    if (ql.includes('seat') || ql.includes('available'))
      return program.seats_left != null ? `There are ${program.seats_left} seats remaining out of ${program.seats_total}. Enroll soon!` : 'Seats are limited. We recommend enrolling early.';
    return `Great question! For detailed info about "${program.title}", please use the "Express Interest" form and our team will get back to you within 24 hours.`;
  };

  const send = (text) => {
    if (!text.trim()) return;
    const userMsg = { from: 'user', text };
    const botMsg = { from: 'bot', text: respond(text) };
    setMessages(m => [...m, userMsg, botMsg]);
    setInput('');
  };

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      data-testid="chatbot-toggle"
      className={`fixed bottom-6 right-6 z-50 bg-gradient-to-r ${accent} text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform`}
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden" style={{ maxHeight: '500px' }} data-testid="chatbot-panel">
      {/* Header */}
      <div className={`bg-gradient-to-r ${accent} p-4 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><MessageCircle className="w-4 h-4 text-white" /></div>
          <div><p className="text-sm font-bold text-white">Course Assistant</p><p className="text-xs text-white/70">Ask me anything</p></div>
        </div>
        <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: '200px', maxHeight: '320px' }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${m.from === 'user' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-700'}`}>{m.text}</div>
          </div>
        ))}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {quickReplies.map(q => (
              <button key={q} onClick={() => send(q)} className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-3 py-1.5 rounded-full hover:bg-violet-100 transition-colors">{q}</button>
            ))}
          </div>
        )}
        <div ref={chatEnd} />
      </div>
      {/* Input */}
      <div className="border-t border-slate-100 p-3 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send(input)}
          placeholder="Type a question..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400"
          data-testid="chatbot-input"
        />
        <button onClick={() => send(input)} className={`bg-gradient-to-r ${accent} text-white p-2 rounded-xl`}><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

/* ── Syllabus Module ── */
function SyllabusSection({ program, accent }) {
  const modules = [
    { week: 'Module 1', title: 'Foundation & Orientation', items: program.highlights?.slice(0, 2) || ['Introduction to core concepts', 'Mentor meet & goal setting'] },
    { week: 'Module 2', title: 'Deep Dive & Hands-On', items: program.what_you_build?.slice(0, 2) || ['Practical project work', 'Guided exercises'] },
    { week: 'Module 3', title: 'Build & Present', items: [...(program.what_you_build?.slice(1, 3) || ['Final project']), 'Presentation & feedback'] },
    { week: 'Module 4', title: 'Certification & Next Steps', items: ['Final assessment', 'Certificate ceremony', 'Career roadmap planning'] },
  ];
  return (
    <div className="space-y-4">
      {modules.map((mod, i) => (
        <div key={i} className="flex gap-4 items-start">
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${accent} text-white font-bold flex items-center justify-center text-sm shadow-md`}>{i + 1}</div>
            {i < modules.length - 1 && <div className="w-0.5 h-full bg-slate-200 mt-2" />}
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{mod.week}</p>
            <h4 className="font-bold text-slate-900 mt-1 mb-2">{mod.title}</h4>
            <ul className="space-y-1.5">
              {mod.items.map((item, j) => (
                <li key={j} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />{item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Enquiry Modal ── */
function EnquiryModal({ program, cfg, onClose }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', grade: '', school_name: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error('Name and email are required'); return; }
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/programs/enquiry`, { ...form, program_id: program.id, program_title: program.title });
      setSubmitted(true);
      toast.success('Interest registered!');
    } catch { toast.error('Failed to submit. Please try again.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => !submitting && onClose()}>
      <div onClick={e => e.stopPropagation()} className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden" data-testid="enquiry-form-modal">
        <div className={`bg-gradient-to-r ${cfg.accent} p-5 text-white`}>
          <h3 className="font-bold text-lg">Express Interest</h3>
          <p className="text-sm text-white/80">{program.title}</p>
        </div>
        {submitted ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
            <p className="font-bold text-lg text-slate-900 mb-2">You're on the list!</p>
            <p className="text-sm text-slate-500 mb-6">We'll reach out shortly with next steps.</p>
            <button onClick={onClose} className="text-sm text-violet-600 font-medium">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="relative"><User className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><input type="text" required placeholder="Full Name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-400 outline-none" data-testid="enquiry-name" /></div>
            <div className="relative"><Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><input type="email" required placeholder="Email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-400 outline-none" data-testid="enquiry-email" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative"><Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><input type="tel" placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-400 outline-none" data-testid="enquiry-phone" /></div>
              <select value={form.grade} onChange={e => setForm(f => ({...f, grade: e.target.value}))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-400 outline-none text-slate-600" data-testid="enquiry-grade"><option value="">Grade</option>{[8,9,10,11,12].map(g => <option key={g} value={g}>Grade {g}</option>)}</select>
            </div>
            <div className="relative"><School className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><input type="text" placeholder="School Name" value={form.school_name} onChange={e => setForm(f => ({...f, school_name: e.target.value}))} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-400 outline-none" data-testid="enquiry-school" /></div>
            <button type="submit" disabled={submitting} data-testid="submit-enquiry-btn" className={`w-full bg-gradient-to-r ${cfg.accent} text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-60`}>{submitting ? 'Submitting...' : <><Send className="w-4 h-4" /> Submit Interest</>}</button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ══════════ MAIN PAGE ══════════ */
export default function ProgramDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/api/programs/${slug}`)
      .then(res => setProgram(res.data.program))
      .catch(() => toast.error('Program not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <Header isLoggedIn={isAuthenticated()} user={user} />
      <div className="max-w-4xl mx-auto px-4 py-20"><div className="animate-pulse space-y-4"><div className="h-10 bg-slate-200 rounded w-2/3" /><div className="h-4 bg-slate-200 rounded w-1/2" /><div className="h-64 bg-slate-200 rounded-2xl" /></div></div>
    </div>
  );

  if (!program) return (
    <div className="min-h-screen bg-slate-50">
      <Header isLoggedIn={isAuthenticated()} user={user} />
      <div className="max-w-4xl mx-auto px-4 py-20 text-center"><p className="text-lg text-slate-500">Program not found</p><button onClick={() => navigate('/courses')} className="mt-4 text-violet-600 font-medium">Back to Programs</button></div>
    </div>
  );

  const cfg = DOMAIN_CONFIG[program.domain] || DOMAIN_CONFIG.competition;
  const Icon = cfg.icon;
  const seatsLow = program.seats_left != null && program.seats_left < 30;
  const seatsPct = program.seats_total ? Math.round(((program.seats_total - (program.seats_left || 0)) / program.seats_total) * 100) : 0;

  const faqs = [
    { q: 'Who is this program for?', a: `This program is designed for students in Grades ${program.grade_min}–${program.grade_max} who are curious about ${cfg.label.toLowerCase()} and want real-world skills beyond exam prep.` },
    { q: 'Do I need any prior experience?', a: 'No prior experience is needed. The program starts from fundamentals and builds up progressively with mentor guidance.' },
    { q: 'Will I receive a certificate?', a: 'Yes! All participants receive a certificate of completion. Outstanding students also earn a special badge on their Ceibaa profile.' },
    { q: 'How are sessions conducted?', a: 'Sessions are conducted virtually via live video calls. You\'ll also have access to recorded sessions, assignments, and a dedicated doubt-clearing channel.' },
    { q: 'Can I get a refund if I can\'t continue?', a: 'We offer a full refund within the first 3 days of the program if it isn\'t the right fit for you.' },
    { q: 'How does this connect to my exam prep?', a: 'The skills you build here (critical thinking, research, communication) directly strengthen your competitive exam performance. We also provide linked Ceibaa mock tests for related subjects.' },
  ];

  return (
    <div className="min-h-screen bg-slate-50" data-testid="program-detail-page">
      <Header isLoggedIn={isAuthenticated()} user={user} />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 pt-8 pb-20 px-4">
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 25% 40%, rgba(139,92,246,0.4), transparent 50%), radial-gradient(circle at 75% 60%, rgba(20,184,166,0.3), transparent 50%)' }} />
        <div className="max-w-5xl mx-auto relative">
          <button onClick={() => navigate('/courses')} className="inline-flex items-center gap-1.5 text-white/60 hover:text-white mb-8 text-sm transition-colors" data-testid="back-to-courses">
            <ArrowLeft className="w-4 h-4" /> Back to Programs
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Left */}
            <div className="lg:col-span-3">
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${cfg.color}`}><Icon className="w-3.5 h-3.5" /> {cfg.label}</span>
                <span className="text-xs font-medium text-white/50 bg-white/10 px-3 py-1.5 rounded-full">Grade {program.grade_min}–{program.grade_max}</span>
                {program.is_enrolling && <span className="text-xs font-semibold text-emerald-300 bg-emerald-900/40 px-3 py-1.5 rounded-full border border-emerald-700/40 animate-pulse">Enrolling Now</span>}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">{program.title}</h1>
              <p className="text-base sm:text-lg text-slate-300 mb-6 max-w-xl">{program.short_description}</p>
              <div className="flex flex-wrap items-center gap-5 text-sm text-slate-300 mb-8">
                <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-violet-400" /> {program.duration}</span>
                {program.mentor_name && <span className="inline-flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400" /> {program.mentor_name}</span>}
                {program.seats_left != null && <span className={`inline-flex items-center gap-1.5 ${seatsLow ? 'text-rose-400 font-semibold' : ''}`}><Users className="w-4 h-4 text-violet-400" /> {program.seats_left} seats left</span>}
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setShowForm(true)} data-testid="express-interest-btn" className={`bg-gradient-to-r ${cfg.accent} text-white font-bold px-8 py-3.5 rounded-xl hover:shadow-xl hover:scale-105 transition-all text-sm`}>
                  Express Interest
                </button>
                <a href="#syllabus" className="border border-white/20 text-white/80 hover:text-white hover:border-white/40 font-medium px-6 py-3.5 rounded-xl transition-all text-sm inline-flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> View Syllabus
                </a>
              </div>
            </div>

            {/* Right — Pricing card */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6">
                <div className="text-center mb-4">
                  {program.price ? (
                    <><p className="text-4xl font-bold text-white">Rs. {program.price}</p><p className="text-xs text-slate-400 mt-1">One-time enrollment</p></>
                  ) : (
                    <><p className="text-4xl font-bold text-emerald-400">Free</p><p className="text-xs text-slate-400 mt-1">No cost to participate</p></>
                  )}
                </div>
                {/* Seats progress */}
                {program.seats_total && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5"><span>{program.seats_total - (program.seats_left || 0)} enrolled</span><span>{program.seats_total} total</span></div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className={`h-full bg-gradient-to-r ${cfg.accent} rounded-full transition-all`} style={{ width: `${seatsPct}%` }} /></div>
                  </div>
                )}
                <ul className="space-y-2.5 mb-5">
                  {['Certificate of completion', 'Mentor guidance', 'Project-based learning', 'Ceibaa profile badge'].map((t, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-white/80"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> {t}</li>
                  ))}
                </ul>
                <button onClick={() => setShowForm(true)} className="w-full bg-white text-slate-900 font-bold py-3 rounded-xl hover:shadow-lg transition-all text-sm">
                  Enroll Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE PREVIEW ── */}
      <section className="max-w-5xl mx-auto px-4 -mt-10 relative z-10 mb-12">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${cfg.accent} flex items-center justify-center`}><Play className="w-5 h-5 text-white" /></div>
            <div><h2 className="text-lg font-bold text-slate-900">Program Preview</h2><p className="text-xs text-slate-500">What you'll experience</p></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Target, title: 'Clear Outcomes', desc: program.what_you_build?.[0] || 'Build a real-world project' },
              { icon: Zap, title: 'Hands-On Learning', desc: `${program.duration} of practical, mentor-guided work` },
              { icon: GraduationCap, title: 'Career Value', desc: 'Skills that strengthen college apps & resumes' },
            ].map((card, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-violet-200 hover:bg-violet-50/50 transition-colors">
                <card.icon className="w-8 h-8 text-violet-500 mb-3" />
                <h3 className="font-bold text-sm text-slate-900 mb-1">{card.title}</h3>
                <p className="text-xs text-slate-500">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ENROLLMENT COUNTDOWN ── */}
      {program.is_enrolling && (
        <section className="max-w-5xl mx-auto px-4 mb-12">
          <div className={`bg-gradient-to-r ${cfg.accent} rounded-2xl p-8 text-center shadow-lg`}>
            <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-2">Enrollment Closes In</p>
            <CountdownTimer accent="from-white/20 to-white/10" />
            <button onClick={() => setShowForm(true)} className="mt-6 bg-white text-slate-900 font-bold px-8 py-3 rounded-xl hover:shadow-lg transition-all text-sm">
              Secure Your Spot
            </button>
          </div>
        </section>
      )}

      {/* ── OVERVIEW ── */}
      {program.full_description && (
        <section className="max-w-5xl mx-auto px-4 mb-12">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">About This Program</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{program.full_description}</p>
          </div>
        </section>
      )}

      {/* ── SYLLABUS ── */}
      <section id="syllabus" className="max-w-5xl mx-auto px-4 mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><BookOpen className="w-5 h-5 text-violet-500" /> Syllabus & Roadmap</h2>
        <SyllabusSection program={program} accent={cfg.accent} />
      </section>

      {/* ── HIGHLIGHTS ── */}
      {program.highlights?.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Program Highlights</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {program.highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <Sparkles className="w-5 h-5 text-violet-500 shrink-0" />
                <span className="text-sm font-medium text-slate-700">{h}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── MENTOR ── */}
      {program.mentor_name && (
        <section className="max-w-5xl mx-auto px-4 mb-12">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-5">Meet Your Mentor</h2>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cfg.accent} flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>{program.mentor_name.charAt(0)}</div>
              <div>
                <p className="text-lg font-bold text-slate-900">{program.mentor_name}</p>
                <p className="text-sm text-slate-500">{program.mentor_credentials}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── STRENGTHEN YOUR FOUNDATION ── */}
      {program.related_exams?.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 mb-12">
          <div className="bg-gradient-to-br from-violet-50 to-teal-50 rounded-2xl border border-violet-200 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Strengthen Your Foundation</h2>
            <p className="text-sm text-slate-500 mb-5">Practice with Ceibaa mock tests for related subjects</p>
            <div className="flex flex-wrap gap-3">
              {program.related_exams.map(exam => (
                <button key={exam} onClick={() => navigate(EXAM_ROUTES[exam] || '/')} className="flex items-center gap-2 bg-white rounded-xl px-5 py-3 text-sm font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors border border-slate-200 shadow-sm">
                  <GraduationCap className="w-4 h-4" /> {exam} Practice <ChevronRight className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      <section className="max-w-5xl mx-auto px-4 mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
        <FAQAccordion items={faqs} accent={cfg.accent} />
      </section>

      {/* ── FINAL CTA ── */}
      <section className={`bg-gradient-to-r ${cfg.accent} py-14 px-4`}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to Go Beyond Exams?</h2>
          <p className="text-white/80 mb-6 text-sm sm:text-base">Join {program.seats_total ? program.seats_total - (program.seats_left || 0) : 'hundreds of'} students already enrolled.</p>
          <button onClick={() => setShowForm(true)} className="bg-white text-slate-900 font-bold px-10 py-4 rounded-xl hover:shadow-xl transition-all text-sm">
            Express Interest Now
          </button>
        </div>
      </section>

      <Footer />

      {/* Chatbot */}
      <ChatbotWidget program={program} accent={cfg.accent} />

      {/* Enquiry Modal */}
      {showForm && <EnquiryModal program={program} cfg={cfg} onClose={() => setShowForm(false)} />}
    </div>
  );
}
