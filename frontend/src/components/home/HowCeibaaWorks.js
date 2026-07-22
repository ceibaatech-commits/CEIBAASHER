import React from 'react';
import { motion } from 'framer-motion';

const HowCeibaaWorks = () => {
  return (
    <div className="mt-12 relative overflow-hidden rounded-3xl shadow-2xl">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src="https://customer-assets.emergentagent.com/job_prep-together/artifacts/96rls157_Gemini_Generated_Image_swqa8zswqa8zswqa%202.png"
          alt="Ceibaa Background"
          className="w-full h-full object-cover object-center opacity-90"
        />
        {/* Lighter Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/60 via-transparent to-purple-900/60"></div>
        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-indigo-900/70 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 py-8 px-8 text-white">
        <div className="text-center max-w-6xl mx-auto">
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-black mb-2 drop-shadow-2xl"
            style={{
              textShadow: '0 0 30px rgba(0,0,0,0.8), 0 0 60px rgba(0,0,0,0.5)'
            }}
          >
            How Ceibaa Works ✨
          </motion.h3>
          <p className="text-lg text-white font-bold mb-8 drop-shadow-xl">
            Your journey to exam success in 3 simple steps
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-6">
            {/* Step 1 */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative group"
            >
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105 border-4 border-cyan-400">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-br from-cyan-400 to-blue-600 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                    <span className="text-xl font-black text-white">1</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-4xl mb-2">🎯</div>
                  <h4 className="text-lg font-black mb-2 text-cyan-600">Select Your Exam</h4>
                  <p className="text-gray-800 text-sm leading-relaxed font-bold">
                    Choose from 60+ competitive exams
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative group"
            >
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105 border-4 border-purple-400">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-br from-purple-400 to-pink-600 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                    <span className="text-xl font-black text-white">2</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-4xl mb-2">📚</div>
                  <h4 className="text-lg font-black mb-2 text-purple-600">Pick Your Topic</h4>
                  <p className="text-gray-800 text-sm leading-relaxed font-bold">
                    Topic-wise practice & tracking
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="relative group"
            >
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 border-4 border-orange-400">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-br from-orange-400 to-red-600 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                    <span className="text-xl font-black text-white">3</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-4xl mb-2">⚔️</div>
                  <h4 className="text-lg font-black mb-2 text-orange-600">Battle & Win</h4>
                  <p className="text-gray-800 text-sm leading-relaxed font-bold">
                    Compete live or practice solo
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* CTA Button */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <button
              onClick={() => {
                const examsSection = document.querySelector('main');
                examsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:from-yellow-500 hover:via-orange-600 hover:to-red-600 px-8 py-4 rounded-full font-black text-lg shadow-2xl transform hover:scale-110 transition-all duration-300 inline-flex items-center gap-2 text-white border-4 border-white"
              style={{
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              🚀 Start Your Battle Journey
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HowCeibaaWorks;
