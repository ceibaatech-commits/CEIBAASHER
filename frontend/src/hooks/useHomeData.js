import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = window.location.origin;

export const CATEGORIES = [
  { id: 'admission', label: 'Admission Tests', icon: '🎓', color: 'from-violet-600 to-purple-600' },
  { id: 'medical', label: 'Medical', icon: '🏥', color: 'from-emerald-600 to-teal-600', image: 'https://cdn-icons-png.flaticon.com/512/5996/5996258.png' },
  { id: 'defence', label: 'Defence', icon: '🎖️', color: 'from-green-700 to-emerald-700', image: 'https://cdn-icons-png.flaticon.com/512/6142/6142033.png' },
  { id: 'banking', label: 'Banking', icon: '🏦', color: 'from-rose-600 to-red-600', image: 'https://cdn-icons-png.flaticon.com/512/3696/3696141.png' },
  { id: 'university', label: 'University & Degree', icon: '🎓', color: 'from-amber-600 to-yellow-600', image: 'https://customer-assets.emergentagent.com/job_quizmaster-299/artifacts/ndexgxo7_image.png' },
  { id: 'teaching', label: 'Teaching Examinations', icon: '👨‍🏫', color: 'from-blue-600 to-indigo-600' },
  { id: 'ssc', label: 'SSC Examinations', icon: '👨🏻‍✈️', color: 'from-cyan-600 to-blue-600' },
  { id: 'upsc', label: 'UPSC Examinations', icon: '💼', color: 'from-purple-600 to-pink-600' },
  { id: 'uppsc', label: 'UPPSC', icon: '🏢', color: 'from-orange-600 to-red-600' },
  { id: 'csbc', label: 'CSBC', icon: '🚔', color: 'from-red-600 to-pink-600' },
  { id: 'rsmssb', label: 'RSMSSB', icon: '🏜️', color: 'from-amber-600 to-orange-600' },
  { id: 'language', label: 'Language Proficiency Tests', icon: '🗣️', color: 'from-teal-600 to-green-600', image: 'https://customer-assets.emergentagent.com/job_quizmaster-299/artifacts/fcifoi4k_image.png' },
];

export const SKILL_DRILL_CLASSES = [
  { id: 'class-6', name: 'Class 6', icon: '📗', color: 'from-cyan-500 to-blue-500', subjects: 'Science, Maths, SST' },
  { id: 'class-7', name: 'Class 7', icon: '📘', color: 'from-blue-500 to-indigo-500', subjects: 'Science, Maths, SST' },
  { id: 'class-8', name: 'Class 8', icon: '📙', color: 'from-indigo-500 to-purple-500', subjects: 'Science, Maths, SST' },
  { id: 'class-9', name: 'Class 9', icon: '📕', color: 'from-purple-500 to-pink-500', subjects: 'Science, Maths, SST' },
  { id: 'class-10', name: 'Class 10', icon: '📓', color: 'from-pink-500 to-rose-500', subjects: 'Science, Maths, SST' },
  { id: 'class-11/science', name: 'Class 11 Science', icon: '🔬', color: 'from-emerald-500 to-teal-500', subjects: 'Physics, Chemistry, Maths/Bio' },
  { id: 'class-11/commerce', name: 'Class 11 Commerce', icon: '📊', color: 'from-amber-500 to-orange-500', subjects: 'Accounts, Economics, Business' },
  { id: 'class-11/humanities', name: 'Class 11 Humanities', icon: '📜', color: 'from-violet-500 to-purple-500', subjects: 'History, Geography, Political Sc.' },
  { id: 'class-12/science', name: 'Class 12 Science', icon: '🔬', color: 'from-teal-500 to-cyan-500', subjects: 'Physics, Chemistry, Maths/Bio' },
  { id: 'class-12/commerce', name: 'Class 12 Commerce', icon: '📊', color: 'from-orange-500 to-red-500', subjects: 'Accounts, Economics, Business' },
  { id: 'class-12/humanities', name: 'Class 12 Humanities', icon: '📜', color: 'from-purple-500 to-pink-500', subjects: 'History, Geography, Political Sc.' },
];

