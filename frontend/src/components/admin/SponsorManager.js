import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Edit, Trash2, Search, Link as LinkIcon, 
  Layers, BarChart2, Calendar, FileText, Globe, Check
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

const normalizeScopeSegment = (value) => {
  return (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[\s_/]+/g, '-')
    .replace(/[^a-z0-9()\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const extractClassNumber = (className) => {
  const match = (className || '').match(/(\d+)/);
  return match ? match[1] : '';
};

const extractStream = (className) => {
  const lowered = (className || '').toLowerCase();
  if (lowered.includes('science')) return 'science';
  if (lowered.includes('commerce')) return 'commerce';
  if (lowered.includes('humanities')) return 'humanities';
  return '';
};

const SponsorManager = () => {
  const [activeTab, setActiveTab] = useState('sponsors');
  const [sponsors, setSponsors] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [scopeOptions, setScopeOptions] = useState([]);
  const [scopeMode, setScopeMode] = useState('board');
  const [boardClassSubjects, setBoardClassSubjects] = useState({});
  const [loadingBoardScopes, setLoadingBoardScopes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [saving, setSaving] = useState(false);

  // Forms
  const [sponsorForm, setSponsorForm] = useState({
    name: '',
    logo_url: '',
    link_url: '',
    description: '',
    active_from: '',
    active_to: ''
  });

  const [assignmentForm, setAssignmentForm] = useState({
    sponsor_id: '',
    scope_key: ''
  });

  const [boardScopeForm, setBoardScopeForm] = useState({
    board: 'cbse',
    class_name: '',
    subject: '',
    chapter: '',
    level: 'chapter'
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (scopeMode !== 'board') return;
    fetchBoardClassSubjects(boardScopeForm.board);
  }, [scopeMode, boardScopeForm.board]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sponRes, assignRes, scopeRes] = await Promise.allSettled([
        axios.get(`${BACKEND_URL}/api/sponsors`),
        axios.get(`${BACKEND_URL}/api/sponsors/assignments`),
        axios.get(`${BACKEND_URL}/api/sponsors/scopes`)
      ]);

      const sponsorsLoaded = sponRes.status === 'fulfilled' && sponRes.value.data.success;
      const assignmentsLoaded = assignRes.status === 'fulfilled' && assignRes.value.data.success;

      if (!sponsorsLoaded || !assignmentsLoaded) {
        throw new Error('Required sponsor endpoints failed');
      }

      setSponsors(sponRes.value.data.sponsors || []);
      setAssignments(assignRes.value.data.assignments || []);

      if (scopeRes.status === 'fulfilled' && scopeRes.value.data.success) {
        setScopeOptions(scopeRes.value.data.scopes || []);
      } else {
        setScopeOptions([]);
        console.warn('Sponsor scope catalog unavailable:', scopeRes.status === 'rejected' ? scopeRes.reason : scopeRes.value);
      }
    } catch (err) {
      console.error('Error fetching sponsors data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBoardClassSubjects = async (board) => {
    if (!board) return;
    setLoadingBoardScopes(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/cbse-data/admin/class-subjects?board=${board}`);
      if (response.data.success) {
        setBoardClassSubjects(response.data.class_subjects || {});
      } else {
        setBoardClassSubjects({});
      }
    } catch (err) {
      console.error('Error fetching board class-subjects for sponsor scopes:', err);
      setBoardClassSubjects({});
      toast.error('Failed to load board chapters for assignment');
    } finally {
      setLoadingBoardScopes(false);
    }
  };

  const handleCreateSponsor = async (e) => {
    e.preventDefault();
    if (!sponsorForm.name || !sponsorForm.logo_url || !sponsorForm.link_url) {
      toast.error('Name, logo URL, and link URL are required');
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/sponsors`, sponsorForm);
      if (res.data.success) {
        toast.success('Sponsor created successfully');
        setShowAddModal(false);
        setSponsorForm({ name: '', logo_url: '', link_url: '', description: '', active_from: '', active_to: '' });
        fetchData();
      }
    } catch (err) {
      console.error('Error creating sponsor:', err);
      toast.error('Failed to create sponsor');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSponsor = (sponsor) => {
    setSelectedSponsor(sponsor);
    setSponsorForm({
      name: sponsor.name,
      logo_url: sponsor.logo_url,
      link_url: sponsor.link_url,
      description: sponsor.description || '',
      active_from: sponsor.active_from || '',
      active_to: sponsor.active_to || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateSponsor = async (e) => {
    e.preventDefault();
    if (!selectedSponsor) return;
    setSaving(true);
    try {
      const res = await axios.put(`${BACKEND_URL}/api/sponsors/${selectedSponsor.id}`, sponsorForm);
      if (res.data.success) {
        toast.success('Sponsor updated successfully');
        setShowEditModal(false);
        fetchData();
      }
    } catch (err) {
      console.error('Error updating sponsor:', err);
      toast.error('Failed to update sponsor');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSponsor = async (sponsorId) => {
    if (!window.confirm('Are you sure you want to delete this sponsor? All associated assignments will also be deleted.')) return;
    try {
      const res = await axios.delete(`${BACKEND_URL}/api/sponsors/${sponsorId}`);
      if (res.data.success) {
        toast.success('Sponsor deleted');
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting sponsor:', err);
      toast.error('Failed to delete sponsor');
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentForm.sponsor_id) {
      toast.error('Sponsor is required');
      return;
    }

    let scopeKey = assignmentForm.scope_key;
    if (scopeMode === 'board') {
      const classNumber = extractClassNumber(boardScopeForm.class_name);
      const stream = extractStream(boardScopeForm.class_name);
      const baseParts = [
        boardScopeForm.board,
        classNumber ? `class-${classNumber}` : ''
      ];
      if (stream) baseParts.push(stream);

      if (boardScopeForm.level === 'board') {
        scopeKey = normalizeScopeSegment(boardScopeForm.board);
      } else if (boardScopeForm.level === 'class') {
        if (!classNumber) {
          toast.error('Select class for class-level assignment');
          return;
        }
        scopeKey = baseParts.map(normalizeScopeSegment).filter(Boolean).join('-');
      } else if (boardScopeForm.level === 'subject') {
        if (!classNumber || !boardScopeForm.subject) {
          toast.error('Select class and subject for subject-level assignment');
          return;
        }
        scopeKey = [...baseParts, boardScopeForm.subject].map(normalizeScopeSegment).filter(Boolean).join('-');
      } else {
        if (!classNumber || !boardScopeForm.subject || !boardScopeForm.chapter) {
          toast.error('Select class, subject, and chapter for chapter-level assignment');
          return;
        }
        scopeKey = [...baseParts, boardScopeForm.subject, boardScopeForm.chapter].map(normalizeScopeSegment).filter(Boolean).join('-');
      }
    }

    if (!scopeKey) {
      toast.error('Scope key is required');
      return;
    }

    try {
      const res = await axios.post(`${BACKEND_URL}/api/sponsors/assignments`, {
        sponsor_id: assignmentForm.sponsor_id,
        scope_key: scopeKey
      });
      if (res.data.success) {
        toast.success('Assignment created');
        setAssignmentForm({ sponsor_id: '', scope_key: '' });
        setBoardScopeForm(prev => ({ ...prev, class_name: '', subject: '', chapter: '', level: 'chapter' }));
        fetchData();
      }
    } catch (err) {
      console.error('Error creating assignment:', err);
      toast.error('Failed to assign sponsor');
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      const res = await axios.delete(`${BACKEND_URL}/api/sponsors/assignments/${assignmentId}`);
      if (res.data.success) {
        toast.success('Assignment deleted');
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting assignment:', err);
      toast.error('Failed to delete assignment');
    }
  };

  const filteredSponsors = sponsors.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const examScopeOptions = scopeOptions.filter(option => option.group !== 'Boards');
  const examScopeGroups = examScopeOptions.reduce((groups, option) => {
    if (!groups[option.group]) groups[option.group] = [];
    groups[option.group].push(option);
    return groups;
  }, {});

  const classOptions = Object.keys(boardClassSubjects || {}).sort((a, b) => a.localeCompare(b));
  const subjectOptions = (boardClassSubjects[boardScopeForm.class_name] ? Object.keys(boardClassSubjects[boardScopeForm.class_name]) : []).sort((a, b) => a.localeCompare(b));
  const chapterOptions = (boardClassSubjects[boardScopeForm.class_name]?.[boardScopeForm.subject] || []).slice();

  const selectedExamScope = examScopeOptions.find(option => option.key === assignmentForm.scope_key);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b-2 border-black pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sponsor Manager</h2>
          <p className="text-slate-500 text-sm">Manage educational sponsorships, scope assignments, and view impressions/clicks.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSponsorForm({ name: '', logo_url: '', link_url: '', description: '', active_from: '', active_to: '' });
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 border-2 border-black rounded-lg shadow-[2px_2px_0px_#000] hover:shadow-[4px_4px_0px_#000] hover:-translate-y-0.5 transition-all text-sm"
          >
            <Plus className="w-4 h-4" /> Add Sponsor
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-slate-200">
        <button
          onClick={() => setActiveTab('sponsors')}
          className={`px-4 py-2 font-bold text-sm border-b-4 -mb-1 transition-all ${
            activeTab === 'sponsors' 
              ? 'border-purple-600 text-purple-600' 
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Sponsors ({sponsors.length})
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2 font-bold text-sm border-b-4 -mb-1 transition-all ${
            activeTab === 'assignments' 
              ? 'border-purple-600 text-purple-600' 
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Assignments ({assignments.length})
        </button>
      </div>

      {/* Sponsors Tab */}
      {activeTab === 'sponsors' && (
        <div className="space-y-4">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl max-w-md focus-within:ring-2 focus-within:ring-violet-400 transition">
            <div className="pl-4 pr-2 flex items-center justify-center text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search sponsors..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent py-2.5 pr-4 text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          {loading ? (
            <div className="text-center py-10 text-slate-500">Loading sponsors...</div>
          ) : filteredSponsors.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500">
              No sponsors found. Add a sponsor to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSponsors.map(sponsor => (
                <div 
                  key={sponsor.id} 
                  className="bg-white border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_#000] hover:shadow-[5px_5px_0px_#000] hover:-translate-y-0.5 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {sponsor.logo_url ? (
                        <img src={sponsor.logo_url} alt={sponsor.name} className="max-w-full max-h-full object-contain" />
                      ) : (
                        <Globe className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleEditSponsor(sponsor)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-700 transition-colors"
                        title="Edit Sponsor"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSponsor(sponsor.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded text-rose-600 transition-colors"
                        title="Delete Sponsor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 leading-tight">{sponsor.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 truncate max-w-full" title={sponsor.link_url}>
                      <a href={sponsor.link_url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline flex items-center gap-1">
                        <LinkIcon className="w-3 h-3 inline" /> Visit Link
                      </a>
                    </p>
                  </div>
                  {sponsor.description && (
                    <p className="text-xs text-slate-600 line-clamp-2">{sponsor.description}</p>
                  )}
                  {(sponsor.active_from || sponsor.active_to) && (
                    <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-2 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Active: {sponsor.active_from ? new Date(sponsor.active_from).toLocaleDateString() : 'Start'} 
                        {' → '} 
                        {sponsor.active_to ? new Date(sponsor.active_to).toLocaleDateString() : 'Endless'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">New Sponsorship Assignment</h3>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Sponsor</label>
                <select
                  value={assignmentForm.sponsor_id}
                  onChange={e => setAssignmentForm(a => ({ ...a, sponsor_id: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-700"
                >
                  <option value="">-- Choose Sponsor --</option>
                  {sponsors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Scope Source</label>
                <select
                  value={scopeMode}
                  onChange={e => setScopeMode(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-700"
                >
                  <option value="board">Board Chapters (CBSE/RBSE/HBSE/UP/BSEB/MPBSE)</option>
                  <option value="exam">Exams & Topics</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Apply to Scope Key</label>
                {scopeMode === 'exam' ? (
                  <select
                    required
                    value={assignmentForm.scope_key}
                    onChange={e => setAssignmentForm(a => ({ ...a, scope_key: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-700"
                  >
                    <option value="">-- Choose Exam Scope --</option>
                    {Object.entries(examScopeGroups).map(([groupName, groupOptions]) => (
                      <optgroup key={groupName} label={groupName}>
                        {groupOptions.map(option => (
                          <option key={option.key} value={option.key}>{option.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-slate-500 py-2 px-3 bg-white border border-slate-200 rounded-lg">
                    Use the clean Board → Class → Subject → Chapter selectors below.
                  </div>
                )}
              </div>
              </div>

              {scopeMode === 'board' && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Board</label>
                    <select
                      value={boardScopeForm.board}
                      onChange={e => setBoardScopeForm(b => ({ ...b, board: e.target.value, class_name: '', subject: '', chapter: '' }))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-700"
                    >
                      <option value="cbse">CBSE</option>
                      <option value="rbse">Rajasthan Board (RBSE)</option>
                      <option value="hbse">Haryana Board (HBSE)</option>
                      <option value="upboard">UP Board</option>
                      <option value="bseb">Bihar Board (BSEB)</option>
                      <option value="mpbse">MP Board (MPBSE)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Class</label>
                    <select
                      value={boardScopeForm.class_name}
                      onChange={e => setBoardScopeForm(b => ({ ...b, class_name: e.target.value, subject: '', chapter: '' }))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-700"
                    >
                      <option value="">-- Choose Class --</option>
                      {classOptions.map(className => <option key={className} value={className}>{className}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Subject</label>
                    <select
                      value={boardScopeForm.subject}
                      onChange={e => setBoardScopeForm(b => ({ ...b, subject: e.target.value, chapter: '' }))}
                      disabled={!boardScopeForm.class_name}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-700 disabled:bg-slate-100"
                    >
                      <option value="">-- Choose Subject --</option>
                      {subjectOptions.map(subject => <option key={subject} value={subject}>{subject}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Chapter</label>
                    <select
                      value={boardScopeForm.chapter}
                      onChange={e => setBoardScopeForm(b => ({ ...b, chapter: e.target.value }))}
                      disabled={!boardScopeForm.subject}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-700 disabled:bg-slate-100"
                    >
                      <option value="">-- Choose Chapter --</option>
                      {chapterOptions.map((chapter, idx) => <option key={`${chapter}-${idx}`} value={chapter}>{chapter}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Assign Level</label>
                    <select
                      value={boardScopeForm.level}
                      onChange={e => setBoardScopeForm(b => ({ ...b, level: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-700"
                    >
                      <option value="board">Board</option>
                      <option value="class">Class</option>
                      <option value="subject">Subject</option>
                      <option value="chapter">Chapter</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2 min-h-[2.5rem] rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  {scopeMode === 'exam' ? (
                    selectedExamScope ? (
                      <>
                        <div className="font-semibold text-slate-800">{selectedExamScope.label}</div>
                        <div className="mt-0.5 text-slate-500">Key: {selectedExamScope.key}</div>
                      </>
                    ) : (
                      'Choose exam scope from the catalog.'
                    )
                  ) : (
                    loadingBoardScopes
                      ? 'Loading board chapter scopes...'
                      : 'Board scopes are synced from Class Chapters + Exam Sheets APIs, so new chapters reflect automatically.'
                  )}
                </div>

                <div>
                <button
                  type="submit"
                  className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2.5 border-2 border-black rounded-lg shadow-[2px_2px_0px_#000] hover:shadow-[4px_4px_0px_#000] hover:-translate-y-0.5 transition-all text-sm flex items-center justify-center gap-1.5"
                >
                  <Layers className="w-4 h-4" /> Create Assignment
                </button>
              </div>
              </div>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Active Assignments</h3>
            </div>
            {assignments.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No sponsorships assigned yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-100">
                      <th className="px-5 py-3">Sponsor</th>
                      <th className="px-5 py-3">Scope</th>
                      <th className="px-5 py-3">Impressions</th>
                      <th className="px-5 py-3">Clicks</th>
                      <th className="px-5 py-3">CTR</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assignments.map(a => {
                      const ctr = a.impressions > 0 ? ((a.clicks / a.impressions) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3 flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {a.sponsor_logo_url ? (
                                <img src={a.sponsor_logo_url} alt="" className="max-w-full max-h-full object-contain" />
                              ) : (
                                <Globe className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <span className="font-semibold text-slate-900">{a.sponsor_name || 'Deleted Sponsor'}</span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="space-y-1">
                              <div className="text-sm font-semibold text-slate-900">{a.scope_label || a.scope_key}</div>
                              <span className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-slate-800">
                                {a.scope_key}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-sm font-medium text-slate-700">{a.impressions.toLocaleString()}</td>
                          <td className="px-5 py-3 text-sm font-medium text-slate-700">{a.clicks.toLocaleString()}</td>
                          <td className="px-5 py-3 text-sm font-medium text-purple-600">{ctr}%</td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => handleDeleteAssignment(a.id)}
                              className="p-1.5 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded text-rose-600 transition-colors"
                              title="Delete Assignment"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Sponsor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md border-2 border-black rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-purple-600 p-5 text-white border-b-2 border-black">
              <h3 className="font-bold text-lg">Add New Sponsor</h3>
              <p className="text-xs text-white/80">Configure sponsor profile and campaign lifetime.</p>
            </div>
            <form onSubmit={handleCreateSponsor} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Sponsor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Allen Defence Academy"
                  value={sponsorForm.name}
                  onChange={e => setSponsorForm(s => ({ ...s, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Logo Image URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/logo.png"
                  value={sponsorForm.logo_url}
                  onChange={e => setSponsorForm(s => ({ ...s, logo_url: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Destination Link URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/target-landing-page"
                  value={sponsorForm.link_url}
                  onChange={e => setSponsorForm(s => ({ ...s, link_url: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Description (Optional)</label>
                <textarea
                  placeholder="Short tagline or promo description"
                  value={sponsorForm.description}
                  onChange={e => setSponsorForm(s => ({ ...s, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Active From</label>
                  <input
                    type="date"
                    value={sponsorForm.active_from}
                    onChange={e => setSponsorForm(s => ({ ...s, active_from: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none text-slate-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Active To</label>
                  <input
                    type="date"
                    value={sponsorForm.active_to}
                    onChange={e => setSponsorForm(s => ({ ...s, active_to: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none text-slate-600"
                  />
                </div>
              </div>
              <div className="flex gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 border-2 border-black rounded-xl font-bold text-slate-800 text-sm hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-purple-600 text-white font-bold text-sm border-2 border-black rounded-xl shadow-[2px_2px_0px_#000] hover:shadow-[4px_4px_0px_#000] hover:-translate-y-0.5 transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {saving ? 'Creating...' : <><Check className="w-4 h-4" /> Save Sponsor</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Sponsor Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md border-2 border-black rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-purple-600 p-5 text-white border-b-2 border-black">
              <h3 className="font-bold text-lg">Edit Sponsor</h3>
              <p className="text-xs text-white/80">Modify sponsor profile or active range contract.</p>
            </div>
            <form onSubmit={handleUpdateSponsor} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Sponsor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Allen Defence Academy"
                  value={sponsorForm.name}
                  onChange={e => setSponsorForm(s => ({ ...s, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Logo Image URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/logo.png"
                  value={sponsorForm.logo_url}
                  onChange={e => setSponsorForm(s => ({ ...s, logo_url: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Destination Link URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/target-landing-page"
                  value={sponsorForm.link_url}
                  onChange={e => setSponsorForm(s => ({ ...s, link_url: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Description (Optional)</label>
                <textarea
                  placeholder="Short tagline or promo description"
                  value={sponsorForm.description}
                  onChange={e => setSponsorForm(s => ({ ...s, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Active From</label>
                  <input
                    type="date"
                    value={sponsorForm.active_from}
                    onChange={e => setSponsorForm(s => ({ ...s, active_from: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none text-slate-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Active To</label>
                  <input
                    type="date"
                    value={sponsorForm.active_to}
                    onChange={e => setSponsorForm(s => ({ ...s, active_to: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none text-slate-600"
                  />
                </div>
              </div>
              <div className="flex gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 border-2 border-black rounded-xl font-bold text-slate-800 text-sm hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-purple-600 text-white font-bold text-sm border-2 border-black rounded-xl shadow-[2px_2px_0px_#000] hover:shadow-[4px_4px_0px_#000] hover:-translate-y-0.5 transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {saving ? 'Updating...' : <><Check className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SponsorManager;
