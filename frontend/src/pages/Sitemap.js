import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, BookOpen, GraduationCap, Shield, Building2, Briefcase, Scale, Globe2, Languages } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';

const CBSE_CLASSES = [
  {
    num: '6', label: 'Class 6',
    subjects: [
      { name: 'Mathematics - Ganita Prakash', slug: 'mathematics---ganita-prakash' },
      { name: 'Hindi - Malhar', slug: 'hindi---malhar' },
      { name: 'English - Poorvi', slug: 'english---poorvi' },
      { name: 'Science - Curiosity', slug: 'science---curiosity' },
      { name: 'Social Science - Exploring Society', slug: 'social-science---exploring-society' },
      { name: 'Sanskrit - Deepakam', slug: 'sanskrit---deepakam' },
    ]
  },
  {
    num: '7', label: 'Class 7',
    subjects: [
      { name: 'Mathematics - Ganita Prakash', slug: 'mathematics---ganita-prakash' },
      { name: 'Hindi - Malhar', slug: 'hindi---malhar' },
      { name: 'English - Poorvi', slug: 'english---poorvi' },
      { name: 'Science - Curiosity', slug: 'science---curiosity' },
      { name: 'Social Science - Exploring Society', slug: 'social-science---exploring-society' },
      { name: 'Sanskrit - Sulabha', slug: 'sanskrit---sulabha' },
    ]
  },
  {
    num: '8', label: 'Class 8',
    subjects: [
      { name: 'Mathematics', slug: 'mathematics' },
      { name: 'Hindi - Malhar', slug: 'hindi---malhar' },
      { name: 'English - Poorvi', slug: 'english---poorvi' },
      { name: 'Science', slug: 'science' },
      { name: 'Social Science', slug: 'social-science' },
      { name: 'Sanskrit - Deepakam', slug: 'sanskrit---deepakam' },
    ]
  },
  {
    num: '9', label: 'Class 9',
    subjects: [
      { name: 'Mathematics', slug: 'mathematics' },
      { name: 'Science', slug: 'science' },
      { name: 'Hindi Kshitij', slug: 'hindi-kshitij' },
      { name: 'English Beehive', slug: 'english-beehive' },
      { name: 'English Moments', slug: 'english-moments' },
      { name: 'Geography', slug: 'geography' },
      { name: 'History', slug: 'history' },
      { name: 'Civics', slug: 'civics' },
      { name: 'Economics', slug: 'economics' },
      { name: 'Sanskrit', slug: 'sanskrit' },
    ]
  },
  {
    num: '10', label: 'Class 10',
    subjects: [
      { name: 'Mathematics', slug: 'mathematics' },
      { name: 'Science', slug: 'science' },
      { name: 'Hindi Kshitij', slug: 'hindi-kshitij' },
      { name: 'Hindi Kritika', slug: 'hindi-kritika' },
      { name: 'English First Flight', slug: 'english-first-flight' },
      { name: 'English Footprints Without Feet', slug: 'english-footprints-without-feet' },
      { name: 'Social Science', slug: 'social-science' },
      { name: 'Economics', slug: 'economics' },
      { name: 'Sanskrit', slug: 'sanskrit' },
    ]
  },
];

const SENIOR_CLASSES = [
  {
    label: 'Class 11 - Science', path: '/chapter-tests/class-11/science',
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English']
  },
  {
    label: 'Class 11 - Commerce', path: '/chapter-tests/class-11/commerce',
    subjects: ['Accountancy', 'Business Studies', 'Economics', 'Mathematics', 'English']
  },
  {
    label: 'Class 11 - Humanities', path: '/chapter-tests/class-11/humanities',
    subjects: ['History', 'Political Science', 'Geography', 'Sociology', 'Psychology', 'Economics', 'English']
  },
  {
    label: 'Class 12 - Science', path: '/chapter-tests/class-12/science',
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English']
  },
  {
    label: 'Class 12 - Commerce', path: '/chapter-tests/class-12/commerce',
    subjects: ['Accountancy', 'Business Studies', 'Economics', 'Mathematics', 'English']
  },
  {
    label: 'Class 12 - Humanities', path: '/chapter-tests/class-12/humanities',
    subjects: ['History', 'Political Science', 'Geography', 'Sociology', 'Psychology', 'Economics', 'English']
  },
];

