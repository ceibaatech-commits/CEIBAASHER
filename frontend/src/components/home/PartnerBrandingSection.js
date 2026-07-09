import React from 'react';

const partners = [
  'Top Company',
  'FutureLab',
  'EduSpark',
  'CareerBoost',
  'SkillForge',
];

const PartnerBrandingSection = () => {
  return (
    <section className="bg-white border-b border-slate-200 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Trusted by</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">Our partner community</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-2xl mx-auto">
            Working with leading brands and institutions to bring you real-world internships, research opportunities, and career-ready programs.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 items-center text-center">
          {partners.map((name) => (
            <div key={name} className="rounded-3xl border border-slate-200 bg-slate-50 py-6 px-4 shadow-sm">
              <span className="block text-sm font-semibold text-slate-700">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnerBrandingSection;
