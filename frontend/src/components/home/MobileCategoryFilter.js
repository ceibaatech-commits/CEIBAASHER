import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '../../hooks/useHomeData';

const MobileCategoryFilter = ({
  activeCategory,
  setActiveCategory,
  filteredExams,
  navigate,
}) => {
  const categories = CATEGORIES;
  
  // Group categories into rows of 3
  const rows = [];
  for (let i = 0; i < categories.length; i += 3) {
    rows.push(categories.slice(i, i + 3));
  }
  
  const activeRowIndex = activeCategory 
    ? rows.findIndex(row => row.some(cat => cat.id === activeCategory))
    : -1;

  return (
    <div className="md:hidden sticky top-16 z-30 border-b" style={{ backgroundColor: '#fdf9ee', borderColor: 'rgba(15,23,42,0.08)' }}>
      <div className="py-3 px-3">
        {rows.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {/* Category Row */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              {row.map(cat => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(isActive ? '' : cat.id)}
                    data-testid={`mobile-category-${cat.id}`}
                    className="relative flex flex-col items-center justify-center rounded-2xl py-4 px-2 transition-all active:scale-[0.97]"
                    style={{
                      backgroundColor: '#ffffff',
                      border: isActive ? '1.5px solid #4c1d95' : '1px solid rgba(15,23,42,0.08)',
                      boxShadow: isActive
                        ? '0 10px 24px -12px rgba(76,29,149,0.45)'
                        : '0 6px 14px -10px rgba(15,23,42,0.25)',
                    }}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center mb-2"
                      style={{ backgroundColor: isActive ? '#4c1d95' : '#f5e6cb' }}
                    >
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.label}
                          className="w-7 h-7 object-contain"
                          style={{ filter: isActive ? 'brightness(0) invert(1)' : 'none' }}
                        />
                      ) : (
                        <span className="text-[22px] leading-none" aria-hidden="true">
                          {cat.icon}
                        </span>
                      )}
                    </div>
                    <span
                      className="text-center text-[11px] font-bold leading-tight line-clamp-2"
                      style={{ color: '#0f172a' }}
                    >
                      {cat.label}
                    </span>
                    {isActive && (
                      <ChevronDown
                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4"
                        style={{ color: '#4c1d95' }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Drawer Panel */}
            <AnimatePresence>
              {activeRowIndex === rowIndex && activeCategory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="rounded-2xl p-3 mb-3" style={{ backgroundColor: '#ffffff', border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 10px 24px -14px rgba(15,23,42,0.25)' }}>
                    {/* Category Header */}
                    <div className="rounded-xl p-3 mb-3" style={{ backgroundColor: '#4c1d95', color: '#ffffff' }}>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const activeCat = categories.find(c => c.id === activeCategory);
                          if (!activeCat) return null;
                          return activeCat.image ? (
                            <img
                              src={activeCat.image}
                              alt={activeCat.label}
                              className="w-6 h-6 object-contain"
                              style={{ filter: 'brightness(0) invert(1)' }}
                            />
                          ) : (
                            <span className="text-lg leading-none" aria-hidden="true">{activeCat.icon}</span>
                          );
                        })()}
                        <div>
                          <h3 className="font-bold text-sm">{categories.find(c => c.id === activeCategory)?.label}</h3>
                          <p className="text-[11px]" style={{ color: '#ddd6fe' }}>{filteredExams.length} exams available</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Exam Cards */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {filteredExams.map((exam) => (
                        <div
                          key={exam.id}
                          onClick={() => navigate(`/exam/${exam.id}`)}
                          className="bg-white border border-gray-200 rounded-lg p-2.5 active:scale-98 transition-transform cursor-pointer flex items-center gap-2.5"
                        >
                          <div 
                            className={`bg-gradient-to-br ${exam.color} rounded-lg flex items-center justify-center shadow-sm`}
                            style={{ width: '2rem', height: '2rem', minWidth: '2rem' }}
                          >
                            {exam.icon?.startsWith('http') ? (
                              <img src={exam.icon} alt={exam.name} className="w-4 h-4 object-contain" />
                            ) : (
                              <span className="text-sm">{exam.icon}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-xs">{exam.name}</h4>
                            <p className="text-gray-500 text-[10px] truncate">{exam.full_name}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        </div>
                      ))}
                      {filteredExams.length === 0 && (
                        <p className="text-center text-gray-500 py-4 text-sm">No exams in this category</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default MobileCategoryFilter;