const CATEGORY_MAP = {
  admission: { ids: ['CUET', 'CAT', 'CLAT', 'IPM', 'JEE', 'NEET', 'GATE', 'UGC_NET'], categories: ['Admission Tests'] },
  medical: { ids: ['NEET'], categories: ['Medical Entrance', 'Medical'] },
  defence: { ids: ['NDA', 'Agniveer', 'CDS', 'CAPF', 'AFCAT'], categories: ['Defence', 'Defence Examinations'] },
  banking: { ids: ['IBPS_PO', 'SBI_PO', 'RBI_Grade_B'], categories: ['Banking Examinations', 'Banking'] },
  university: { ids: ['LLB', 'BCOM', 'BCA'], categories: ['University & Degree Exams', 'University & Degree'] },
  teaching: { ids: ['CTET', 'UGC_NET'], categories: ['Teaching Examinations', 'Teaching'] },
  ssc: { ids: ['SSC_CGL', 'SSC_CHSL'], categories: ['SSC Examinations'] },
  upsc: { ids: ['UPSC'], categories: ['UPSC Examinations'] },
  uppsc: { ids: ['UP_Police_Constable', 'UPTET'], categories: ['UPPSC Examinations', 'UPPSC'] },
  csbc: { ids: ['Bihar_Police_Constable'], categories: ['CSBC Examinations', 'CSBC'] },
  rsmssb: { ids: ['RSMSSB_Patwari', 'Rajasthan_Police_Constable'], categories: ['RSMSSB Examinations', 'RSMSSB'] },
  language: { ids: ['SPANISH', 'FRENCH', 'TAMIL', 'TELUGU', 'KANNADA', 'CHINESE', 'JAPANESE', 'KOREAN', 'IELTS', 'TOEFL'], categories: ['Language Proficiency Tests', 'Language', 'Language Learning', 'Language Games'] },
};

const useHomeData = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveBattlesCount, setLiveBattlesCount] = useState(() => 2000 + Math.floor(Math.random() * 1200));

  useEffect(() => {
    fetchExams();
    checkAuth();
  // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const tick = () => setLiveBattlesCount(prev => {
      const delta = Math.floor(Math.random() * 41) - 20;
      const next = prev + delta;
      if (next < 2000) return 2000 + Math.floor(Math.random() * 60);
      if (next > 3500) return 3500 - Math.floor(Math.random() * 60);
      return next;
    });
    const id = setInterval(tick, 4000);
    return () => clearInterval(id);
  }, []);

  const checkAuth = () => {
    const storedUser = localStorage.getItem('ceibaa_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsLoggedIn(true);
      } catch {
        localStorage.removeItem('ceibaa_user');
      }
    }
  };

  const fetchExams = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/quiz/exams`);
      if (response.data.success) setExams(response.data.exams);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => navigate('/login');
  const handleLogout = () => {
    localStorage.removeItem('ceibaa_user');
    setUser(null);
    setIsLoggedIn(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      document.getElementById('exams-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getFilteredExams = () => {
    let filtered = exams;
    if (activeCategory) {
      const mapping = CATEGORY_MAP[activeCategory] || { ids: [], categories: [] };
      filtered = filtered.filter(exam =>
        mapping.ids.includes(exam.id) || mapping.categories.includes(exam.category)
      );
    }
    if (searchQuery) {
      filtered = filtered.filter(exam =>
        exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  return {
    exams, loading, user, isLoggedIn,
    activeCategory, setActiveCategory,
    searchQuery, setSearchQuery,
    liveBattlesCount,
    handleLogin, handleLogout, handleSearch, getFilteredExams,
  };
};

export default useHomeData;
