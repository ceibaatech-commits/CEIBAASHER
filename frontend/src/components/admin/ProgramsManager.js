import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  GraduationCap, Users, Clock, Mail, Phone, School, Search,
  ChevronDown, Eye, CheckCircle2, XCircle, Trash2, Plus, Edit2, X,
  Trophy, Microscope, Briefcase, Cpu, Heart, Sun, Filter, RefreshCw
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
// Cookie-based auth (httpOnly `ceibaa_admin_token`) — sent automatically by
// axios because `axios.defaults.withCredentials = true` is set globally.
const authConfig = () => ({ withCredentials: true });

const DOMAIN_CONFIG = {
  competition:      { label: 'Competition',   color: 'bg-amber-100 text-amber-800',   icon: Trophy },
  research:         { label: 'Research',       color: 'bg-violet-100 text-violet-800', icon: Microscope },
  entrepreneurship: { label: 'Internship',     color: 'bg-amber-100 text-amber-800',   icon: Briefcase },
  ai_tech:          { label: 'AI & Tech',      color: 'bg-teal-100 text-teal-800',     icon: Cpu },
  healthcare:       { label: 'Healthcare',     color: 'bg-rose-100 text-rose-800',     icon: Heart },
  summer:           { label: 'Summer',         color: 'bg-sky-100 text-sky-800',       icon: Sun },
};

const STATUS_STYLES = {
  new:       'bg-blue-100 text-blue-800',
  contacted: 'bg-amber-100 text-amber-800',
  enrolled:  'bg-emerald-100 text-emerald-800',
  rejected:  'bg-red-100 text-red-800',
};

