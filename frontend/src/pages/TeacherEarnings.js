import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Award, Users, MessageCircle, HelpCircle, Youtube, Building2, 
  TrendingUp, CheckCircle, ArrowRight, Star, Sparkles, 
  BookOpen, Trophy, Coins, HeadphonesIcon, ChevronRight
} from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

// Reusable Tier Card Component
const TierCard = ({ tier, index }) => (
  <div 
    className={`bg-gradient-to-r ${tier.color} rounded-2xl p-3 text-white shadow-lg transform hover:scale-[1.02] transition-all duration-300`}
    style={{ animationDelay: `${index * 100}ms` }}
  >
    <div className="flex justify-between items-start mb-2">
      <div>
        <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-bold">
          {tier.badge}
        </span>
        <p className="font-bold text-lg mt-1">
          {tier.followers} {tier.badge === 'Milestone' ? '' : 'Followers'}
        </p>
      </div>
      <Star className="w-7 h-7 text-white/80" />
    </div>
    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="bg-white/20 rounded-xl p-2">
        <p className="text-xs opacity-80">Per Post</p>
        <p className="font-black text-base">{tier.perPost}</p>
      </div>
      <div className="bg-white/20 rounded-xl p-2">
        <p className="text-xs opacity-80">Max Posts</p>
        <p className="font-black text-base">{tier.maxPosts}</p>
      </div>
      <div className="bg-white/20 rounded-xl p-2">
        <p className="text-xs opacity-80">Max/Day</p>
        <p className="font-black text-base">{tier.maxDaily}</p>
      </div>
    </div>
  </div>
);

