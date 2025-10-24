import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, FileText, Users, TrendingUp, DollarSign, 
  Plus, Eye, Edit, Trash2, BarChart3, Award 
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const CreatorDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data
  const stats = {
    totalQuizzes: 24,
    totalPlayers: 1234,
    totalRevenue: 45678,
    avgRating: 4.7
  };

  const quizzes = [
    { id: 1, title: 'NEET Physics - Mechanics', plays: 456, rating: 4.8, revenue: 2300, status: 'active' },
    { id: 2, title: 'JEE Chemistry - Organic', plays: 389, rating: 4.6, revenue: 1950, status: 'active' },
    { id: 3, title: 'UPSC History - Modern India', plays: 523, rating: 4.9, revenue: 2615, status: 'active' },
  ];

  return (
    <div className=\"min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100\">
      <Header />
      
      <main className=\"flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8\">
        {/* Page Header */}
        <div className=\"mb-8\">
          <h1 className=\"text-4xl font-black text-gray-900 mb-2\">Creator Dashboard</h1>
          <p className=\"text-gray-600\">Manage your quizzes, track performance, and earn revenue</p>
        </div>

        {/* Stats Cards */}
        <div className=\"grid grid-cols-1 md:grid-cols-4 gap-6 mb-8\">
          <div className=\"bg-white rounded-xl shadow-md p-6\">
            <div className=\"flex items-center justify-between mb-4\">
              <FileText className=\"w-10 h-10 text-blue-600\" />
              <div className=\"text-right\">
                <p className=\"text-3xl font-black text-gray-900\">{stats.totalQuizzes}</p>
                <p className=\"text-sm text-gray-600\">Total Quizzes</p>
              </div>
            </div>
            <div className=\"w-full bg-blue-100 h-2 rounded-full\">
              <div className=\"bg-blue-600 h-2 rounded-full\" style={{ width: '75%' }}></div>
            </div>
          </div>

          <div className=\"bg-white rounded-xl shadow-md p-6\">
            <div className=\"flex items-center justify-between mb-4\">
              <Users className=\"w-10 h-10 text-purple-600\" />
              <div className=\"text-right\">
                <p className=\"text-3xl font-black text-gray-900\">{stats.totalPlayers.toLocaleString()}</p>
                <p className=\"text-sm text-gray-600\">Total Players</p>
              </div>
            </div>
            <div className=\"w-full bg-purple-100 h-2 rounded-full\">
              <div className=\"bg-purple-600 h-2 rounded-full\" style={{ width: '85%' }}></div>
            </div>
          </div>

          <div className=\"bg-white rounded-xl shadow-md p-6\">
            <div className=\"flex items-center justify-between mb-4\">
              <DollarSign className=\"w-10 h-10 text-green-600\" />
              <div className=\"text-right\">
                <p className=\"text-3xl font-black text-gray-900\">₹{stats.totalRevenue.toLocaleString()}</p>
                <p className=\"text-sm text-gray-600\">Total Revenue</p>
              </div>
            </div>
            <div className=\"w-full bg-green-100 h-2 rounded-full\">
              <div className=\"bg-green-600 h-2 rounded-full\" style={{ width: '60%' }}></div>
            </div>
          </div>

          <div className=\"bg-white rounded-xl shadow-md p-6\">
            <div className=\"flex items-center justify-between mb-4\">
              <Award className=\"w-10 h-10 text-yellow-600\" />
              <div className=\"text-right\">
                <p className=\"text-3xl font-black text-gray-900\">{stats.avgRating}</p>
                <p className=\"text-sm text-gray-600\">Avg Rating</p>
              </div>
            </div>
            <div className=\"w-full bg-yellow-100 h-2 rounded-full\">
              <div className=\"bg-yellow-600 h-2 rounded-full\" style={{ width: '94%' }}></div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className=\"bg-white rounded-t-xl shadow-md\">
          <div className=\"flex border-b border-gray-200\">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 font-semibold transition-colors ${
                activeTab === 'overview'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`px-6 py-4 font-semibold transition-colors ${
                activeTab === 'quizzes'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Quizzes
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-4 font-semibold transition-colors ${
                activeTab === 'analytics'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>

        {/* Content */}
        <div className=\"bg-white rounded-b-xl shadow-md p-6\">
          {activeTab === 'quizzes' && (
            <div>
              <div className=\"flex justify-between items-center mb-6\">
                <h2 className=\"text-2xl font-bold text-gray-900\">My Quizzes</h2>
                <button className=\"bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center space-x-2\">
                  <Plus className=\"w-5 h-5\" />
                  <span>Create New Quiz</span>
                </button>
              </div>

              <div className=\"space-y-4\">
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className=\"border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow\">
                    <div className=\"flex items-center justify-between\">
                      <div className=\"flex-1\">
                        <h3 className=\"text-lg font-bold text-gray-900 mb-1\">{quiz.title}</h3>
                        <div className=\"flex items-center space-x-6 text-sm text-gray-600\">
                          <div className=\"flex items-center space-x-1\">
                            <Users className=\"w-4 h-4\" />
                            <span>{quiz.plays} plays</span>
                          </div>
                          <div className=\"flex items-center space-x-1\">
                            <Award className=\"w-4 h-4 text-yellow-500\" />
                            <span>{quiz.rating} rating</span>
                          </div>
                          <div className=\"flex items-center space-x-1\">
                            <DollarSign className=\"w-4 h-4 text-green-500\" />
                            <span>₹{quiz.revenue}</span>
                          </div>
                          <span className=\"px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold\">
                            {quiz.status}
                          </span>
                        </div>
                      </div>
                      <div className=\"flex items-center space-x-2\">
                        <button className=\"p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors\">
                          <Eye className=\"w-5 h-5\" />
                        </button>
                        <button className=\"p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors\">
                          <Edit className=\"w-5 h-5\" />
                        </button>
                        <button className=\"p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors\">
                          <Trash2 className=\"w-5 h-5\" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2 className=\"text-2xl font-bold text-gray-900 mb-6\">Performance Analytics</h2>
              <div className=\"bg-gray-100 rounded-lg p-12 text-center\">
                <BarChart3 className=\"w-16 h-16 text-gray-400 mx-auto mb-4\" />
                <p className=\"text-gray-600\">Analytics charts coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CreatorDashboard;
