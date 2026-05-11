import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import HomeExamSection from './HomeExamSection';
import HomeExamCard from './HomeExamCard';
import { BookOpen as BookOpenIcon } from 'lucide-react';

// Actual category names from the database (verified 2026-02)
const EXAM_SECTIONS = [
  {
    key: 'defence',
    bgGradient: 'from-green-50 via-emerald-50 to-teal-50',
    borderColor: 'border-green-200',
    iconBg: 'from-green-700 via-emerald-700 to-teal-700',
    iconContent: <img src="https://cdn-icons-png.flaticon.com/512/6142/6142033.png" alt="Defence" className="w-10 h-10 object-contain" />,
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
  },
  {
    key: 'admission',
    bgGradient: 'from-purple-50 via-blue-50 to-indigo-50',
    borderColor: 'border-purple-200',
    iconBg: 'from-purple-600 via-blue-600 to-indigo-600',
    iconContent: <span className="text-3xl">🎓</span>,
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
  },
  {
    key: 'medical',
    bgGradient: 'from-emerald-50 via-teal-50 to-cyan-50',
    borderColor: 'border-emerald-200',
    iconBg: 'from-emerald-600 via-teal-600 to-cyan-600',
    iconContent: <img src="https://cdn-icons-png.flaticon.com/512/5996/5996258.png" alt="Medical" className="w-10 h-10 object-contain" />,
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
  },
  {
    key: 'banking',
    bgGradient: 'from-rose-50 via-red-50 to-orange-50',
    borderColor: 'border-rose-200',
    iconBg: 'from-rose-600 via-red-600 to-orange-600',
    iconContent: <img src="https://cdn-icons-png.flaticon.com/512/3696/3696141.png" alt="Banking" className="w-10 h-10 object-contain" />,
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
  },
  {
    key: 'upsc',
    bgGradient: 'from-purple-50 via-violet-50 to-indigo-50',
    borderColor: 'border-purple-200',
    iconBg: 'from-purple-700 via-violet-700 to-indigo-700',
    iconContent: <span className="text-3xl">💼</span>,
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
  },
  {
    key: 'ssc',
    bgGradient: 'from-cyan-50 via-blue-50 to-indigo-50',
    borderColor: 'border-cyan-200',
    iconBg: 'from-cyan-600 via-blue-600 to-indigo-600',
    iconContent: <span className="text-3xl">👨🏻‍✈️</span>,
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
  },
  {
    key: 'teaching',
    bgGradient: 'from-blue-50 via-indigo-50 to-violet-50',
    borderColor: 'border-blue-200',
    iconBg: 'from-blue-600 via-indigo-600 to-violet-600',
    iconContent: <span className="text-3xl">👨‍🏫</span>,
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
  },
  {
    key: 'uppsc',
    bgGradient: 'from-orange-50 via-amber-50 to-yellow-50',
    borderColor: 'border-orange-200',
    iconBg: 'from-orange-600 via-amber-600 to-yellow-600',
    iconContent: <span className="text-3xl">🏢</span>,
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
  },
  {
    key: 'csbc',
    bgGradient: 'from-red-50 via-rose-50 to-pink-50',
    borderColor: 'border-red-200',
    iconBg: 'from-red-600 via-rose-600 to-pink-600',
    iconContent: <span className="text-3xl">🚔</span>,
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
  },
  {
    key: 'rsmssb',
    bgGradient: 'from-amber-50 via-orange-50 to-yellow-50',
    borderColor: 'border-amber-200',
    iconBg: 'from-amber-600 via-orange-600 to-yellow-600',
    iconContent: <span className="text-3xl">🏜️</span>,
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
  },
  {
    key: 'university',
    bgGradient: 'from-amber-50 via-yellow-50 to-lime-50',
    borderColor: 'border-amber-200',
    iconBg: 'from-amber-600 via-yellow-600 to-lime-600',
    iconContent: <span className="text-3xl">🎓</span>,
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
  },
  {
    key: 'government',
    bgGradient: 'from-lime-50 via-green-50 to-emerald-50',
    borderColor: 'border-lime-200',
    iconBg: 'from-lime-600 via-green-600 to-emerald-600',
    iconContent: <span className="text-3xl">🌾</span>,
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

  return (
    <>
      {EXAM_SECTIONS.map(section => {
        const sectionExams = section.filterFn(exams);
        if (!sectionExams.length) return null;
        return (
          <HomeExamSection
            key={section.key}
            bgGradient={section.bgGradient}
            borderColor={section.borderColor}
            iconBg={section.iconBg}
            iconContent={section.iconContent}
            title={section.title}
            titleGradient={section.titleGradient}
            subtitle={section.subtitle}
            tags={section.tags}
            exams={sectionExams}
            hoverGlow={section.hoverGlow}
            hoverBorder={section.hoverBorder}
          />
        );
      })}

      {/* Language Games — special game-mode cards */}
      {exams.some(e => e.category === 'Language Games') && (
        <div className="mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 rounded-3xl p-8 mb-8 border-2 border-purple-200 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-3">
              <motion.div className="w-16 h-16 bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 rounded-2xl flex items-center justify-center shadow-xl"
                animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="text-3xl">🎮</span>
              </motion.div>
              <div>
                <h3 className="text-3xl font-black bg-gradient-to-r from-purple-700 via-pink-700 to-rose-700 bg-clip-text text-transparent">
                  Language Proficiency Tests
                </h3>
                <p className="text-gray-600 text-lg font-medium mt-1">Play, Compete & Master Languages! 🚀</p>
              </div>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {LANGUAGE_EXAMS.map((lang, i) => (
              <motion.div key={lang.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }} whileHover={{ y: -8, scale: 1.02 }}
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
        </div>
      )}

      {/* Catch-all for any uncategorised exams */}
      {otherExams.length > 0 && (
        <HomeExamSection
          bgGradient="from-gray-50 via-slate-50 to-gray-50"
          borderColor="border-gray-200"
          iconBg="from-gray-600 via-slate-600 to-zinc-600"
          iconContent={<BookOpenIcon className="w-10 h-10 text-white" />}
          title="Other Competitive Exams"
          titleGradient="from-gray-700 via-slate-700 to-zinc-700"
          subtitle="📖 More Opportunities"
          tags={[{ text: '📋 State & Specialized Services', border: 'border-gray-200' }]}
          exams={otherExams}
          hoverGlow="from-gray-200 via-slate-200 to-zinc-200"
          hoverBorder="hover:border-gray-300"
        />
      )}
    </>
  );
};

export default HomeDesktopSections;

