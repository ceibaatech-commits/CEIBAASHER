import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Award, Users, MessageCircle, HelpCircle, Youtube, Building2, 
  TrendingUp, CheckCircle, ArrowRight, Star, Sparkles, 
  BookOpen, Trophy, Coins, HeadphonesIcon, ChevronRight
} from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

const TeacherEarnings = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const isLoggedIn = typeof isAuthenticated === 'function' ? isAuthenticated() : !!user;

  const earningsTiers = [
    { followers: '100 - 249', perPost: '₹5', maxPosts: 15, maxDaily: '₹75', color: 'from-blue-500 to-blue-600', badge: 'Milestone' },
    { followers: '250 - 499', perPost: '₹10', maxPosts: 15, maxDaily: '₹150', color: 'from-green-500 to-emerald-600', badge: 'Rising' },
    { followers: '500+', perPost: '₹25', maxPosts: 15, maxDaily: '₹375', color: 'from-purple-500 to-violet-600', badge: 'Popular' },
    { followers: '1000+', perPost: '₹75', maxPosts: 15, maxDaily: '₹1,125', color: 'from-orange-500 to-amber-600', badge: 'Influencer' },
    { followers: '5000+', perPost: '₹500', maxPosts: 10, maxDaily: '₹5,000', color: 'from-pink-500 to-rose-600', badge: 'Star Creator' },
  ];

  const steps = [
    {
      icon: MessageCircle,
      title: 'Ask Academic Questions',
      description: 'Post educational questions that help students learn. Share your expertise and engage the community.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: HelpCircle,
      title: 'Answer & Help Students',
      description: 'Provide detailed answers to student queries. Your knowledge helps thousands of learners.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Trophy,
      title: 'Create Quiz Rooms',
      description: 'Host interactive quiz battles and engage students in real-time learning competitions.',
      color: 'from-purple-500 to-violet-500'
    },
    {
      icon: Building2,
      title: 'Promote Your Institute',
      description: 'Showcase your coaching center or educational institute to thousands of active learners.',
      color: 'from-orange-500 to-amber-500'
    },
    {
      icon: Youtube,
      title: 'Grow Your YouTube Channel',
      description: 'Share your educational content and grow your YouTube subscriber base organically.',
      color: 'from-red-500 to-rose-500'
    },
  ];

  const benefits = [
    { icon: Coins, text: 'Daily Payouts to your account' },
    { icon: TrendingUp, text: 'Boost Your Earnings with more followers' },
    { icon: Users, text: 'Grow Your Audience organically' },
    { icon: Star, text: 'Share Quality Content & get recognized' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header 
        isLoggedIn={isLoggedIn}
        user={user}
        onLogout={() => {}}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.05\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="text-white font-semibold text-sm">For Teachers & Educators</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
              Earn While You <span className="text-yellow-300">Teach</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Join the Ceibaa Creator Rewards Program and earn up to <span className="font-bold text-yellow-300">₹5,000/day</span> by sharing your knowledge on Victory Lane
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/victory-lane')}
                className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <Trophy className="w-5 h-5" />
                Start Posting Now
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/50 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/30 transition-all flex items-center justify-center gap-2"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Ceibaa Logo Banner */}
      <section className="bg-white py-8 border-b">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <img 
            src="/ceibaa-logo.png" 
            alt="Ceibaa" 
            className="h-12 md:h-16 mx-auto mb-2"
          />
          <p className="text-gray-600 text-sm md:text-base">Mind Vs Mind</p>
        </div>
      </section>

      {/* Creator Rewards Program Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full px-4 py-2 mb-4">
              <Award className="w-5 h-5 text-purple-600" />
              <span className="text-purple-700 font-semibold text-sm">Rewards Program</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-gray-900 mb-3">
              CEIBAA <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">CREATOR REWARDS</span> PROGRAM
            </h2>
            <p className="text-gray-600 text-lg">
              EARN FOR YOUR ENGAGEMENT!
            </p>
            <p className="text-gray-500">
              Based on your <span className="font-bold text-purple-600">*Follower*</span> Count
            </p>
          </div>

          {/* Earnings Table - Desktop */}
          <div className="hidden md:block bg-gradient-to-br from-slate-50 to-purple-50 rounded-2xl p-6 shadow-xl border border-purple-100 mb-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-purple-200">
                    <th className="py-4 px-4 text-left text-gray-700 font-bold">Follower Tier</th>
                    <th className="py-4 px-4 text-center text-gray-700 font-bold">Earnings Per Post</th>
                    <th className="py-4 px-4 text-center text-gray-700 font-bold">Max Posts Allowed</th>
                    <th className="py-4 px-4 text-center text-gray-700 font-bold">Max Earning Potential (Daily)</th>
                  </tr>
                </thead>
                <tbody>
                  {earningsTiers.map((tier, index) => (
                    <tr key={index} className="border-b border-purple-100 hover:bg-purple-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${tier.color} flex items-center justify-center`}>
                            <Star className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{tier.followers} {tier.badge === 'Milestone' ? 'Milestone' : 'Followers'}</p>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r ${tier.color} text-white`}>
                              {tier.badge}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-2xl font-black text-gray-900">{tier.perPost}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-lg font-bold text-gray-700">{tier.maxPosts}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                          {tier.maxDaily}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Earnings Cards - Mobile */}
          <div className="md:hidden space-y-4 mb-8">
            {earningsTiers.map((tier, index) => (
              <div key={index} className={`bg-gradient-to-r ${tier.color} rounded-2xl p-4 text-white shadow-lg`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-bold">{tier.badge}</span>
                    <p className="font-bold text-lg mt-2">{tier.followers} {tier.badge === 'Milestone' ? '' : 'Followers'}</p>
                  </div>
                  <Star className="w-8 h-8 text-white/80" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/20 rounded-xl p-2">
                    <p className="text-xs opacity-80">Per Post</p>
                    <p className="font-black text-lg">{tier.perPost}</p>
                  </div>
                  <div className="bg-white/20 rounded-xl p-2">
                    <p className="text-xs opacity-80">Max Posts</p>
                    <p className="font-black text-lg">{tier.maxPosts}</p>
                  </div>
                  <div className="bg-white/20 rounded-xl p-2">
                    <p className="text-xs opacity-80">Max/Day</p>
                    <p className="font-black text-lg">{tier.maxDaily}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Key Benefits */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              KEY BENEFITS
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 bg-white rounded-xl p-3 shadow-sm">
                  <benefit.icon className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How to Earn Section */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-4xl font-black text-white mb-3">
              How to <span className="text-yellow-400">Earn</span> on Victory Lane
            </h2>
            <p className="text-white/70 text-lg">Follow these simple steps to start earning today</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all hover:scale-105"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-white/70">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Under The Canopy Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🌳</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black">Under The Canopy</h2>
              </div>
              
              <p className="text-lg md:text-xl text-white/90 mb-6 max-w-2xl">
                Join our exclusive community of educators and content creators. Grow together, learn together, and earn together under the Ceibaa Canopy!
              </p>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <BookOpen className="w-8 h-8 mb-2" />
                  <h4 className="font-bold mb-1">Share Knowledge</h4>
                  <p className="text-sm text-white/80">Help students with academic doubts</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <Users className="w-8 h-8 mb-2" />
                  <h4 className="font-bold mb-1">Build Community</h4>
                  <p className="text-sm text-white/80">Connect with fellow educators</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <TrendingUp className="w-8 h-8 mb-2" />
                  <h4 className="font-bold mb-1">Grow Influence</h4>
                  <p className="text-sm text-white/80">Expand your reach and earnings</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/victory-lane')}
                className="bg-white text-green-600 px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all inline-flex items-center gap-2"
              >
                Join Victory Lane
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-12 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-black text-white mb-2">
            POST ON CEIBAA VICTORY LANE
          </h2>
          <p className="text-white/90 text-lg mb-6">
            Ceibaa - Where Every Post Pays
          </p>
          <p className="text-white/70 text-sm mb-8">
            *Terms & Conditions Apply. Maximum 15 posts per cycle (except 5000+ tier: 10 posts/cycle).*
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/victory-lane')}
              className="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
            >
              🚀 Start Earning Now
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/50 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/30 transition-all flex items-center justify-center gap-2"
            >
              <HeadphonesIcon className="w-5 h-5" />
              Get Support
            </button>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-12 md:py-16 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-8 border border-slate-600">
            <HeadphonesIcon className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Need Help?</h2>
            <p className="text-gray-400 mb-6">
              Our support team is here to help you with any questions about the Creator Rewards Program
            </p>
            <button
              onClick={() => navigate('/contact')}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all inline-flex items-center gap-2"
            >
              <HeadphonesIcon className="w-5 h-5" />
              Contact Support
            </button>
          </div>
        </div>
      </section>

      {/* Footer Note */}
      <section className="py-6 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 Ceibaa. All rights reserved. | <button onClick={() => navigate('/terms')} className="hover:text-white">Terms</button> | <button onClick={() => navigate('/privacy')} className="hover:text-white">Privacy</button>
          </p>
        </div>
      </section>
    </div>
  );
};

export default TeacherEarnings;
