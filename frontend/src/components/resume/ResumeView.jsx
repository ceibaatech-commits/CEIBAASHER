import React from 'react';
import { Mail, Phone, MapPin, Globe, Linkedin, Github, GraduationCap, Briefcase, Award, BookOpen, FolderGit2, Sparkles, User } from 'lucide-react';

/**
 * Read-only academic-CV style resume viewer.
 * Renders any resume payload returned by the resume APIs.
 */
export default function ResumeView({ resume }) {
  if (!resume) return null;
  const b = resume.basics || {};
  const meta = resume.meta || {};

  const hasAny = (arr) => Array.isArray(arr) && arr.length > 0;

  return (
    <article
      className="max-w-4xl mx-auto bg-white text-slate-800 shadow-sm border border-slate-200 rounded-2xl overflow-hidden"
      data-testid="resume-view"
    >
      {/* Header — Academic CV inspired */}
      <header className="px-8 md:px-12 py-8 md:py-10 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden ring-4 ring-white shadow-md bg-slate-100 flex-shrink-0">
            {b.avatar_url ? (
              <img src={b.avatar_url} alt={b.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <User size={40} />
              </div>
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900" data-testid="resume-name">
              {b.name || 'Your Name'}
            </h1>
            {b.headline && (
              <p className="text-lg md:text-xl text-indigo-600 mt-1 font-medium">{b.headline}</p>
            )}
            {b.bio && (
              <p className="text-sm md:text-base text-slate-600 mt-3 leading-relaxed max-w-2xl">
                {b.bio}
              </p>
            )}
            {(meta.air_rank || meta.exam_type || meta.college) && (
              <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                {meta.air_rank && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    AIR {meta.air_rank}
                  </span>
                )}
                {meta.exam_type && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {meta.exam_type}
                  </span>
                )}
                {meta.college && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    <GraduationCap size={12} className="inline mr-1" />
                    {meta.college}
                  </span>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-3 mt-4 text-xs text-slate-500 justify-center md:justify-start">
              {b.email && <span className="flex items-center gap-1.5"><Mail size={12} /> {b.email}</span>}
              {b.phone && <span className="flex items-center gap-1.5"><Phone size={12} /> {b.phone}</span>}
              {b.location && <span className="flex items-center gap-1.5"><MapPin size={12} /> {b.location}</span>}
              {b.website && <a href={b.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-indigo-600"><Globe size={12} /> Website</a>}
              {b.linkedin && <a href={b.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-indigo-600"><Linkedin size={12} /> LinkedIn</a>}
              {b.github && <a href={b.github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-indigo-600"><Github size={12} /> GitHub</a>}
            </div>
          </div>
        </div>
      </header>

      <div className="px-8 md:px-12 py-8 space-y-10">
        {hasAny(resume.experience) && (
          <Section icon={<Briefcase size={16} />} title="Experience">
            {resume.experience.map((x, i) => (
              <TimelineItem
                key={i}
                title={x.role}
                subtitle={x.company}
                right={`${x.start || ''}${x.end || x.current ? ' — ' + (x.current ? 'Present' : x.end) : ''}`}
                meta={x.location}
                description={x.description}
              />
            ))}
          </Section>
        )}

        {hasAny(resume.education) && (
          <Section icon={<GraduationCap size={16} />} title="Education">
            {resume.education.map((e, i) => (
              <TimelineItem
                key={i}
                title={`${e.degree || ''}${e.field ? ' — ' + e.field : ''}`}
                subtitle={e.institution}
                right={`${e.start_year || ''}${e.end_year ? ' — ' + e.end_year : ''}`}
                meta={e.grade && `Grade: ${e.grade}`}
                description={e.description}
              />
            ))}
          </Section>
        )}

        {hasAny(resume.projects) && (
          <Section icon={<FolderGit2 size={16} />} title="Projects">
            {resume.projects.map((p, i) => (
              <TimelineItem
                key={i}
                title={p.title}
                subtitle={hasAny(p.tech) ? p.tech.join(' · ') : ''}
                right={`${p.start || ''}${p.end ? ' — ' + p.end : ''}`}
                description={p.description}
                link={p.link}
              />
            ))}
          </Section>
        )}

        {hasAny(resume.publications) && (
          <Section icon={<BookOpen size={16} />} title="Publications">
            {resume.publications.map((p, i) => (
              <div key={i} className="mb-4 last:mb-0">
                <p className="text-sm text-slate-900 font-semibold">
                  {p.link ? <a href={p.link} target="_blank" rel="noreferrer" className="hover:text-indigo-600">{p.title}</a> : p.title}
                </p>
                {p.authors && <p className="text-xs text-slate-500 mt-0.5">{p.authors}</p>}
                <p className="text-xs text-slate-500 italic">{p.venue}{p.date ? ` · ${p.date}` : ''}</p>
              </div>
            ))}
          </Section>
        )}

        {hasAny(resume.skills) && (
          <Section icon={<Sparkles size={16} />} title="Skills">
            <div className="space-y-3">
              {resume.skills.map((s, i) => (
                <div key={i}>
                  {s.category && <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{s.category}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {(s.items || []).map((item, j) => (
                      <span key={j} className="px-2.5 py-1 rounded-md text-xs bg-slate-100 text-slate-700 border border-slate-200">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {hasAny(resume.certifications) && (
          <Section icon={<Award size={16} />} title="Certifications">
            {resume.certifications.map((c, i) => (
              <div key={i} className="mb-3 last:mb-0 flex items-baseline justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-900 font-semibold">
                    {c.link ? <a href={c.link} target="_blank" rel="noreferrer" className="hover:text-indigo-600">{c.title}</a> : c.title}
                  </p>
                  {c.issuer && <p className="text-xs text-slate-500">{c.issuer}</p>}
                </div>
                {c.date && <span className="text-xs text-slate-400 shrink-0">{c.date}</span>}
              </div>
            ))}
          </Section>
        )}

        {hasAny(resume.awards) && (
          <Section icon={<Award size={16} />} title="Awards & Honours">
            {resume.awards.map((a, i) => (
              <TimelineItem
                key={i}
                title={a.title}
                subtitle={a.issuer}
                right={a.date}
                description={a.description}
              />
            ))}
          </Section>
        )}

        {!hasAny(resume.experience) && !hasAny(resume.education) && !hasAny(resume.projects) && (
          <div className="text-center py-10 text-slate-400 text-sm" data-testid="resume-empty">
            This resume is empty. Add experience, education or projects to get started.
          </div>
        )}
      </div>
    </article>
  );
}

function Section({ icon, title, children }) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 pb-2 mb-4 border-b border-slate-200">
        <span className="text-indigo-500">{icon}</span> {title}
      </h2>
      {children}
    </section>
  );
}

function TimelineItem({ title, subtitle, right, meta, description, link }) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-sm md:text-base text-slate-900 font-semibold">
            {link ? <a href={link} target="_blank" rel="noreferrer" className="hover:text-indigo-600">{title}</a> : title}
          </p>
          {subtitle && <p className="text-sm text-indigo-600">{subtitle}</p>}
          {meta && <p className="text-xs text-slate-500 mt-0.5">{meta}</p>}
        </div>
        {right && <span className="text-xs text-slate-400 shrink-0 font-mono">{right}</span>}
      </div>
      {description && (
        <p className="text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-wrap">{description}</p>
      )}
    </div>
  );
}
