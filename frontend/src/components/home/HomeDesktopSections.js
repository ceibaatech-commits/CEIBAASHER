import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import HomeExamCard from './HomeExamCard';
import { BookOpen as BookOpenIcon } from 'lucide-react';

// Actual category names from the database (verified 2026-02)
const EXAM_SECTIONS = [
  {
    key: 'defence',
    bgGradient: 'from-green-50 via-emerald-50 to-teal-50',
    borderColor: 'border-green-200',
    iconBg: 'from-green-700 via-emerald-700 to-teal-700',
    iconContent: <img src="https://cdn-icons-png.flaticon.com/512/6142/6142033.png" alt="Defence" className="w-8 h-8 object-contain" />,
    title: 'Defence Exams',
    titleGradient: 'from-green-800 via-emerald-800 to-teal-800',
    subtitle: '🎖️ Serve the Nation • Armed Forces & Paramilitary',
    tags: [
      { text: '⚔️ NDA • Agniveer • CDS', border: 'border-green-200' },
      { text: '🛡️ Army • Navy • Air Force', border: 'border-emerald-200' },
      { text: '🏆 CAPF & Paramilitary', border: 'border-teal-200' },
    ],
    filterFn: (exams) => exams.filter(e => e.category === 'Defence Exams'),
    hoverGlow: 'from-green-200 via-emerald-200 to-teal-200',
    hoverBorder: 'hover:border-green-300',
    tabActive: 'bg-gradient-to-r from-green-600 to-teal-600 text-white border-transparent shadow-lg shadow-green-200',
  },
  {
    key: 'admission',
    bgGradient: 'from-purple-50 via-blue-50 to-indigo-50',
    borderColor: 'border-purple-200',
    iconBg: 'from-purple-600 via-blue-600 to-indigo-600',
    iconContent: <span className="text-2xl">🎓</span>,
    title: 'Admission Tests',
    titleGradient: 'from-purple-700 via-blue-700 to-indigo-700',
    subtitle: '🎓 Gateway to Excellence • Professional Entrance Exams',
    tags: [
      { text: '⚡ JEE • NEET • GATE', border: 'border-purple-200' },
      { text: '🎯 CAT • CLAT • CUET', border: 'border-blue-200' },
      { text: '🌟 Engineering • Medical • Management', border: 'border-indigo-200' },
    ],
    filterFn: (exams) => exams.filter(e => e.category === 'Admission Tests'),
    hoverGlow: 'from-purple-200 via-blue-200 to-indigo-200',
    hoverBorder: 'hover:border-purple-300',
    tabActive: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent shadow-lg shadow-purple-200',
  },
  {
    key: 'medical',
    bgGradient: 'from-emerald-50 via-teal-50 to-cyan-50',
    borderColor: 'border-emerald-200',
    iconBg: 'from-emerald-600 via-teal-600 to-cyan-600',
    iconContent: <img src="https://cdn-icons-png.flaticon.com/512/5996/5996258.png" alt="Medical" className="w-8 h-8 object-contain" />,
    title: 'Medical Entrance',
    titleGradient: 'from-emerald-700 via-teal-700 to-cyan-700',
    subtitle: '🏥 Healthcare Careers • NEET & Medical Entrances',
    tags: [
      { text: '🩺 NEET UG & PG', border: 'border-emerald-200' },
      { text: '🏥 AIIMS • JIPMER', border: 'border-teal-200' },
      { text: '💊 Medical & Allied Health', border: 'border-cyan-200' },
    ],
    filterFn: (exams) => exams.filter(e => e.category === 'Medical Entrance'),
    hoverGlow: 'from-emerald-200 via-teal-200 to-cyan-200',
    hoverBorder: 'hover:border-emerald-300',
    tabActive: 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white border-transparent shadow-lg shadow-emerald-200',
  },
  {
    key: 'banking',
    bgGradient: 'from-rose-50 via-red-50 to-orange-50',
    borderColor: 'border-rose-200',
    iconBg: 'from-rose-600 via-red-600 to-orange-600',
    iconContent: <img src="https://cdn-icons-png.flaticon.com/512/3696/3696141.png" alt="Banking" className="w-8 h-8 object-contain" />,
    title: 'Banking Examinations',
    titleGradient: 'from-rose-700 via-red-700 to-orange-700',
    subtitle: '🏦 Financial Sector Careers • Public & Private Banks',
    tags: [
      { text: '🏛️ IBPS PO & Clerk', border: 'border-rose-200' },
      { text: '💰 SBI PO & Clerk', border: 'border-red-200' },
      { text: '🏆 RBI Grade B', border: 'border-orange-200' },
    ],
    filterFn: (exams) => exams.filter(e => e.category === 'Banking Examinations'),
    hoverGlow: 'from-rose-200 via-red-200 to-orange-200',
    hoverBorder: 'hover:border-rose-300',
    tabActive: 'bg-gradient-to-r from-rose-600 to-orange-600 text-white border-transparent shadow-lg shadow-rose-200',
  },
  {
    key: 'upsc',
    bgGradient: 'from-purple-50 via-violet-50 to-indigo-50',
    borderColor: 'border-purple-200',
    iconBg: 'from-purple-700 via-violet-700 to-indigo-700',
    iconContent: <span className="text-2xl">💼</span>,
    title: 'UPSC Examinations',
    titleGradient: 'from-purple-700 via-violet-700 to-indigo-700',
    subtitle: '🏛️ Civil Services • India\'s Premier Administrative Exams',
    tags: [
      { text: '📋 IAS • IPS • IFS', border: 'border-purple-200' },
      { text: '🎯 CSE • CDS • CAPF', border: 'border-violet-200' },
      { text: '🏆 All India Services', border: 'border-indigo-200' },
    ],
    filterFn: (exams) => exams.filter(e => e.category === 'UPSC Examinations'),
    hoverGlow: 'from-purple-200 via-violet-200 to-indigo-200',
    hoverBorder: 'hover:border-purple-300',
    tabActive: 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white border-transparent shadow-lg shadow-purple-200',
  },
  {
    key: 'ssc',
    bgGradient: 'from-cyan-50 via-blue-50 to-indigo-50',
    borderColor: 'border-cyan-200',
    iconBg: 'from-cyan-600 via-blue-600 to-indigo-600',
    iconContent: <span className="text-2xl">👨🏻‍✈️</span>,
    title: 'SSC Examinations',
    titleGradient: 'from-cyan-700 via-blue-700 to-indigo-700',
    subtitle: '📋 Staff Selection Commission • Central Government Jobs',
    tags: [
      { text: '📊 SSC CGL', border: 'border-cyan-200' },
      { text: '📝 SSC CHSL', border: 'border-blue-200' },
      { text: '🎯 SSC MTS & GD', border: 'border-indigo-200' },
    ],
    filterFn: (exams) => exams.filter(e => e.category === 'SSC Examinations'),
    hoverGlow: 'from-cyan-200 via-blue-200 to-indigo-200',
    hoverBorder: 'hover:border-cyan-300',
    tabActive: 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white border-transparent shadow-lg shadow-cyan-200',
  },
  {
    key: 'teaching',
    bgGradient: 'from-blue-50 via-indigo-50 to-violet-50',
    borderColor: 'border-blue-200',
    iconBg: 'from-blue-600 via-indigo-600 to-violet-600',
    iconContent: <span className="text-2xl">👨‍🏫</span>,
    title: 'Teaching Examinations',
    titleGradient: 'from-blue-700 via-indigo-700 to-violet-700',
    subtitle: '🎓 Education Sector • Shaping Future Generations',
    tags: [
      { text: '👩‍🏫 CTET', border: 'border-blue-200' },
      { text: '🎓 UGC NET', border: 'border-indigo-200' },
      { text: '📚 State TETs', border: 'border-violet-200' },
    ],
    filterFn: (exams) => exams.filter(e => e.category === 'Teaching Examinations'),
    hoverGlow: 'from-blue-200 via-indigo-200 to-violet-200',
    hoverBorder: 'hover:border-blue-300',
    tabActive: 'bg-gradient-to-r from-blue-600 to-violet-600 text-white border-transparent shadow-lg shadow-blue-200',
  },
  {
    key: 'uppsc',
    bgGradient: 'from-orange-50 via-amber-50 to-yellow-50',
    borderColor: 'border-orange-200',
    iconBg: 'from-orange-600 via-amber-600 to-yellow-600',
    iconContent: <span className="text-2xl">🏢</span>,
    title: 'UPPSC Examinations',
    titleGradient: 'from-orange-700 via-amber-700 to-yellow-700',
    subtitle: '🏛️ Uttar Pradesh State • Provincial Civil Services',
    tags: [
      { text: '📋 UP PCS', border: 'border-orange-200' },
      { text: '👮 UP Police', border: 'border-amber-200' },
      { text: '👨‍🏫 UPTET', border: 'border-yellow-200' },
    ],
    filterFn: (exams) => exams.filter(e => e.category === 'UPPSC Examinations'),
    hoverGlow: 'from-orange-200 via-amber-200 to-yellow-200',
    hoverBorder: 'hover:border-orange-300',
    tabActive: 'bg-gradient-to-r from-orange-600 to-yellow-600 text-white border-transparent shadow-lg shadow-orange-200',
  },
  {
    key: 'csbc',
    bgGradient: 'from-red-50 via-rose-50 to-pink-50',
    borderColor: 'border-red-200',
    iconBg: 'from-red-600 via-rose-600 to-pink-600',
    iconContent: <span className="text-2xl">🚔</span>,
    title: 'CSBC Examinations',
    titleGradient: 'from-red-700 via-rose-700 to-pink-700',
    subtitle: '🏛️ Bihar State • Central Selection Board of Constable',
    tags: [
      { text: '👮 Bihar Police', border: 'border-red-200' },
      { text: '🚔 Constable Recruitment', border: 'border-rose-200' },
    ],
    filterFn: (exams) => exams.filter(e => e.category === 'CSBC Examinations'),
    hoverGlow: 'from-red-200 via-rose-200 to-pink-200',
    hoverBorder: 'hover:border-red-300',
    tabActive: 'bg-gradient-to-r from-red-600 to-pink-600 text-white border-transparent shadow-lg shadow-red-200',
  },
  {
    key: 'rsmssb',
    bgGradient: 'from-amber-50 via-orange-50 to-yellow-50',
    borderColor: 'border-amber-200',
    iconBg: 'from-amber-600 via-orange-600 to-yellow-600',
    iconContent: <span className="text-2xl">🏜️</span>,
    title: 'RSMSSB Examinations',
    titleGradient: 'from-amber-700 via-orange-700 to-yellow-700',
    subtitle: '🏛️ Rajasthan State • Revenue & Services Board',
    tags: [
      { text: '📋 Patwari Exam', border: 'border-amber-200' },
      { text: '👮 Rajasthan Police', border: 'border-orange-200' },
    ],
    filterFn: (exams) => exams.filter(e => e.category === 'RSMSSB Examinations'),
    hoverGlow: 'from-amber-200 via-orange-200 to-yellow-200',
    hoverBorder: 'hover:border-amber-300',
    tabActive: 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white border-transparent shadow-lg shadow-amber-200',
  },
  {
    key: 'university',
    bgGradient: 'from-amber-50 via-yellow-50 to-lime-50',
    borderColor: 'border-amber-200',
    iconBg: 'from-amber-600 via-yellow-600 to-lime-600',
    iconContent: <span className="text-2xl">🎓</span>,
    title: 'University & Degree Exams',
    titleGradient: 'from-amber-700 via-yellow-700 to-lime-700',
    subtitle: '🎓 Higher Education • LLB, BCom, BCA & More',
    tags: [
      { text: '⚖️ LLB Entrance', border: 'border-amber-200' },
      { text: '📊 BCom & BCA', border: 'border-yellow-200' },
    ],
    filterFn: (exams) => exams.filter(e => e.category === 'University & Degree Exams'),
    hoverGlow: 'from-amber-200 via-yellow-200 to-lime-200',
    hoverBorder: 'hover:border-amber-300',
    tabActive: 'bg-gradient-to-r from-amber-600 to-lime-600 text-white border-transparent shadow-lg shadow-amber-200',
  },
  {
    key: 'government',
    bgGradient: 'from-lime-50 via-green-50 to-emerald-50',
    borderColor: 'border-lime-200',
    iconBg: 'from-lime-600 via-green-600 to-emerald-600',
    iconContent: <span className="text-2xl">🌾</span>,
    title: 'Government Jobs',
    titleGradient: 'from-lime-700 via-green-700 to-emerald-700',
    subtitle: '📋 Agriculture, Railways & Specialized Services',
    tags: [
      { text: '🚂 RRB NTPC', border: 'border-lime-200' },
      { text: '🌾 Agriculture Exams', border: 'border-green-200' },
    ],
    filterFn: (exams) => exams.filter(e => e.category === 'Government Jobs'),
    hoverGlow: 'from-lime-200 via-green-200 to-emerald-200',
    hoverBorder: 'hover:border-lime-300',
    tabActive: 'bg-gradient-to-r from-lime-600 to-emerald-600 text-white border-transparent shadow-lg shadow-lime-200',
  },
];