const ProgramsManager = () => {
  const [tab, setTab] = useState('enquiries');
  const [programs, setPrograms] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enquiryFilter, setEnquiryFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [enquiryPagination, setEnquiryPagination] = useState({ page: 1, total: 0 });
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPrograms = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/programs`);
      setPrograms(res.data.programs || []);
    } catch { toast.error('Failed to load programs'); }
  }, []);

  const fetchEnquiries = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (enquiryFilter !== 'all') params.append('status', enquiryFilter);
      if (programFilter !== 'all') params.append('program_id', programFilter);
      const res = await axios.get(`${API_URL}/api/admin/programs/enquiries?${params}`, authConfig());
      setEnquiries(res.data.enquiries || []);
      setEnquiryPagination({ page, total: res.data.pagination?.total || 0 });
      const newRes = await axios.get(`${API_URL}/api/admin/programs/enquiries?status=new&limit=1`, authConfig());
      setPendingCount(newRes.data.pagination?.total || 0);
    } catch { toast.error('Failed to load enquiries'); }
  }, [enquiryFilter, programFilter]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchPrograms(), fetchEnquiries()]);
      setLoading(false);
    };
    load();
  }, [fetchPrograms, fetchEnquiries]);

  const updateEnquiryStatus = async (id, status) => {
    try {
      await axios.put(`${API_URL}/api/admin/programs/enquiries/${id}?status=${status}`, {}, authConfig());
      toast.success(`Marked as ${status}`);
      fetchEnquiries(enquiryPagination.page);
    } catch { toast.error('Failed to update'); }
  };

  const deleteProgram = async (id) => {
    if (!window.confirm('Delete this program? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_URL}/api/admin/programs/${id}`, authConfig());
      toast.success('Program deleted');
      fetchPrograms();
    } catch { toast.error('Failed to delete'); }
  };

  const TABS = [
    { id: 'enquiries', label: 'Express Interest', badge: pendingCount },
    { id: 'programs', label: 'Manage Programs' },
  ];

  return (
    <div className="space-y-6" data-testid="programs-manager">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Programs & Courses</h2>
          <p className="text-sm text-gray-500 mt-1">{programs.length} programs, {enquiryPagination.total} total enquiries</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { fetchPrograms(); fetchEnquiries(); }} className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={() => { setEditingProgram(null); setShowProgramForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors" data-testid="add-program-btn">
            <Plus className="w-4 h-4" /> Add Program
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`} data-testid={`tab-${t.id}`}>
            {t.label}
            {t.badge > 0 && <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{t.badge}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" /></div>
      ) : tab === 'enquiries' ? (
        <EnquiriesTab
          enquiries={enquiries}
          programs={programs}
          filter={enquiryFilter}
          setFilter={(f) => { setEnquiryFilter(f); }}
          programFilter={programFilter}
          setProgramFilter={setProgramFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          pagination={enquiryPagination}
          onPageChange={(p) => fetchEnquiries(p)}
          onUpdateStatus={updateEnquiryStatus}
        />
      ) : (
        <ProgramsTab programs={programs} onDelete={deleteProgram} onEdit={(p) => { setEditingProgram(p); setShowProgramForm(true); }} />
      )}

      {/* Program Form Modal */}
      {showProgramForm && (
        <ProgramFormModal
          program={editingProgram}
          onClose={() => { setShowProgramForm(false); setEditingProgram(null); }}
          onSave={() => { setShowProgramForm(false); setEditingProgram(null); fetchPrograms(); }}
        />
      )}
    </div>
  );
};

/* ── Enquiries Tab ── */
function EnquiriesTab({ enquiries, programs, filter, setFilter, programFilter, setProgramFilter, searchTerm, setSearchTerm, pagination, onPageChange, onUpdateStatus }) {
  const filtered = enquiries.filter(e => {
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return e.name?.toLowerCase().includes(s) || e.email?.toLowerCase().includes(s) || e.phone?.includes(s);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {['all', 'new', 'contacted', 'enrolled', 'rejected'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${filter === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`} data-testid={`filter-${s}`}>
              {s}
            </button>
          ))}
        </div>
        <select value={programFilter} onChange={e => setProgramFilter(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 outline-none">
          <option value="all">All Programs</option>
          {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by name, email, phone..." className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-400" data-testid="enquiry-search" />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-500">No enquiries found</p>
          <p className="text-sm text-gray-400 mt-1">Interest submissions will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="enquiries-table">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Program</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Grade</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">School</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((e, idx) => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors" data-testid={`enquiry-row-${idx}`}>
                    <td className="px-4 py-3 text-sm text-gray-500">{(pagination.page - 1) * 20 + idx + 1}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">{e.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700">{e.email}</p>
                      {e.phone && <p className="text-xs text-gray-400">{e.phone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">{e.program_title}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{e.grade || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[150px] truncate">{e.school_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[e.status] || 'bg-gray-100 text-gray-600'}`}>{e.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {e.status !== 'contacted' && (
                          <button onClick={() => onUpdateStatus(e.id, 'contacted')} title="Mark Contacted" className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors" data-testid={`mark-contacted-${idx}`}>
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {e.status !== 'enrolled' && (
                          <button onClick={() => onUpdateStatus(e.id, 'enrolled')} title="Mark Enrolled" className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors" data-testid={`mark-enrolled-${idx}`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {e.status !== 'rejected' && (
                          <button onClick={() => onUpdateStatus(e.id, 'rejected')} title="Reject" className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" data-testid={`mark-rejected-${idx}`}>
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {pagination.total > 20 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <span className="text-xs text-gray-500">Showing {(pagination.page - 1) * 20 + 1}–{Math.min(pagination.page * 20, pagination.total)} of {pagination.total}</span>
              <div className="flex gap-1">
                <button disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)} className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40">Prev</button>
                <button disabled={pagination.page * 20 >= pagination.total} onClick={() => onPageChange(pagination.page + 1)} className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Programs Tab ── */
function ProgramsTab({ programs, onDelete, onEdit }) {
  return (
    <div className="space-y-4">
      {programs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-500">No programs yet</p>
        </div>
      ) : (
        <div className="grid gap-4" data-testid="programs-list">
          {programs.map(p => {
            const cfg = DOMAIN_CONFIG[p.domain] || DOMAIN_CONFIG.competition;
            const Icon = cfg.icon;
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" data-testid={`program-row-${p.id}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}><Icon className="w-3 h-3" /> {cfg.label}</span>
                    <span className="text-xs text-gray-400">Grade {p.grade_min}–{p.grade_max}</span>
                    {p.is_enrolling ? <span className="text-xs font-medium text-emerald-600">Enrolling</span> : <span className="text-xs font-medium text-gray-400">Closed</span>}
                  </div>
                  <h3 className="font-bold text-gray-900 truncate">{p.title}</h3>
                  <p className="text-sm text-gray-500 truncate">{p.short_description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {p.duration}</span>
                    {p.seats_left != null && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {p.seats_left}/{p.seats_total} seats</span>}
                    {p.price && <span className="font-medium text-gray-600">Rs. {p.price}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => onEdit(p)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" title="Edit" data-testid={`edit-program-${p.id}`}><Edit2 className="w-4 h-4 text-gray-600" /></button>
                  <button onClick={() => onDelete(p.id)} className="p-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Delete" data-testid={`delete-program-${p.id}`}><Trash2 className="w-4 h-4 text-red-600" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Program Form Modal ── */
function ProgramFormModal({ program, onClose, onSave }) {
  const [form, setForm] = useState({
    title: '', short_description: '', full_description: '', domain: 'ai_tech',
    grade_min: 8, grade_max: 12, duration: '', price: '', seats_total: '',
    seats_left: '', mentor_name: '', mentor_credentials: '',
    highlights: '', what_you_build: '', related_exams: '',
    is_active: true, is_enrolling: true,
    ...(program ? {
      ...program,
      highlights: (program.highlights || []).join('\n'),
      what_you_build: (program.what_you_build || []).join('\n'),
      related_exams: (program.related_exams || []).join(', '),
      seats_total: program.seats_total || '',
      seats_left: program.seats_left || '',
      price: program.price || '',
    } : {})
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.short_description) { toast.error('Title and description required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        grade_min: parseInt(form.grade_min),
        grade_max: parseInt(form.grade_max),
        seats_total: form.seats_total ? parseInt(form.seats_total) : null,
        seats_left: form.seats_left ? parseInt(form.seats_left) : null,
        price: form.price || null,
        highlights: form.highlights ? form.highlights.split('\n').filter(Boolean) : [],
        what_you_build: form.what_you_build ? form.what_you_build.split('\n').filter(Boolean) : [],
        related_exams: form.related_exams ? form.related_exams.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      if (program) {
        await axios.put(`${API_URL}/api/admin/programs/${program.id}`, payload, authConfig());
        toast.success('Program updated');
      } else {
        await axios.post(`${API_URL}/api/admin/programs`, payload, authConfig());
        toast.success('Program created');
      }
      onSave();
    } catch { toast.error('Failed to save program'); }
    finally { setSaving(false); }
  };

  const Field = ({ label, name, type = 'text', ...props }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {type === 'textarea' ? (
        <textarea value={form[name]} onChange={e => setForm(f => ({...f, [name]: e.target.value}))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-400 resize-y" rows={3} {...props} />
      ) : type === 'select' ? (
        <select value={form[name]} onChange={e => setForm(f => ({...f, [name]: e.target.value}))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-400" {...props}>
          {props.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : type === 'checkbox' ? (
        <input type="checkbox" checked={form[name]} onChange={e => setForm(f => ({...f, [name]: e.target.checked}))} className="w-4 h-4 text-violet-600 rounded" {...props} />
      ) : (
        <input type={type} value={form[name]} onChange={e => setForm(f => ({...f, [name]: e.target.value}))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-400" {...props} />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => !saving && onClose()}>
      <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl my-8" data-testid="program-form-modal">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">{program ? 'Edit Program' : 'Add New Program'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <Field label="Title" name="title" required placeholder="e.g. AI & Innovation Bootcamp" />
          <Field label="Short Description" name="short_description" type="textarea" required placeholder="One-liner for the card" />
          <Field label="Full Description" name="full_description" type="textarea" placeholder="Detailed program overview" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="Domain" name="domain" type="select" options={[
              { value: 'competition', label: 'Competition' }, { value: 'research', label: 'Research' },
              { value: 'entrepreneurship', label: 'Internship' }, { value: 'ai_tech', label: 'AI & Tech' },
              { value: 'healthcare', label: 'Healthcare' }, { value: 'summer', label: 'Summer' },
            ]} />
            <Field label="Grade Min" name="grade_min" type="number" />
            <Field label="Grade Max" name="grade_max" type="number" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="Duration" name="duration" placeholder="e.g. 4 Weeks" />
            <Field label="Price (Rs)" name="price" placeholder="e.g. 4,999 or leave empty for free" />
            <Field label="Total Seats" name="seats_total" type="number" />
          </div>
          <Field label="Seats Left" name="seats_left" type="number" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Mentor Name" name="mentor_name" placeholder="Dr. Priya Sharma" />
            <Field label="Mentor Credentials" name="mentor_credentials" placeholder="PhD IIT Delhi" />
          </div>
          <Field label="Highlights (one per line)" name="highlights" type="textarea" placeholder="Hands-on AI project&#10;Certificate of completion" />
          <Field label="What You'll Build (one per line)" name="what_you_build" type="textarea" placeholder="AI-powered web app&#10;Chatbot prototype" />
          <Field label="Related Exams (comma separated)" name="related_exams" placeholder="JEE, NEET, UPSC" />
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} className="w-4 h-4 text-violet-600 rounded" /> Active</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_enrolling} onChange={e => setForm(f => ({...f, is_enrolling: e.target.checked}))} className="w-4 h-4 text-violet-600 rounded" /> Enrolling</label>
          </div>
        </form>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60" data-testid="save-program-btn">
            {saving ? 'Saving...' : program ? 'Update Program' : 'Create Program'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProgramsManager;
