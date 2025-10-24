import React, { useState } from 'react';
import { Trophy, Medal, Crown, TrendingUp, Flame, Star, Filter } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Leaderboard = () => {
  const [timeFilter, setTimeFilter] = useState('all');
  const [examFilter, setExamFilter] = useState('all');

  // Mock leaderboard data
  const leaders = [
    { rank: 1, name: 'Raj Kumar', avatar: 'RK', rating: 2450, wins: 245, streak: 15, exam: 'NEET', badge: 'Legend' },
    { rank: 2, name: 'Priya Singh', avatar: 'PS', rating: 2380, wins: 230, streak: 12, exam: 'JEE', badge: 'Master' },
    { rank: 3, name: 'Amit Patel', avatar: 'AP', rating: 2310, wins: 218, streak: 10, exam: 'UPSC', badge: 'Master' },
    { rank: 4, name: 'Sneha Reddy', avatar: 'SR', rating: 2245, wins: 205, streak: 8, exam: 'NEET', badge: 'Expert' },
    { rank: 5, name: 'Vikram Shah', avatar: 'VS', rating: 2180, wins: 198, streak: 7, exam: 'Banking', badge: 'Expert' },
    { rank: 6, name: 'Ananya Gupta', avatar: 'AG', rating: 2120, wins: 189, streak: 9, exam: 'SSC', badge: 'Expert' },
    { rank: 7, name: 'Rohan Verma', avatar: 'RV', rating: 2065, wins: 176, streak: 6, exam: 'JEE', badge: 'Pro' },
    { rank: 8, name: 'Kavya Iyer', avatar: 'KI', rating: 2010, wins: 164, streak: 5, exam: 'NEET', badge: 'Pro' },
    { rank: 9, name: 'Arjun Nair', avatar: 'AN', rating: 1955, wins: 152, streak: 4, exam: 'Defence', badge: 'Pro' },
    { rank: 10, name: 'Divya Sharma', avatar: 'DS', rating: 1900, wins: 145, streak: 6, exam: 'UPSC', badge: 'Advanced' },
  ];

  const getBadgeColor = (badge) => {
    switch (badge) {
      case 'Legend': return 'from-yellow-400 to-orange-500';
      case 'Master': return 'from-purple-500 to-pink-500';
      case 'Expert': return 'from-blue-500 to-cyan-500';
      case 'Pro': return 'from-green-500 to-emerald-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Trophy className="w-12 h-12 text-yellow-500" />
            <h1 className="text-5xl font-black bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Global Leaderboard
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Compete with the best quiz warriors across India</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-900">Filters:</span>
            </div>
            
            {/* Time Filter */}
            <div className="flex space-x-2">
              {['all', 'today', 'week', 'month'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    timeFilter === filter
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            {/* Exam Filter */}
            <select
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
            >
              <option value="all">All Exams</option>
              <option value="NEET">NEET</option>
              <option value="JEE">JEE</option>
              <option value="UPSC">UPSC</option>
              <option value="SSC">SSC</option>
              <option value="Banking">Banking</option>
            </select>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          <div className="order-1 lg:order-1">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all mt-8">
              <div className="relative mb-4">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-3xl font-black text-white border-4 border-gray-400">
                  {leaders[1].avatar}
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                  <Medal className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{leaders[1].name}</h3>
              <p className="text-sm text-gray-600 mb-2">{leaders[1].exam}</p>
              <div className="bg-gray-100 rounded-lg py-2">
                <p className="text-2xl font-black text-gray-700">{leaders[1].rating}</p>
                <p className="text-xs text-gray-500">Rating</p>
              </div>
            </div>
          </div>

          {/* 1st Place */}
          <div className="order-2 lg:order-2">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-2xl p-6 text-center transform hover:scale-105 transition-all relative">
              <Crown className="w-12 h-12 text-white mx-auto mb-2 animate-bounce" />
              <div className="relative mb-4">
                <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center text-4xl font-black text-white border-4 border-white">
                  {leaders[0].avatar}
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white text-yellow-600 px-3 py-1 rounded-full text-xs font-bold">
                  #1 Champion
                </div>
              </div>
              <h3 className="text-2xl font-black text-white mb-1">{leaders[0].name}</h3>
              <p className="text-sm text-white/90 mb-2">{leaders[0].exam}</p>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg py-2">
                <p className="text-3xl font-black text-white">{leaders[0].rating}</p>
                <p className="text-xs text-white/80">Rating</p>
              </div>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="order-3 lg:order-3">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all mt-8">
              <div className="relative mb-4">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-orange-300 to-orange-400 flex items-center justify-center text-3xl font-black text-white border-4 border-orange-400">
                  {leaders[2].avatar}
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Medal className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{leaders[2].name}</h3>
              <p className="text-sm text-gray-600 mb-2">{leaders[2].exam}</p>
              <div className="bg-gray-100 rounded-lg py-2">
                <p className="text-2xl font-black text-orange-600">{leaders[2].rating}</p>
                <p className="text-xs text-gray-500">Rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* Full Leaderboard */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
            <h2 className="text-2xl font-bold text-white">Full Rankings</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {leaders.map((leader) => (
              <div
                key={leader.rank}
                className="p-4 hover:bg-gray-50 transition-colors flex items-center space-x-4"
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-12 text-center">
                  <span className="text-2xl font-black text-gray-400">#{leader.rank}</span>
                </div>

                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl font-black text-white">
                    {leader.avatar}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{leader.name}</h3>
                    <span className={`px-2 py-1 text-xs font-bold text-white rounded-full bg-gradient-to-r ${getBadgeColor(leader.badge)}`}>
                      {leader.badge}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{leader.exam}</p>
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <p className="font-black text-purple-600 text-xl">{leader.rating}</p>
                    <p className="text-gray-500 text-xs">Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-green-600">{leader.wins}</p>
                    <p className="text-gray-500 text-xs">Wins</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center space-x-1">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="font-bold text-orange-600">{leader.streak}</span>
                    </div>
                    <p className="text-gray-500 text-xs">Streak</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Leaderboard;
