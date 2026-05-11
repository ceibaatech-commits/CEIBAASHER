import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * HomeExamCard — renders a single exam card used in all desktop section grids.
 * @param {object} exam - exam data object from /api/quiz/exams
 * @param {number} index - position index for staggered animation
 * @param {string} hoverGlow - Tailwind gradient classes for the hover glow (e.g. "from-green-200 via-emerald-200 to-teal-200")
 * @param {string} hoverBorder - Tailwind border-color class (e.g. "hover:border-green-300")
 */
const HomeExamCard = ({ exam, index = 0, hoverGlow = 'from-blue-200 via-indigo-200 to-purple-200', hoverBorder = 'hover:border-blue-300' }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      key={exam.id}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={() => navigate(`/exam/${exam.id}`)}
      className="group relative cursor-pointer"
      data-testid={`exam-card-${exam.id}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${hoverGlow} rounded-3xl blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500`} />

      <div className={`relative bg-white rounded-3xl shadow-xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 border-2 border-gray-100 ${hoverBorder} min-h-[420px] flex flex-col`}>
        {/* Card header with gradient background */}
        <div className={`bg-gradient-to-br ${exam.color} p-8 relative overflow-hidden flex-shrink-0`}>
          <motion.div
            className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full -ml-12 -mb-12"
            animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          <div className="relative text-white">
            <motion.div className="mb-4" whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: 'spring', stiffness: 300 }}>
              {exam.icon && exam.icon.startsWith('http') ? (
                <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl p-3 shadow-2xl">
                  <img src={exam.icon} alt={exam.name} className="w-full h-full object-contain drop-shadow-lg" />
                </div>
              ) : (
                <div className="text-6xl text-center">{exam.icon}</div>
              )}
            </motion.div>
            <h3 className="text-2xl font-bold mb-2 drop-shadow-lg text-center">{exam.name}</h3>
            <p className="text-white/90 text-sm drop-shadow-md text-center font-medium">{exam.full_name}</p>
          </div>
        </div>

        {/* Card body */}
        <div className="p-6 flex-grow flex flex-col justify-between">
          <p className="text-gray-700 text-sm mb-6 h-14 leading-relaxed text-center overflow-hidden line-clamp-3">{exam.description}</p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="font-semibold">{exam.total_questions} Qs</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold">{exam.duration}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HomeExamCard;
