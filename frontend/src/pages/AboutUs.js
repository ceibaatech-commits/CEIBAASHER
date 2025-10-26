import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TrendingDown, Zap, Trophy, Users, BookOpen, Star, Target, Award, Sparkles, Clock, Brain, Gamepad2, Video, MessageCircle, BarChart3, Shield } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const AboutUs = () => {
  const navigate = useNavigate();

  const statsData = [
    { icon: Users, value: "50,000+", label: "Active Students", color: "from-purple-500 to-pink-500" },
    { icon: Trophy, value: "100,000+", label: "Battles Daily", color: "from-orange-500 to-red-500" },
    { icon: BookOpen, value: "1M+", label: "Questions Solved", color: "from-blue-500 to-cyan-500" },
    { icon: Star, value: "4.9/5", label: "User Rating", color: "from-yellow-500 to-orange-500" },
    { icon: Target, value: "95%", label: "Success Rate", color: "from-green-500 to-emerald-500" },
    { icon: Award, value: "500+", label: "Expert Creators", color: "from-indigo-500 to-purple-500" }
  ];

  const features = [
    {
      icon: Video,
      title: "Live Video Battles",
      description: "Stream live like TikTok while competing - see your opponents, react in real-time, and make learning social.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Trophy,
      title: "Real Rewards",
      description: "Earn coins, unlock badges, climb leaderboards, and get real recognition for your achievements.",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: MessageCircle,
      title: "Social Learning",
      description: "Create rooms, invite friends, chat during battles - it's like WhatsApp groups but productive!",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Zap,
      title: "Instant Gratification",
      description: "See results immediately, get instant feedback, and watch your progress grow in real-time.",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: Brain,
      title: "Smart AI Matching",
      description: "Compete with students at your level - always challenging but never overwhelming.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Users,
      title: "Pan-India Community",
      description: "Connect with lakhs of students across India - make friends while preparing together.",
      gradient: "from-indigo-500 to-purple-500"
    }
  ];

  const problems = [
    { icon: TrendingDown, text: "70% of students spend 4-6 hours daily on Instagram, TikTok, and YouTube" },
    { icon: Clock, text: "Average attention span dropped from 12 seconds to just 8 seconds" },
    { icon: Sparkles, text: "Students constantly distracted during study hours by notifications" },
    { icon: Brain, text: "Traditional learning feels boring compared to social media dopamine hits" },
    { icon: BookOpen, text: "Exam preparation becomes overwhelming without engaging methods" },
    { icon: Shield, text: "Students feel guilty but can't break the social media addiction cycle" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 text-white py-20"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [360, 180, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-20 -left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block mb-4"
              >
                <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold">
                  🚀 Transforming Education
                </span>
              </motion.div>
              <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
                Making Learning as <span className="text-yellow-300">Addictive</span> as Social Media
              </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                We studied what makes social media addictive and built those exact features into education.
              </p>
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/')}
                  className="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg shadow-2xl hover:shadow-white/50 transition-all"
                >
                  Start Your First Battle
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white/10 backdrop-blur-sm border-2 border-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all"
                >
                  Talk to Support
                </motion.button>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <motion.img
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                src="https://customer-assets.emergentagent.com/job_exam-multiverse/artifacts/1myn3mmd_Gemini_Generated_Image_g59ok8g59ok8g59o_2-removebg-preview.png"
                alt="Students Learning"
                className="w-full h-auto drop-shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* The Crisis Section */}
      <section className="py-20 bg-gradient-to-b from-white to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block mb-4"
            >
              <span className="text-6xl">⚠️</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              The Growing Crisis: Students Lost in Social Media
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Every year, millions of talented students fail exams - not because they're not smart, but because they're distracted.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problems.map((problem, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white rounded-2xl p-6 shadow-lg border-2 border-red-100 hover:border-red-300 transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                  <problem.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-gray-700 font-medium">{problem.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-50 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 w-96 h-96 bg-green-500 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <motion.img
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                src="https://customer-assets.emergentagent.com/job_exam-multiverse/artifacts/1icmhpfp_Gemini_Generated_Image_7osubg7osubg7osu_2-removebg-preview.png"
                alt="Learning Solution"
                className="w-full h-auto drop-shadow-2xl"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block mb-4"
              >
                <span className="text-6xl">🎯</span>
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Our Solution: Making Learning as Addictive as Social Media
              </h2>
              <div className="space-y-4">
                {[
                  "Live battle format creates the same excitement as gaming streams",
                  "Video features like TikTok - but for educational content",
                  "Real-time competitions keep students engaged like social media challenges",
                  "Instant gratification through points, badges, and leaderboards",
                  "Community features that replace mindless scrolling with productive learning",
                  "Gamification that makes studying feel like entertainment"
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <p className="text-gray-700 text-lg">{item}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-6"
            >
              <span className="text-7xl">🚀</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black mb-8">Our Mission</h2>
            <p className="text-2xl leading-relaxed text-white/90">
              We believe education shouldn't compete with entertainment - it should <span className="text-yellow-300 font-bold">BE entertainment</span>. 
              Ceibaa transforms exam preparation from a boring chore into an exciting social experience that students actually look forward to.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4">Our Impact</h2>
            <p className="text-xl text-gray-600">Real numbers, real success stories</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {statsData.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -10 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 rounded-3xl blur-xl transition-opacity duration-300" 
                     style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}
                />
                <div className="relative bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-100 group-hover:border-transparent transition-all">
                  <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mb-4 mx-auto`}>
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 + 0.3, type: "spring", stiffness: 200 }}
                      className="text-4xl font-black mb-2 bg-gradient-to-r bg-clip-text text-transparent"
                      style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`, backgroundClip: 'text' }}
                    >
                      <span className={`bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                        {stat.value}
                      </span>
                    </motion.div>
                    <p className="text-gray-600 font-semibold">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4">What Makes Ceibaa Different?</h2>
            <p className="text-xl text-gray-600">Features that keep you coming back for more</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group"
              >
                <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all border-2 border-gray-100 hover:border-transparent h-full">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6`}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <motion.div
            animate={{ scale: [1, 1.5, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], rotate: [360, 180, 0] }}
            transition={{ duration: 25, repeat: Infinity }}
            className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-6"
            >
              <span className="text-7xl">🎓</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to Transform Your Study Habits?</h2>
            <p className="text-2xl mb-10 text-white/90">
              Join 50,000+ students who stopped wasting time on social media and started using it for exam success!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="bg-white text-purple-600 px-10 py-5 rounded-xl font-bold text-xl shadow-2xl hover:shadow-white/50 transition-all"
              >
                🚀 Start Your First Battle
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/10 backdrop-blur-sm border-2 border-white px-10 py-5 rounded-xl font-bold text-xl hover:bg-white/20 transition-all"
              >
                💬 Talk to Support
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs;
