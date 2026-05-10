import React from 'react';
import { BookOpen, Layers, FileText } from 'lucide-react';

/**
 * 4-stat summary grid for ExamCategoryManager
 * (exams / categories / chapters / questions).
 *
 * Extracted from ExamCategoryManager.js (Feb 25, 2026) to keep the parent
 * component focused on data + tab orchestration.
 */
const ExamCategoryStatsGrid = ({ stats = { exams: 0, categories: 0, chapters: 0, questions: 0 } }) => (
  <div className="grid grid-cols-4 gap-4 mb-6" data-testid="ecm-stats-grid">
    <StatCard label="Total Exams" value={stats.exams} accent="blue" icon={<BookOpen className="w-8 h-8 text-blue-500" />} />
    <StatCard label="Categories" value={stats.categories} accent="purple" icon={<Layers className="w-8 h-8 text-purple-500" />} />
    <StatCard label="Chapters" value={stats.chapters} accent="green" icon={<FileText className="w-8 h-8 text-green-500" />} />
    <StatCard label="Questions" value={stats.questions} accent="orange" icon={<FileText className="w-8 h-8 text-orange-500" />} />
  </div>
);

const StatCard = ({ label, value, accent, icon }) => {
  // Accent colors mapped statically so Tailwind's JIT compiler picks them up.
  const styles = {
    blue: { bg: 'bg-blue-50', label: 'text-blue-600', value: 'text-blue-700' },
    purple: { bg: 'bg-purple-50', label: 'text-purple-600', value: 'text-purple-700' },
    green: { bg: 'bg-green-50', label: 'text-green-600', value: 'text-green-700' },
    orange: { bg: 'bg-orange-50', label: 'text-orange-600', value: 'text-orange-700' },
  }[accent] || { bg: 'bg-gray-50', label: 'text-gray-600', value: 'text-gray-700' };
  return (
    <div className={`${styles.bg} rounded-lg p-4`} data-testid={`ecm-stat-${accent}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${styles.label}`}>{label}</p>
          <p className={`text-2xl font-bold ${styles.value}`}>{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
};

export default ExamCategoryStatsGrid;