// Step Card Component
const StepCard = ({ step, index }) => (
  <div 
    className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-xl"
  >
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${step.color} flex items-center justify-center mb-3 shadow-lg`}>
      <step.icon className="w-6 h-6 text-white" />
    </div>
    <div className="flex items-center gap-2 mb-1">
      <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
        Step {index + 1}
      </span>
    </div>
    <h3 className="text-lg font-bold text-white mb-1">{step.title}</h3>
    <p className="text-white/70 text-sm">{step.description}</p>
  </div>
);

// Benefit Card Component
const BenefitCard = ({ benefit }) => (
  <div className="flex items-center gap-2 bg-white rounded-xl p-2.5 shadow-sm hover:shadow-md transition-shadow duration-300">
    <benefit.icon className="w-4 h-4 text-teal-600 flex-shrink-0" />
    <span className="text-sm font-medium text-gray-700">{benefit.text}</span>
  </div>
);

const TeacherEarnings = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const isLoggedIn = typeof isAuthenticated === 'function' ? isAuthenticated() : !!user;

  // Memoized static data
  const earningsTiers = useMemo(() => [
    { 
      followers: '100 - 249', 
      perPost: '₹5', 
      maxPosts: 15, 
      maxDaily: '₹75', 
      color: 'from-blue-500 to-blue-600', 
      badge: 'Milestone' 
    },
    { 
      followers: '250 - 499', 
      perPost: '₹10', 
      maxPosts: 15, 
      maxDaily: '₹150', 
      color: 'from-teal-500 to-teal-600', 
      badge: 'Rising' 
    },
    { 
      followers: '500+', 
      perPost: '₹25', 
      maxPosts: 15, 
      maxDaily: '₹375', 
      color: 'from-emerald-500 to-green-600', 
      badge: 'Popular' 
    },
    { 
      followers: '1000+', 
      perPost: '₹75', 
      maxPosts: 15, 
      maxDaily: '₹1,125', 
      color: 'from-orange-500 to-amber-600', 
      badge: 'Influencer' 
    },
    { 
      followers: '5000+', 
      perPost: '₹500', 
      maxPosts: 10, 
      maxDaily: '₹5,000', 
      color: 'from-rose-500 to-red-600', 
      badge: 'Star Creator' 
    },
  ], []);

  const steps = useMemo(() => [
    {
      icon: MessageCircle,
      title: 'Ask Academic Questions',
      description: 'Post educational questions that help students learn and engage the community.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: HelpCircle,
      title: 'Answer & Help Students',
      description: 'Provide detailed answers to student queries. Help thousands of learners.',
      color: 'from-teal-500 to-emerald-500'
    },
    {
      icon: Trophy,
      title: 'Create Quiz Rooms',
      description: 'Host interactive quiz battles and engage students in real-time competitions.',
      color: 'from-cyan-500 to-blue-500'
    },
    {
      icon: Building2,
      title: 'Promote Your Institute',
      description: 'Showcase your coaching center to thousands of active learners.',
      color: 'from-orange-500 to-amber-500'
    },
    {
      icon: Youtube,
      title: 'Grow Your YouTube Channel',
      description: 'Share educational content and grow your subscriber base organically.',
      color: 'from-red-500 to-rose-500'
    },
  ], []);

  const benefits = useMemo(() => [
    { icon: Coins, text: 'Monthly Payouts to your account' },
    { icon: TrendingUp, text: 'Boost Earnings with more followers' },
    { icon: Users, text: 'Grow Your Audience organically' },
    { icon: Star, text: 'Share Quality Content' },
  ], []);

  const handleLogout = () => {
    if (logout) {
      logout();
    }
    navigate('/');
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      <Header 
        isLoggedIn={isLoggedIn}
        user={user}
        onLogout={handleLogout}
      />

      {/* Hero Section - Reduced padding */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-blue-700 to-teal-600"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 border-4 border-white rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-16 h-16 border-4 border-white rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 border-4 border-white rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 right-1/3 w-24 h-24 border-4 border-white rounded-full animate-pulse"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-8 md:py-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-white font-semibold text-sm">For Teachers & Educators</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-3 leading-tight">
              Earn While You <span className="text-yellow-300">Teach</span>
            </h1>
            <p className="text-base md:text-lg text-white/90 max-w-2xl mx-auto mb-6">
              Join the Ceibaa Creator Rewards Program and earn up to{' '}
              <span className="font-bold text-yellow-300">₹5,000/day</span> by sharing your knowledge
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/victory-lane')}
                aria-label="Start posting on Victory Lane"
                className="bg-white text-teal-600 px-6 py-3 rounded-xl font-bold text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Trophy className="w-5 h-5" />
                Start Posting Now
              </button>
              <button
                onClick={() => navigate('/signup')}
                aria-label="Create a free account"
                className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/50 px-6 py-3 rounded-xl font-bold text-base hover:bg-white/30 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Ceibaa Logo Banner - Reduced padding */}
      <section className="bg-white py-4 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <img 
            src="/ceibaa-logo.png" 
            alt="Ceibaa" 
            className="h-10 md:h-12 mx-auto mb-1"
            onError={handleImageError}
          />
          <p className="text-gray-600 text-sm font-medium">Mind Vs Mind</p>
        </div>
      </section>

      {/* Creator Rewards Program Section - Reduced padding */}
      <section className="py-6 md:py-10 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-100 to-blue-100 rounded-full px-3 py-1.5 mb-3">
              <Award className="w-4 h-4 text-teal-600" />
              <span className="text-teal-700 font-semibold text-sm">Rewards Program</span>
            </div>
            <h2 className="text-xl md:text-3xl font-black text-gray-900 mb-2">
              CEIBAA{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">
                CREATOR REWARDS
              </span>{' '}
              PROGRAM
            </h2>
            <p className="text-gray-600 text-base">EARN FOR YOUR ENGAGEMENT!</p>
            <p className="text-gray-500 text-sm">
              Based on your <span className="font-bold text-teal-600">*Follower*</span> Count
            </p>
          </div>

          {/* Earnings Table - Desktop */}
          <div className="hidden md:block bg-gradient-to-br from-slate-50 to-teal-50 rounded-2xl p-4 shadow-xl border border-teal-100 mb-5">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-teal-200">
                    <th className="py-3 px-4 text-left text-gray-700 font-bold text-sm">Follower Tier</th>
                    <th className="py-3 px-4 text-center text-gray-700 font-bold text-sm">Earnings Per Post</th>
                    <th className="py-3 px-4 text-center text-gray-700 font-bold text-sm">Max Posts Allowed</th>
                    <th className="py-3 px-4 text-center text-gray-700 font-bold text-sm">Max Earning (Daily)</th>
                  </tr>
                </thead>
                <tbody>
                  {earningsTiers.map((tier, index) => (
                    <tr 
                      key={index} 
                      className="border-b border-teal-100 hover:bg-teal-50/50 transition-colors duration-200"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${tier.color} flex items-center justify-center shadow-md`}>
                            <Star className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">
                              {tier.followers} {tier.badge === 'Milestone' ? 'Milestone' : 'Followers'}
                            </p>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r ${tier.color} text-white`}>
                              {tier.badge}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xl font-black text-gray-900">{tier.perPost}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-base font-bold text-gray-700">{tier.maxPosts}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
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
          <div className="md:hidden space-y-3 mb-5">
            {earningsTiers.map((tier, index) => (
              <TierCard key={index} tier={tier} index={index} />
            ))}
          </div>

          {/* Key Benefits */}
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-4 border border-teal-100">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              KEY BENEFITS
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {benefits.map((benefit, index) => (
                <BenefitCard key={index} benefit={benefit} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How to Earn Section - Reduced padding */}
      <section className="py-6 md:py-10 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-3xl font-black text-white mb-2">
              How to <span className="text-teal-400">Earn</span> on Victory Lane
            </h2>
            <p className="text-white/70 text-base">Follow these simple steps to start earning today</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {steps.map((step, index) => (
              <StepCard key={index} step={step} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Under The Canopy Section - Reduced padding */}
      <section className="py-6 md:py-10 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24"></div>
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/10 rounded-full -ml-18 -mb-18"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-xl">🌳</span>
                </div>
                <h2 className="text-xl md:text-2xl font-black">Under The Canopy</h2>
              </div>
              
              <p className="text-base md:text-lg text-white/90 mb-4 max-w-2xl">
                Join our exclusive community of educators and content creators. Grow together, learn together!
              </p>

              <div className="grid md:grid-cols-3 gap-3 mb-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 hover:bg-white/25 transition-all duration-300">
                  <BookOpen className="w-6 h-6 mb-1" />
                  <h4 className="font-bold text-sm mb-0.5">Share Knowledge</h4>
                  <p className="text-xs text-white/80">Help students with academic doubts</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 hover:bg-white/25 transition-all duration-300">
                  <Users className="w-6 h-6 mb-1" />
                  <h4 className="font-bold text-sm mb-0.5">Build Community</h4>
                  <p className="text-xs text-white/80">Connect with fellow educators</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 hover:bg-white/25 transition-all duration-300">
                  <TrendingUp className="w-6 h-6 mb-1" />
                  <h4 className="font-bold text-sm mb-0.5">Grow Influence</h4>
                  <p className="text-xs text-white/80">Expand your reach and earnings</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/victory-lane')}
                aria-label="Join Victory Lane community"
                className="bg-white text-emerald-600 px-6 py-3 rounded-xl font-bold text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 inline-flex items-center gap-2"
              >
                Join Victory Lane
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner - Reduced padding */}
      <section className="py-6 md:py-8 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-xl md:text-3xl font-black text-white mb-1">
            POST ON CEIBAA VICTORY LANE
          </h2>
          <p className="text-white/90 text-base mb-4">
            Ceibaa - Where Every Post Pays
          </p>
          <p className="text-white/70 text-xs mb-5">
            *Terms & Conditions Apply. Maximum 15 posts per cycle (except 5000+ tier: 10 posts/cycle).*
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/victory-lane')}
              aria-label="Start earning now on Victory Lane"
              className="bg-white text-teal-600 px-6 py-3 rounded-xl font-bold text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              🚀 Start Earning Now
            </button>
            <button
              onClick={() => navigate('/contact')}
              aria-label="Get support from our team"
              className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/50 px-6 py-3 rounded-xl font-bold text-base hover:bg-white/30 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <HeadphonesIcon className="w-5 h-5" />
              Get Support
            </button>
          </div>
        </div>
      </section>

      {/* Support Section - Reduced padding */}
      <section className="py-6 md:py-8 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 border border-slate-600">
            <HeadphonesIcon className="w-12 h-12 text-teal-400 mx-auto mb-3" />
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Need Help?</h2>
            <p className="text-gray-400 text-sm mb-4">
              Our support team is here to help you with any questions about the Creator Rewards Program
            </p>
            <button
              onClick={() => navigate('/contact')}
              aria-label="Contact support team"
              className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 inline-flex items-center gap-2"
            >
              <HeadphonesIcon className="w-5 h-5" />
              Contact Support
            </button>
          </div>
        </div>
      </section>

      {/* Footer Note */}
      <section className="py-4 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 Ceibaa. All rights reserved. |{' '}
            <button 
              onClick={() => navigate('/terms')} 
              className="hover:text-white transition-colors duration-200"
            >
              Terms
            </button>{' '}
            |{' '}
            <button 
              onClick={() => navigate('/privacy')} 
              className="hover:text-white transition-colors duration-200"
            >
              Privacy
            </button>
          </p>
        </div>
      </section>
    </div>
  );
};

export default TeacherEarnings;