const KNOWN_CATEGORY_NAMES = [
  'Defence Exams', 'Admission Tests', 'Medical Entrance', 'Banking Examinations',
  'UPSC Examinations', 'SSC Examinations', 'Teaching Examinations', 'UPPSC Examinations',
  'CSBC Examinations', 'RSMSSB Examinations', 'University & Degree Exams',
  'Government Jobs', 'Language Games',
];

const LANGUAGE_EXAMS = [
  { id: 'SPANISH', label: 'Spanish Legends', badge: 'Quick Play', emoji: '🎮', gradient: 'from-orange-400 via-red-500 to-pink-500', btnGradient: 'from-orange-500 to-pink-500', borderHover: 'hover:border-orange-400' },
  { id: 'FRENCH', label: 'French Quest', badge: '5 Min Rounds', emoji: '🎯', gradient: 'from-blue-500 via-indigo-500 to-purple-600', btnGradient: 'from-blue-500 to-purple-600', borderHover: 'hover:border-blue-400' },
  { id: 'TAMIL', label: 'Tamil Trivia Blast', badge: 'Quick Play', emoji: '🚀', gradient: 'from-amber-400 via-orange-500 to-red-500', btnGradient: 'from-amber-500 to-red-500', borderHover: 'hover:border-amber-400' },
  { id: 'TELUGU', label: 'Telugu Speed Run', badge: 'Live Battle', emoji: '⚡', gradient: 'from-green-500 via-teal-500 to-cyan-500', btnGradient: 'from-green-500 to-cyan-500', borderHover: 'hover:border-green-400' },
  { id: 'KANNADA', label: 'Kannada Kings', badge: 'Quick Play', emoji: '👑', gradient: 'from-purple-500 via-violet-500 to-indigo-600', btnGradient: 'from-purple-500 to-indigo-600', borderHover: 'hover:border-purple-400' },
  { id: 'CHINESE', label: 'Chinese Challenge', badge: '5 Min Rounds', emoji: '🐉', gradient: 'from-red-500 via-rose-500 to-pink-600', btnGradient: 'from-red-500 to-pink-600', borderHover: 'hover:border-red-400' },
  { id: 'JAPANESE', label: 'Japanese Ninja', badge: 'Quick Play', emoji: '🥷', gradient: 'from-pink-500 via-rose-500 to-red-500', btnGradient: 'from-pink-500 to-red-500', borderHover: 'hover:border-pink-400' },
  { id: 'KOREAN', label: 'K-Pop Korean', badge: 'Trending', emoji: '🎵', gradient: 'from-violet-500 via-purple-500 to-fuchsia-500', btnGradient: 'from-violet-500 to-fuchsia-500', borderHover: 'hover:border-violet-400' },
];