const EXAM_CATEGORIES = [
  {
    name: 'Admission Tests', icon: GraduationCap,
    exams: [
      { name: 'JEE Main', id: 'JEE' }, { name: 'NEET', id: 'NEET' }, { name: 'CUET UG', id: 'CUET' },
      { name: 'GATE', id: 'GATE' }, { name: 'CAT', id: 'CAT' }, { name: 'CLAT', id: 'CLAT' },
      { name: 'UGC NET', id: 'UGC_NET' }, { name: 'GMAT', id: 'GMAT' }, { name: 'NATA', id: 'NATA' },
    ]
  },
  {
    name: 'Banking Exams', icon: Building2,
    exams: [
      { name: 'SBI PO', id: 'SBI_PO' }, { name: 'SBI Clerk', id: 'SBI_CLERK' }, { name: 'IBPS PO', id: 'IBPS_PO' },
      { name: 'IBPS Clerk', id: 'IBPS_CLERK' }, { name: 'IBPS RRB PO', id: 'IBPS_RRB_PO' }, { name: 'IBPS SO', id: 'IBPS_SO' },
      { name: 'RBI Grade B', id: 'RBI_GRADE_B' }, { name: 'LIC AAO', id: 'LIC_AAO' }, { name: 'LIC ADO', id: 'LIC_ADO' },
      { name: 'NABARD Grade B', id: 'NABARD' },
    ]
  },
  {
    name: 'SSC Exams', icon: Briefcase,
    exams: [
      { name: 'SSC CGL', id: 'SSC_CGL' }, { name: 'SSC CHSL', id: 'SSC_CHSL' },
      { name: 'SSC GD Constable', id: 'SSC_GD' }, { name: 'SSC Steno', id: 'SSC_STENO' },
    ]
  },
  {
    name: 'Defence Exams', icon: Shield,
    exams: [
      { name: 'NDA', id: 'NDA' }, { name: 'CDS', id: 'CDS' }, { name: 'AFCAT', id: 'AFCAT' },
      { name: 'CAPF AC', id: 'CAPF' }, { name: 'Agniveer', id: 'Agniveer' },
    ]
  },
  {
    name: 'Teaching Exams', icon: BookOpen,
    exams: [
      { name: 'CTET', id: 'CTET' }, { name: 'UPTET', id: 'UPTET' }, { name: 'HTET', id: 'HTET' },
      { name: 'KVS PRT', id: 'KVS_PRT' }, { name: 'DSSB TGT', id: 'DSSB_TGT' }, { name: 'DSSB PGT', id: 'DSSB_PGT' },
      { name: 'UP TGT', id: 'UP_TGT' }, { name: 'UP PGT', id: 'UP_PGT' }, { name: 'MPSET', id: 'MPSET' }, { name: 'TS SET', id: 'TS_SET' },
    ]
  },
  {
    name: 'UPSC Exams', icon: Scale,
    exams: [
      { name: 'UPSC CSE', id: 'UPSC' }, { name: 'EPFO EO/AO', id: 'EPFO' }, { name: 'IES/ISS', id: 'IES_ISS' },
    ]
  },
  {
    name: 'State Exams', icon: Globe2,
    exams: [
      { name: 'Rajasthan Police', id: 'Rajasthan_Police_Constable' }, { name: 'Bihar Police', id: 'Bihar_Police_Constable' },
      { name: 'UP Police', id: 'UP_Police_Constable' }, { name: 'RSMSSB Patwari', id: 'RSMSSB_Patwari' },
      { name: 'RPSC', id: 'RPSC' }, { name: 'RRB NTPC', id: 'RRB_NTPC' },
    ]
  },
  {
    name: 'University & Degree', icon: GraduationCap,
    exams: [
      { name: 'BCA (3 Year)', id: 'BCA' }, { name: 'B.Com (3 Year)', id: 'BCOM' }, { name: 'LLB (5 Year)', id: 'LLB' },
    ]
  },
  {
    name: 'Language Learning', icon: Languages,
    exams: [
      { name: 'French', id: 'FRENCH' }, { name: 'Spanish', id: 'SPANISH' }, { name: 'Japanese', id: 'JAPANESE' },
      { name: 'Korean', id: 'KOREAN' }, { name: 'Chinese', id: 'CHINESE' },
      { name: 'Tamil', id: 'TAMIL' }, { name: 'Telugu', id: 'TELUGU' }, { name: 'Kannada', id: 'KANNADA' },
    ]
  },
];

const SectionToggle = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        {Icon && <Icon className="w-5 h-5 text-indigo-600 flex-shrink-0" />}
        <span className="font-semibold text-gray-900 flex-1">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-4 pt-1">{children}</div>}
    </div>
  );
};

