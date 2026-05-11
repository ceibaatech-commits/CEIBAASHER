import React from 'react';
import { motion } from 'framer-motion';
import HomeExamCard from './HomeExamCard';

/**
 * HomeExamSection — data-driven exam category section with header + card grid.
 * Used by HomeDesktopSections to avoid repeating ~150 lines per category.
 */
const HomeExamSection = ({
  bgGradient,
  borderColor,
  iconBg,
  iconContent,
  title,
  titleGradient,
  subtitle,
  tags = [],
  exams = [],
  hoverGlow,
  hoverBorder,
  gridCols = 'lg:grid-cols-3',
}) => (
  <div className="mb-16">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r ${bgGradient} rounded-3xl p-8 mb-8 border-2 ${borderColor} shadow-lg`}
    >
      <div className="flex items-center gap-4 mb-3">
        <motion.div
          className={`w-16 h-16 bg-gradient-to-br ${iconBg} rounded-2xl flex items-center justify-center shadow-xl`}
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {iconContent}
        </motion.div>
        <div>
          <h2 className={`text-4xl font-black bg-gradient-to-r ${titleGradient} bg-clip-text text-transparent`}>
            {title}
          </h2>
          <p className="text-gray-700 font-medium text-lg">{subtitle}</p>
        </div>
      </div>
      {tags.length > 0 && (
        <div className="flex items-center gap-3 text-sm text-gray-600 mt-4 flex-wrap">
          {tags.map((tag, i) => (
            <span key={i} className={`px-4 py-2 bg-white rounded-full shadow-sm border ${tag.border}`}>
              {tag.text}
            </span>
          ))}
        </div>
      )}
    </motion.div>

    <div className={`grid md:grid-cols-2 ${gridCols} gap-8`}>
      {exams.map((exam, index) => (
        <HomeExamCard key={exam.id} exam={exam} index={index} hoverGlow={hoverGlow} hoverBorder={hoverBorder} />
      ))}
    </div>
  </div>
);

export default HomeExamSection;