const HomeDesktopSections = ({ exams }) => {
  const navigate = useNavigate();
  const otherExams = exams.filter(e => !KNOWN_CATEGORY_NAMES.includes(e.category));
  const hasLanguageGames = exams.some(e => e.category === 'Language Games');

  // Build the list of tabs that actually have content — no more stacking every
  // category as its own full-width banner section.
  const tabs = useMemo(() => {
    const list = EXAM_SECTIONS
      .map(section => ({ ...section, exams: section.filterFn(exams) }))
      .filter(section => section.exams.length > 0);

    if (hasLanguageGames) {
      list.push({
        key: 'language',
        title: 'Language Games',
        iconContent: <span className="text-2xl">🎮</span>,
        tabActive: 'bg-gradient-to-r from-fuchsia-600 to-rose-600 text-white border-transparent shadow-lg shadow-fuchsia-200',
        isLanguage: true,
      });
    }

    if (otherExams.length > 0) {
      list.push({
        key: 'other',
        title: 'Other Competitive Exams',
        iconContent: <BookOpenIcon className="w-6 h-6" />,
        tabActive: 'bg-gradient-to-r from-gray-600 to-slate-600 text-white border-transparent shadow-lg shadow-gray-200',
        exams: otherExams,
        hoverGlow: 'from-gray-200 via-slate-200 to-zinc-200',
        hoverBorder: 'hover:border-gray-300',
      });
    }

    return list;
  }, [exams, hasLanguageGames, otherExams]);

  const [activeKey, setActiveKey] = useState(tabs[0]?.key);
  const activeTab = tabs.find(t => t.key === activeKey) || tabs[0];

  if (!tabs.length) return null;

  return (
    <div className="mb-16">
      {/* Single shared header — replaces the old per-category banner blocks */}
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
          Browse by Category
        </h2>
        <p className="text-gray-600 text-lg">Pick a category to see its exams</p>
      </div>

      {/* Category tabs — one compact pill per category instead of a full banner each */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveKey(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full border-2 font-semibold text-sm transition-all duration-200 ${
              activeKey === tab.key
                ? tab.tabActive
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center justify-center w-6 h-6">{tab.iconContent}</span>
            {tab.title}
            {tab.exams && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeKey === tab.key ? 'bg-white/20' : 'bg-gray-100'}`}>
                {tab.exams.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Only the active category's content renders below — no repeated banners */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeKey}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab.subtitle && (
            <div className="text-center mb-8">
              <p className="text-gray-700 font-medium text-lg">{activeTab.subtitle}</p>
              {activeTab.tags?.length > 0 && (
                <div className="flex items-center justify-center gap-3 text-sm text-gray-600 mt-4 flex-wrap">
                  {activeTab.tags.map((tag, i) => (
                    <span key={i} className={`px-4 py-2 bg-white rounded-full shadow-sm border ${tag.border}`}>
                      {tag.text}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab.isLanguage ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {LANGUAGE_EXAMS.map((lang, i) => (
                <motion.div
                  key={lang.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className={`bg-white rounded-3xl shadow-lg overflow-hidden cursor-pointer transition-all hover:shadow-2xl border-2 border-transparent ${lang.borderHover}`}
                  onClick={() => navigate(`/exam/${lang.id}`)}
                  data-testid={`exam-card-${lang.id}`}
                >
                  <div className={`bg-gradient-to-br ${lang.gradient} p-6 relative`}>
                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-white text-xs font-bold">{lang.badge}</span>
                    </div>
                    <div className="text-5xl mb-2">{lang.emoji}</div>
                    <h4 className="text-white font-black text-xl mb-1 drop-shadow-lg">{lang.label}</h4>
                    <p className="text-white/90 text-sm">Earn gems & compete!</p>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-600 text-sm">💎 Gems</span>
                      <span className="font-bold text-purple-600">100+</span>
                    </div>
                    <button className={`w-full bg-gradient-to-r ${lang.btnGradient} text-white py-2 rounded-xl font-bold hover:shadow-lg transition-all`}>
                      🎯 Play Now
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeTab.exams.map((exam, index) => (
                <HomeExamCard
                  key={exam.id}
                  exam={exam}
                  index={index}
                  hoverGlow={activeTab.hoverGlow}
                  hoverBorder={activeTab.hoverBorder}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default HomeDesktopSections;