const Sitemap = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Sitemap - Ceibaa",
    "description": "Complete sitemap of Ceibaa. Browse free MCQs, NCERT solutions, chapter-wise quizzes for CBSE Class 6-12, JEE, NEET, Banking, SSC, Defence and more.",
    "url": "https://ceibaa.in/sitemap"
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <SEOHead
        title="Sitemap - All Free MCQs, NCERT Solutions & Quizzes"
        description="Complete sitemap of Ceibaa. Browse free chapter-wise MCQs, NCERT solutions, interactive quizzes for CBSE Class 6-12, JEE, NEET, Banking, SSC, Defence exams and more."
        keywords="ceibaa sitemap, free mcq, ncert solutions, cbse class 6 7 8 9 10 11 12, jee neet ssc banking quizzes"
        canonical="https://ceibaa.in/sitemap"
        jsonLd={jsonLd}
      />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">Sitemap</h1>
        <p className="text-gray-500 mb-8 text-sm sm:text-base">Browse all free MCQs, NCERT solutions, chapter-wise quizzes and competitive exam prep on Ceibaa.</p>

        {/* Main Pages */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Main Pages</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {[
              { name: 'Home', path: '/' },
              { name: 'Victory Lane (Feed)', path: '/victory-lane' },
              { name: 'Chapter Tests', path: '/chapter-tests' },
              { name: 'Leaderboard', path: '/leaderboard' },
              { name: 'Join Quiz Room', path: '/join-room' },
              { name: 'My Board', path: '/board' },
              { name: 'AI Tutor - Divya', path: '/divya' },
              { name: 'About', path: '/about' },
              { name: 'Contact', path: '/contact' },
              { name: 'Privacy Policy', path: '/privacy' },
              { name: 'Terms of Service', path: '/terms' },
            ].map(p => (
              <Link key={p.path} to={p.path} className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline py-1">
                {p.name}
              </Link>
            ))}
          </div>
        </section>

        {/* CBSE Chapter Tests - Classes 6-10 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">CBSE Chapter-wise MCQs & NCERT Solutions</h2>
          <p className="text-gray-500 text-sm mb-4">Free chapter-wise MCQs, NCERT solutions, and interactive quizzes for CBSE Class 6 to 12.</p>
          <div className="space-y-3">
            {CBSE_CLASSES.map(cls => (
              <SectionToggle key={cls.num} title={`${cls.label} - Free MCQs & NCERT Solutions`} icon={BookOpen} defaultOpen={cls.num === '7' || cls.num === '8'}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <Link to={`/chapter-tests/${cls.num}`} className="text-sm font-medium text-indigo-600 hover:underline col-span-full mb-1">
                    All {cls.label} Subjects
                  </Link>
                  {cls.subjects.map(sub => (
                    <Link
                      key={sub.slug}
                      to={`/chapter-tests/${cls.num}/${sub.slug}`}
                      className="text-sm text-gray-700 hover:text-indigo-600 hover:underline py-0.5"
                    >
                      {cls.label} {sub.name} - Free MCQs
                    </Link>
                  ))}
                </div>
              </SectionToggle>
            ))}
          </div>
        </section>

        {/* Senior Secondary Classes 11-12 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Class 11 & 12 - Stream-wise Chapter Tests</h2>
          <div className="space-y-3">
            {SENIOR_CLASSES.map(cls => (
              <SectionToggle key={cls.label} title={cls.label} icon={GraduationCap}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <Link to={cls.path} className="text-sm font-medium text-indigo-600 hover:underline col-span-full mb-1">
                    All Subjects
                  </Link>
                  {cls.subjects.map(sub => (
                    <span key={sub} className="text-sm text-gray-700 py-0.5">{sub}</span>
                  ))}
                </div>
              </SectionToggle>
            ))}
          </div>
        </section>

        {/* Competitive Exams */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Competitive Exam Mock Tests & Quizzes</h2>
          <p className="text-gray-500 text-sm mb-4">Free mock tests and topic-wise quizzes for all major competitive exams in India.</p>
          <div className="space-y-3">
            {EXAM_CATEGORIES.map(cat => (
              <SectionToggle key={cat.name} title={cat.name} icon={cat.icon}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                  {cat.exams.map(exam => (
                    <Link
                      key={exam.id}
                      to={`/exam/${exam.id}`}
                      className="text-sm text-gray-700 hover:text-indigo-600 hover:underline py-0.5"
                    >
                      {exam.name} - Free Mock Test
                    </Link>
                  ))}
                </div>
              </SectionToggle>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Features</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { name: '1v1 Live Battles', path: '/' },
              { name: 'AI Tutor - Divya', path: '/divya' },
              { name: 'Room-based Quizzes', path: '/join-room' },
              { name: 'Victory Lane (Social Feed)', path: '/victory-lane' },
              { name: 'Leaderboard & Rankings', path: '/leaderboard' },
              { name: 'Performance Dashboard', path: '/board' },
            ].map(f => (
              <Link key={f.name} to={f.path} className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline py-1">
                {f.name}
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Sitemap;
