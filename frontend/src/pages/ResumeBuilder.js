import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Save, Eye, Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import ResumeView from '@/components/resume/ResumeView';

const API = process.env.REACT_APP_BACKEND_URL;

const EMPTY = {
  basics: { name: '', headline: '', bio: '', location: '', email: '', phone: '', avatar_url: '', website: '', linkedin: '', github: '' },
  education: [],
  experience: [],
  projects: [],
  skills: [],
  certifications: [],
  publications: [],
  awards: [],
};

const SECTION_BLANKS = {
  education: { institution: '', degree: '', field: '', start_year: '', end_year: '', grade: '', description: '' },
  experience: { company: '', role: '', location: '', start: '', end: '', current: false, description: '' },
  projects: { title: '', description: '', tech: [], link: '', start: '', end: '' },
  skills: { category: '', items: [] },
  certifications: { title: '', issuer: '', date: '', link: '' },
  publications: { title: '', venue: '', date: '', link: '', authors: '' },
  awards: { title: '', issuer: '', date: '', description: '' },
};

export default function ResumeBuilder() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [resume, setResume] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated?.()) {
      navigate('/login');
      return;
    }
    (async () => {
      try {
        const { data } = await axios.get(`${API}/api/recruitment/resume/me`);
        setResume({ ...EMPTY, ...data, basics: { ...EMPTY.basics, ...(data.basics || {}) } });
      } catch (e) {
        toast.error('Failed to load resume');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      // strip meta before sending
      const { meta, updated_at, ...payload } = resume;  // eslint-disable-line no-unused-vars
      await axios.put(`${API}/api/recruitment/resume/me`, payload);
      toast.success('Resume saved');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const updateBasics = (key, value) => setResume(r => ({ ...r, basics: { ...r.basics, [key]: value } }));
  const addItem = (section) => setResume(r => ({ ...r, [section]: [...r[section], { ...SECTION_BLANKS[section] }] }));
  const removeItem = (section, idx) => setResume(r => ({ ...r, [section]: r[section].filter((_, i) => i !== idx) }));
  const updateItem = (section, idx, key, value) => setResume(r => ({
    ...r,
    [section]: r[section].map((it, i) => i === idx ? { ...it, [key]: value } : it),
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header isLoggedIn={isAuthenticated?.()} user={user} />
        <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-indigo-500" /></div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="resume-builder-page">
      <Header isLoggedIn={isAuthenticated?.()} user={user} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm" data-testid="back-btn">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setPreviewOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm hover:bg-slate-100" data-testid="preview-btn">
              <Eye size={16} /> Preview
            </button>
            <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60" data-testid="save-btn">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-1">Build Your Resume</h1>
        <p className="text-sm text-slate-500 mb-8">Recruiters see this when you Apply with CEIBAA Profile.</p>

        {/* Basics */}
        <Card title="Basics" testid="section-basics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name" value={resume.basics.name} onChange={(v) => updateBasics('name', v)} testid="basics-name" />
            <Field label="Headline (e.g. Aspiring Data Scientist)" value={resume.basics.headline} onChange={(v) => updateBasics('headline', v)} testid="basics-headline" />
            <Field label="Email" value={resume.basics.email} onChange={(v) => updateBasics('email', v)} testid="basics-email" />
            <Field label="Phone" value={resume.basics.phone} onChange={(v) => updateBasics('phone', v)} testid="basics-phone" />
            <Field label="Location" value={resume.basics.location} onChange={(v) => updateBasics('location', v)} testid="basics-location" />
            <Field label="Avatar URL" value={resume.basics.avatar_url} onChange={(v) => updateBasics('avatar_url', v)} testid="basics-avatar" />
            <Field label="Website" value={resume.basics.website} onChange={(v) => updateBasics('website', v)} testid="basics-website" />
            <Field label="LinkedIn" value={resume.basics.linkedin} onChange={(v) => updateBasics('linkedin', v)} testid="basics-linkedin" />
            <Field label="GitHub" value={resume.basics.github} onChange={(v) => updateBasics('github', v)} testid="basics-github" />
          </div>
          <TextArea label="Short Bio" value={resume.basics.bio} onChange={(v) => updateBasics('bio', v)} rows={3} testid="basics-bio" />
        </Card>

        {/* Experience */}
        <SectionList
          title="Experience"
          section="experience"
          items={resume.experience}
          onAdd={() => addItem('experience')}
          onRemove={(i) => removeItem('experience', i)}
          renderItem={(it, i) => (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Role" value={it.role} onChange={(v) => updateItem('experience', i, 'role', v)} />
                <Field label="Company" value={it.company} onChange={(v) => updateItem('experience', i, 'company', v)} />
                <Field label="Location" value={it.location} onChange={(v) => updateItem('experience', i, 'location', v)} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Start" value={it.start} onChange={(v) => updateItem('experience', i, 'start', v)} placeholder="Jan 2023" />
                  <Field label="End" value={it.end} onChange={(v) => updateItem('experience', i, 'end', v)} placeholder="Dec 2023" disabled={it.current} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600 mt-2">
                <input type="checkbox" checked={!!it.current} onChange={(e) => updateItem('experience', i, 'current', e.target.checked)} />
                Currently working here
              </label>
              <TextArea label="Description" value={it.description} onChange={(v) => updateItem('experience', i, 'description', v)} rows={3} />
            </>
          )}
        />

        {/* Education */}
        <SectionList
          title="Education"
          section="education"
          items={resume.education}
          onAdd={() => addItem('education')}
          onRemove={(i) => removeItem('education', i)}
          renderItem={(it, i) => (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Institution" value={it.institution} onChange={(v) => updateItem('education', i, 'institution', v)} />
                <Field label="Degree" value={it.degree} onChange={(v) => updateItem('education', i, 'degree', v)} />
                <Field label="Field of Study" value={it.field} onChange={(v) => updateItem('education', i, 'field', v)} />
                <Field label="Grade / CGPA" value={it.grade} onChange={(v) => updateItem('education', i, 'grade', v)} />
                <Field label="Start Year" value={it.start_year} onChange={(v) => updateItem('education', i, 'start_year', v)} placeholder="2020" />
                <Field label="End Year" value={it.end_year} onChange={(v) => updateItem('education', i, 'end_year', v)} placeholder="2024" />
              </div>
              <TextArea label="Notes (activities, coursework…)" value={it.description} onChange={(v) => updateItem('education', i, 'description', v)} rows={2} />
            </>
          )}
        />

        {/* Projects */}
        <SectionList
          title="Projects"
          section="projects"
          items={resume.projects}
          onAdd={() => addItem('projects')}
          onRemove={(i) => removeItem('projects', i)}
          renderItem={(it, i) => (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Title" value={it.title} onChange={(v) => updateItem('projects', i, 'title', v)} />
                <Field label="Link (optional)" value={it.link} onChange={(v) => updateItem('projects', i, 'link', v)} />
                <Field label="Start" value={it.start} onChange={(v) => updateItem('projects', i, 'start', v)} />
                <Field label="End" value={it.end} onChange={(v) => updateItem('projects', i, 'end', v)} />
                <Field
                  label="Tech (comma-separated)"
                  value={(it.tech || []).join(', ')}
                  onChange={(v) => updateItem('projects', i, 'tech', v.split(',').map(x => x.trim()).filter(Boolean))}
                />
              </div>
              <TextArea label="Description" value={it.description} onChange={(v) => updateItem('projects', i, 'description', v)} rows={3} />
            </>
          )}
        />

        {/* Skills */}
        <SectionList
          title="Skills"
          section="skills"
          items={resume.skills}
          onAdd={() => addItem('skills')}
          onRemove={(i) => removeItem('skills', i)}
          renderItem={(it, i) => (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Category (e.g. Programming)" value={it.category} onChange={(v) => updateItem('skills', i, 'category', v)} />
                <Field
                  label="Items (comma-separated)"
                  value={(it.items || []).join(', ')}
                  onChange={(v) => updateItem('skills', i, 'items', v.split(',').map(x => x.trim()).filter(Boolean))}
                />
              </div>
            </>
          )}
        />

        {/* Certifications */}
        <SectionList
          title="Certifications"
          section="certifications"
          items={resume.certifications}
          onAdd={() => addItem('certifications')}
          onRemove={(i) => removeItem('certifications', i)}
          renderItem={(it, i) => (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Title" value={it.title} onChange={(v) => updateItem('certifications', i, 'title', v)} />
              <Field label="Issuer" value={it.issuer} onChange={(v) => updateItem('certifications', i, 'issuer', v)} />
              <Field label="Date" value={it.date} onChange={(v) => updateItem('certifications', i, 'date', v)} />
              <Field label="Link" value={it.link} onChange={(v) => updateItem('certifications', i, 'link', v)} />
            </div>
          )}
        />

        {/* Publications */}
        <SectionList
          title="Publications"
          section="publications"
          items={resume.publications}
          onAdd={() => addItem('publications')}
          onRemove={(i) => removeItem('publications', i)}
          renderItem={(it, i) => (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Title" value={it.title} onChange={(v) => updateItem('publications', i, 'title', v)} />
              <Field label="Venue (journal/conf)" value={it.venue} onChange={(v) => updateItem('publications', i, 'venue', v)} />
              <Field label="Authors" value={it.authors} onChange={(v) => updateItem('publications', i, 'authors', v)} />
              <Field label="Date" value={it.date} onChange={(v) => updateItem('publications', i, 'date', v)} />
              <Field label="Link" value={it.link} onChange={(v) => updateItem('publications', i, 'link', v)} />
            </div>
          )}
        />

        {/* Awards */}
        <SectionList
          title="Awards & Honours"
          section="awards"
          items={resume.awards}
          onAdd={() => addItem('awards')}
          onRemove={(i) => removeItem('awards', i)}
          renderItem={(it, i) => (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Title" value={it.title} onChange={(v) => updateItem('awards', i, 'title', v)} />
                <Field label="Issuer" value={it.issuer} onChange={(v) => updateItem('awards', i, 'issuer', v)} />
                <Field label="Date" value={it.date} onChange={(v) => updateItem('awards', i, 'date', v)} />
              </div>
              <TextArea label="Description" value={it.description} onChange={(v) => updateItem('awards', i, 'description', v)} rows={2} />
            </>
          )}
        />
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 overflow-y-auto p-4" onClick={() => setPreviewOpen(false)} data-testid="preview-modal">
          <div className="min-h-full flex items-start justify-center py-8" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-4xl">
              <button
                onClick={() => setPreviewOpen(false)}
                className="mb-3 px-4 py-2 bg-white/90 text-slate-700 rounded-lg text-sm hover:bg-white"
                data-testid="close-preview-btn"
              >
                Close Preview
              </button>
              <ResumeView resume={resume} />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

// ---------- helpers ----------
function Card({ title, children, testid }) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm" data-testid={testid}>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function SectionList({ title, section, items, onAdd, onRemove, renderItem }) {
  return (
    <Card title={title} testid={`section-${section}`}>
      <div className="space-y-4">
        {items.length === 0 && (
          <p className="text-sm text-slate-400 italic">No entries yet. Click &quot;Add&quot; to create one.</p>
        )}
        {items.map((it, i) => (
          <div key={i} className="border border-slate-200 rounded-xl p-4 relative" data-testid={`${section}-item-${i}`}>
            <button
              onClick={() => onRemove(i)}
              className="absolute top-3 right-3 text-slate-400 hover:text-rose-500"
              aria-label="Remove"
              data-testid={`remove-${section}-${i}`}
            >
              <Trash2 size={16} />
            </button>
            {renderItem(it, i)}
          </div>
        ))}
      </div>
      <button
        onClick={onAdd}
        className="mt-4 flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg"
        data-testid={`add-${section}-btn`}
      >
        <Plus size={16} /> Add {title.replace(/s$/, '')}
      </button>
    </Card>
  );
}

function Field({ label, value, onChange, placeholder, disabled, testid }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        data-testid={testid}
        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 3, testid }) {
  return (
    <label className="block mt-3">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        data-testid={testid}
        className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </label>
  );
}
