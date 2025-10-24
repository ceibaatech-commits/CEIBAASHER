import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Trophy, Users } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  const exams = [
    {
      name: 'NEET',
      description: 'National Eligibility cum Entrance Test',
      subjects: ['Physics', 'Chemistry', 'Biology'],
      color: 'from-blue-500 to-cyan-500',
      icon: '🏥'
    },
    {
      name: 'JEE',
      description: 'Joint Entrance Examination',
      subjects: ['Physics', 'Chemistry', 'Maths'],
      color: 'from-purple-500 to-pink-500',
      icon: '🎓'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-xl">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Ceibaa Quiz Arena
                </h1>
                <p className="text-gray-600 text-sm">Master your competitive exams</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Exam
          </h2>
          <p className="text-xl text-gray-600">
            Practice solo or battle with competitors in real-time
          </p>
        </div>

        {/* Exam Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {exams.map((exam) => (
            <div
              key={exam.name}
              className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300 cursor-pointer"
              onClick={() => navigate(`/exam/${exam.name}`)}
            >
              <div className={`bg-gradient-to-r ${exam.color} p-8 text-white`}>
                <div className="text-6xl mb-4">{exam.icon}</div>
                <h3 className="text-3xl font-bold mb-2">{exam.name}</h3>
                <p className="text-white/90">{exam.description}</p>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Subjects:</h4>
                  <div className="flex flex-wrap gap-2">
                    {exam.subjects.map((subject) => (
                      <span
                        key={subject}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <BookOpen className="w-4 h-4" />
                    <span>Solo Practice</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>Battle Mode</span>
                  </div>
                </div>

                <button className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
                  Start Learning →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Practice Mode</h3>
            <p className="text-gray-600">
              Get 10 random questions from thousands in our database
            </p>
          </div>

          <div className="text-center p-6">
            <div className="bg-purple-100 text-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Battle Mode</h3>
            <p className="text-gray-600">
              Compete with strangers in real-time quiz battles
            </p>
          </div>

          <div className="text-center p-6">
            <div className="bg-pink-100 text-pink-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Live Video</h3>
            <p className="text-gray-600">
              Face your opponent with live video and audio during battles
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;