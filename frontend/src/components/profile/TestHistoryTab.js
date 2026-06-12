import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  ClipboardList, Swords, Clock, ChevronDown, ChevronUp, Trash2, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = window.location.origin;
const PAGE_SIZE = 10;

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'solo', label: 'Solo' },
  { key: 'battles', label: 'Battles' },
];

const scoreStyle = (pct) => {
  if (pct >= 75) return 'bg-green-50 text-green-700 border-green-200';
  if (pct >= 40) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-600 border-red-200';
};

const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const fmtDuration = (secs) => {
  if (!secs) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const StatPill = ({ label, value }) => (
  <div className="text-center">
    <p className="text-sm font-bold text-gray-900">{value}</p>
    <p className="text-[10px] text-gray-500">{label}</p>
  </div>
);

const AttemptCard = ({ entry, onDelete }) => {
  const [open, setOpen] = useState(false);
  const pct = entry.percentage ?? 0;
  const duration = fmtDuration(entry.time_spent_seconds);
  const hasDetails = (entry.topic_breakdown || []).length > 0 || entry.questions_attempted > 0;

  return (
    <div data-testid={`test-history-card-${entry.id}`} className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        data-testid={`test-history-toggle-${entry.id}`}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${entry.is_battle ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
          {entry.is_battle ? <Swords className="w-4 h-4" /> : <ClipboardList className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{entry.test_name}</p>
          <p className="text-xs text-gray-500 truncate">
            {entry.subject} · {entry.exam_category} · {fmtDate(entry.completed_at)}
            {duration && <> · <Clock className="w-3 h-3 inline -mt-0.5" /> {duration}</>}
          </p>
        </div>
        <span
          data-testid={`test-history-score-${entry.id}`}
          className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${scoreStyle(pct)}`}
        >
          {pct}%
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/60" data-testid={`test-history-detail-${entry.id}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-600">
              Marks: <span className="font-semibold text-gray-900">{entry.marks_obtained} / {entry.total_marks}</span>
            </p>
            {entry.is_battle && entry.opponent_user_id && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">vs opponent</span>
            )}
          </div>
          {hasDetails && (
            <div className="grid grid-cols-5 gap-2 mb-3">
              <StatPill label="Total" value={entry.questions_total} />
              <StatPill label="Attempted" value={entry.questions_attempted} />
              <StatPill label="Correct" value={entry.questions_correct} />
              <StatPill label="Wrong" value={entry.questions_wrong} />
              <StatPill label="Skipped" value={entry.questions_skipped} />
            </div>
          )}
          {(entry.topic_breakdown || []).length > 0 && (
            <div className="space-y-1.5 mb-3">
              {entry.topic_breakdown.map((t, i) => (
                <div key={`${t.topic}-${i}`} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border border-gray-100">
                  <span className="font-medium text-gray-800 truncate">{t.topic}</span>
                  <span className="text-gray-500 shrink-0 ml-2">{t.questions_correct}/{t.questions_total} correct</span>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => onDelete(entry.id)}
            data-testid={`test-history-delete-${entry.id}`}
            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete attempt
          </button>
        </div>
      )}
    </div>
  );
};

const TestHistoryTab = () => {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(async (filterKey, pageNum, append) => {
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const params = { page: pageNum, page_size: PAGE_SIZE };
      if (filterKey === 'battles') params.is_battle = true;
      if (filterKey === 'solo') params.is_battle = false;
      const res = await axios.get(`${BACKEND_URL}/api/test-history/`, { params });
      if (res.data.success) {
        setItems(prev => (append ? [...prev, ...res.data.items] : res.data.items));
        setTotalPages(res.data.total_pages);
        setTotal(res.data.total);
        setPage(pageNum);
      }
    } catch {
      if (!append) setItems([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchPage(filter, 1, false); }, [filter, fetchPage]);

  const handleDelete = async (entryId) => {
    try {
      await axios.delete(`${BACKEND_URL}/api/test-history/${entryId}`);
      setItems(prev => prev.filter(i => i.id !== entryId));
      setTotal(prev => Math.max(0, prev - 1));
      toast.success('Attempt deleted');
    } catch {
      toast.error('Could not delete attempt');
    }
  };

  return (
    <div className="bg-white p-4" data-testid="test-history-tab">
      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-4">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            data-testid={`test-history-filter-${f.key}`}
            className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-colors ${
              filter === f.key
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
            }`}
          >
            {f.label}
          </button>
        ))}
        {total > 0 && (
          <span className="ml-auto text-xs text-gray-400" data-testid="test-history-total">{total} attempt{total === 1 ? '' : 's'}</span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12" data-testid="test-history-loading">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400" data-testid="test-history-empty">
          <ClipboardList className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">No test attempts yet</p>
          <p className="text-xs mt-1">Complete a practice quiz or battle — it'll show up here</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map(entry => (
            <AttemptCard key={entry.id} entry={entry} onDelete={handleDelete} />
          ))}
          {page < totalPages && (
            <button
              onClick={() => fetchPage(filter, page + 1, true)}
              disabled={loadingMore}
              data-testid="test-history-load-more"
              className="w-full py-2.5 text-xs font-semibold text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-50"
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TestHistoryTab;
