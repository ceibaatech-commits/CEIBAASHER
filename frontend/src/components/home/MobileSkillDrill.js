import React from 'react';
import { ChevronRight } from 'lucide-react';
import { SKILL_DRILL_CLASSES } from '../../hooks/useHomeData';

const MobileSkillDrill = ({ navigate }) => {
  const skillDrillClasses = SKILL_DRILL_CLASSES;

  return (
    <div id="skill-drill-section" className="md:hidden px-4 py-6" style={{ backgroundColor: '#fdf9ee' }} data-testid="mobile-skill-drill-section">
      <div className="mb-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#efc868' }}>
          <img
            src="/sarvam-logo-dark.svg"
            alt="Ceibaa"
            aria-hidden="true"
            className="w-5 h-5 object-contain"
            data-testid="skill-drill-logo"
          />
        </div>
        <div>
          <h2 className="text-[20px] font-black" style={{ color: '#0f172a', letterSpacing: '-0.01em' }}>Skill Drill — CBSE Classes</h2>
          <p className="text-[12px]" style={{ color: '#64748b' }}>Chapter-wise practice for all subjects</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {skillDrillClasses.map((classItem) => (
          <div
            key={classItem.id}
            onClick={() => navigate(`/chapter-tests/${classItem.id}`)}
            className="relative bg-white rounded-2xl p-4 shadow-lg border-2 border-gray-100 active:scale-95 transition-transform cursor-pointer overflow-hidden"
          >
            {/* Background gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${classItem.color} opacity-10`}></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-4xl">{classItem.icon}</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">{classItem.name}</h3>
              <p className="text-xs text-gray-600 leading-tight">{classItem.subjects}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileSkillDrill;

