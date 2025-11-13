import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, BookOpen, Award } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ChapterTestHome = () => {
  const navigate = useNavigate();

  // Check auth state
  const [user, setUser] = React.useState(null);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  React.useEffect(() => {
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
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('ceibaa_user');
    setUser(null);
    setIsLoggedIn(false);
    navigate('/');
  };

  const classes = [
    { class: 6, color: 'from-blue-500 to-blue-600', icon: '📚' },
    { class: 7, color: 'from-purple-500 to-purple-600', icon: '📖' },
    { class: 8, color: 'from-pink-500 to-pink-600', icon: '✏️' },
    { class: 9, color: 'from-orange-500 to-orange-600', icon: '📝' },
    { class: 10, color: 'from-red-500 to-red-600', icon: '🎓' },
    { class: 11, color: 'from-teal-500 to-teal-600', icon: '📊' },
    { class: 12, color: 'from-indigo-500 to-indigo-600', icon: '🏆' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Decorative Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-72 h-72 bg-pink-200 rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 right-1/3 w-56 h-56 bg-yellow-200 rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
        
        {/* Geometric Shapes */}
        <div className="absolute top-32 right-16 w-0 h-0 border-l-[80px] border-l-transparent border-r-[80px] border-r-transparent border-b-[120px] border-b-purple-200 opacity-10 rotate-12"></div>
        <div className="absolute bottom-48 left-32 w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-b-[100px] border-b-blue-200 opacity-10 -rotate-45"></div>
        <div className="absolute top-64 left-1/2 w-32 h-32 bg-pink-200 opacity-10 rotate-45 rounded-lg"></div>
      </div>

      <Header 
        isLoggedIn={isLoggedIn}
        user={user}
        onLogin={() => navigate('/login')}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Hero Section - Enhanced */}
        <div className="text-center mb-12 relative">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="bg-gradient-to-r from-cyan-500 to-purple-600 p-6 rounded-full shadow-2xl animate-bounce">
                <GraduationCap className="w-20 h-20 text-white" />
              </div>
              {/* Decorative rings around icon */}
              <div className="absolute inset-0 rounded-full border-4 border-cyan-300 opacity-20 animate-ping"></div>
              <div className="absolute inset-0 rounded-full border-2 border-purple-300 opacity-30 scale-125"></div>
            </div>
          </div>
          <h1 className="text-6xl font-black text-gray-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
            CBSE Chapter Tests
          </h1>
          <p className="text-2xl text-gray-700 max-w-3xl mx-auto font-semibold">
            Master every chapter with focused practice tests ✨
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-3">
            Select your class to get started on your learning journey!
          </p>
          
          {/* Floating badges */}
          <div className="flex justify-center gap-4 mt-8 flex-wrap">
            <span className="bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full text-sm font-bold text-blue-600 shadow-lg border border-blue-200">
              🎯 Chapter-wise Practice
            </span>
            <span className="bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full text-sm font-bold text-purple-600 shadow-lg border border-purple-200">
              📚 NCERT Aligned
            </span>
            <span className="bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full text-sm font-bold text-pink-600 shadow-lg border border-pink-200">
              ⚡ Instant Feedback
            </span>
          </div>
        </div>

        {/* Stats Section - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <div>
                <p className="text-4xl font-black text-white">500+</p>
                <p className="text-white/90 font-semibold">Chapter Tests</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                <Award className="w-10 h-10 text-white" />
              </div>
              <div>
                <p className="text-4xl font-black text-white">10,000+</p>
                <p className="text-white/90 font-semibold">Practice Questions</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              <div>
                <p className="text-4xl font-black text-white">7 Classes</p>
                <p className="text-white/90 font-semibold">6th to 12th</p>
              </div>
            </div>
          </div>
        </div>

        {/* Motivational Banner */}
        <div className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 rounded-3xl p-8 mb-12 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 text-center">
            <h2 className="text-4xl font-black text-white mb-3">
              🚀 Ready to Excel in Your Exams?
            </h2>
            <p className="text-xl text-white/90 font-semibold max-w-2xl mx-auto">
              Practice chapter-wise tests and track your progress across all subjects!
            </p>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-4 right-8 text-6xl opacity-20">🎯</div>
          <div className="absolute bottom-4 left-8 text-6xl opacity-20">📚</div>
        </div>

        {/* Class Selection Grid */}
        <div className="mb-8">
          <h2 className="text-4xl font-black text-gray-900 mb-3 text-center">
            Select Your Class
          </h2>
          <p className="text-center text-gray-600 text-lg mb-8">
            Choose your class to start practicing 👇
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {classes.map((item) => (
            <button
              key={item.class}
              onClick={() => {
                // Classes 11 and 12 go to stream selection
                if (item.class === 11 || item.class === 12) {
                  navigate(`/chapter-tests/class-${item.class}/select-stream`);
                } else {
                  navigate(`/chapter-tests/class-${item.class}`);
                }
              }}
              className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-gray-100 hover:border-transparent overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              <div className="relative z-10">
                <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className="text-3xl font-black text-gray-900 group-hover:text-white transition-colors duration-300">
                  Class {item.class}
                </h3>
                <p className="text-gray-600 group-hover:text-white/90 transition-colors duration-300 mt-2">
                  CBSE Curriculum
                </p>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color}"></div>
            </button>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Why Choose Chapter Tests?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Focused Practice</h4>
              <p className="text-gray-600 text-sm">Chapter-wise tests for targeted learning</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📊</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Track Progress</h4>
              <p className="text-gray-600 text-sm">Monitor your performance over time</p>
            </div>
            <div className="text-center">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💡</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">NCERT Aligned</h4>
              <p className="text-gray-600 text-sm">Based on latest NCERT curriculum</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚡</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Instant Results</h4>
              <p className="text-gray-600 text-sm">Get immediate feedback and scores</p>
            </div>
          </div>
        </div>

        {/* Why Ceibaa is Best for India Section */}
        <div className="mt-16 relative">
          <div className="bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-12">
                <div className="inline-block bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full mb-4">
                  <span className="text-white font-bold text-sm">🇮🇳 MADE FOR INDIA</span>
                </div>
                <h2 className="text-5xl font-black text-white mb-4">
                  Why Ceibaa is Perfect for Indian Students
                </h2>
                <p className="text-xl text-white/90 max-w-3xl mx-auto font-semibold">
                  India's first gamified learning platform designed specifically for CBSE curriculum
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Feature 1 */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all transform hover:scale-105">
                  <div className="bg-white rounded-xl w-14 h-14 flex items-center justify-center mb-4">
                    <span className="text-3xl">🎮</span>
                  </div>
                  <h4 className="text-xl font-black text-white mb-3">Fun Learning Experience</h4>
                  <p className="text-white/90">Turn boring studies into exciting games. Battle with friends and compete on leaderboards!</p>
                </div>

                {/* Feature 2 */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all transform hover:scale-105">
                  <div className="bg-white rounded-xl w-14 h-14 flex items-center justify-center mb-4">
                    <span className="text-3xl">📚</span>
                  </div>
                  <h4 className="text-xl font-black text-white mb-3">100% NCERT Aligned</h4>
                  <p className="text-white/90">Every question mapped to NCERT chapters. Perfect for CBSE board exam preparation.</p>
                </div>

                {/* Feature 3 */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all transform hover:scale-105">
                  <div className="bg-white rounded-xl w-14 h-14 flex items-center justify-center mb-4">
                    <span className="text-3xl">🏆</span>
                  </div>
                  <h4 className="text-xl font-black text-white mb-3">Compete & Win</h4>
                  <p className="text-white/90">Live battles with students across India. Earn badges, rewards, and climb the rankings!</p>
                </div>

                {/* Feature 4 */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all transform hover:scale-105">
                  <div className="bg-white rounded-xl w-14 h-14 flex items-center justify-center mb-4">
                    <span className="text-3xl">💰</span>
                  </div>
                  <h4 className="text-xl font-black text-white mb-3">100% Free Forever</h4>
                  <p className="text-white/90">No hidden charges, no subscriptions. Quality education accessible to every Indian student.</p>
                </div>

                {/* Feature 5 */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all transform hover:scale-105">
                  <div className="bg-white rounded-xl w-14 h-14 flex items-center justify-center mb-4">
                    <span className="text-3xl">🌐</span>
                  </div>
                  <h4 className="text-xl font-black text-white mb-3">Study Anywhere</h4>
                  <p className="text-white/90">Works on mobile, tablet, or computer. Learn from home, school, or anywhere in India!</p>
                </div>

                {/* Feature 6 */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all transform hover:scale-105">
                  <div className="bg-white rounded-xl w-14 h-14 flex items-center justify-center mb-4">
                    <span className="text-3xl">⚡</span>
                  </div>
                  <h4 className="text-xl font-black text-white mb-3">Instant Feedback</h4>
                  <p className="text-white/90">Get results immediately with detailed explanations. Learn from mistakes and improve faster!</p>
                </div>
              </div>

              {/* CTA Section */}
              <div className="mt-12 text-center">
                <div className="bg-white rounded-2xl p-8 inline-block shadow-2xl">
                  <h3 className="text-3xl font-black text-gray-900 mb-3">
                    Join 50,000+ Students Across India! 🚀
                  </h3>
                  <p className="text-gray-600 mb-6 text-lg">
                    Start your journey to exam success with India's most engaging learning platform
                  </p>
                  <button 
                    onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
                    className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-8 py-4 rounded-xl font-black text-lg hover:scale-105 transform transition-all shadow-lg"
                  >
                    Start Learning Now - It's Free! 🎉
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ChapterTestHome;