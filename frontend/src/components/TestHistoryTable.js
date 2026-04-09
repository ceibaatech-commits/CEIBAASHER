import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Trophy, Target, TrendingUp, Zap, X } from 'lucide-react';

/* ── Pill Toggle ── */
function PillToggle({ label, options, selected, onChange }) {
  const toggle = (val) => {
    const next = new Set(selected);
    if (next.has(val)) next.delete(val); else next.add(val);
    onChange(next);
  };
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map(o => (
          <button
            key={o}
            onClick={() => toggle(o)}
            data-testid={`pill-${label}-${o}`}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
              selected.has(o)
                ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {o}
          </button>
        ))}
        {selected.size > 0 && (
          <button onClick={() => onChange(new Set())} className="px-2 py-1 text-xs text-slate-400 hover:text-slate-600"><X className="w-3 h-3 inline" /> Clear</button>
        )}
      </div>
    </div>
  );
}

/* ── Accuracy Bar ── */
function AccuracyBar({ value }) {
  const color = value >= 85 ? 'bg-emerald-500' : value >= 65 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = value >= 85 ? 'text-emerald-700' : value >= 65 ? 'text-amber-700' : 'text-red-700';
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className={`text-xs font-bold tabular-nums ${textColor}`}>{value}%</span>
    </div>
  );
}

/* ── Sort Header ── */
function SortHeader({ column, children }) {
  const sorted = column.getIsSorted();
  return (
    <button onClick={column.getToggleSortingHandler()} className="flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-800 transition-colors group" data-testid={`sort-${column.id}`}>
      {children}
      {sorted === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-violet-600" /> : sorted === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-violet-600" /> : <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />}
    </button>
  );
}

/* ── Column Definitions ── */
const columns = [
  {
    accessorKey: 'date',
    header: ({ column }) => <SortHeader column={column}>Date</SortHeader>,
    cell: ({ getValue }) => {
      const v = getValue();
      if (!v) return <span className="text-slate-400">—</span>;
      const d = new Date(v);
      return (
        <div className="text-sm">
          <p className="font-medium text-slate-900">{d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
          <p className="text-xs text-slate-400">{d.toLocaleDateString('en-IN', { year: 'numeric' })}</p>
        </div>
      );
    },
    sortingFn: 'datetime',
  },
  {
    accessorKey: 'exam',
    header: 'Exam',
    cell: ({ getValue }) => <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">{getValue()}</span>,
    filterFn: (row, id, filterValues) => filterValues.size === 0 || filterValues.has(row.getValue(id)),
  },
  {
    accessorKey: 'subject',
    header: ({ column }) => <SortHeader column={column}>Subject</SortHeader>,
    cell: ({ row }) => (
      <div>
        <p className="text-sm font-medium text-slate-900">{row.original.subject}</p>
        {row.original.topic && <p className="text-xs text-slate-400 truncate max-w-[150px]">{row.original.topic}</p>}
      </div>
    ),
    filterFn: (row, id, filterValues) => filterValues.size === 0 || filterValues.has(row.getValue(id)),
  },
  {
    accessorKey: 'score',
    header: ({ column }) => <SortHeader column={column}>Score</SortHeader>,
    cell: ({ getValue }) => <span className="text-sm font-bold text-slate-900 tabular-nums">{getValue()}%</span>,
  },
  {
    accessorKey: 'accuracy',
    header: ({ column }) => <SortHeader column={column}>Accuracy</SortHeader>,
    cell: ({ getValue }) => <AccuracyBar value={getValue()} />,
  },
  {
    id: 'questions',
    header: 'Questions',
    cell: ({ row }) => {
      const { total_questions: t, correct: c, wrong: w, skipped: s } = row.original;
      return (
        <div className="flex items-center gap-1.5 text-xs tabular-nums">
          <span className="text-slate-500 font-medium">{t}</span>
          <span className="text-slate-300">&middot;</span>
          <span className="text-emerald-600 font-semibold">{c} &#10003;</span>
          <span className="text-slate-300">&middot;</span>
          <span className="text-red-500 font-semibold">{w} &#10007;</span>
          {s > 0 && <><span className="text-slate-300">&middot;</span><span className="text-slate-400">{s} skip</span></>}
        </div>
      );
    },
  },
  {
    accessorKey: 'rank',
    header: ({ column }) => <SortHeader column={column}>Rank</SortHeader>,
    cell: ({ row }) => {
      const r = row.original.rank;
      const p = row.original.percentile;
      if (!r && !p) return <span className="text-slate-300">—</span>;
      return (
        <div className="text-center">
          {r && <p className="text-sm font-bold text-slate-900">#{r}</p>}
          {p != null && <p className="text-xs text-violet-600 font-medium">Top {p}%</p>}
        </div>
      );
    },
  },
  {
    accessorKey: 'xp',
    header: ({ column }) => <SortHeader column={column}>XP</SortHeader>,
    cell: ({ getValue }) => {
      const v = getValue();
      if (!v) return <span className="text-slate-300">—</span>;
      return <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full"><Zap className="w-3 h-3" />{v}</span>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const s = getValue();
      const styles = {
        completed: 'bg-emerald-100 text-emerald-800',
        won: 'bg-violet-100 text-violet-800',
        lost: 'bg-red-100 text-red-800',
        abandoned: 'bg-slate-100 text-slate-500',
      };
      return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${styles[s] || styles.completed}`}>{s}</span>;
    },
    filterFn: (row, id, filterValues) => filterValues.size === 0 || filterValues.has(row.getValue(id)),
  },
];

/* ══════════ MAIN COMPONENT ══════════ */
const TestHistoryTable = ({ data = [], loading = false }) => {
  const [sorting, setSorting] = useState([{ id: 'date', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [examFilter, setExamFilter] = useState(new Set());
  const [subjectFilter, setSubjectFilter] = useState(new Set());
  const [statusFilter, setStatusFilter] = useState(new Set());
  const [pageSize, setPageSize] = useState(8);

  // Derive unique filter options from data
  const exams = useMemo(() => [...new Set(data.map(d => d.exam).filter(Boolean))], [data]);
  const subjects = useMemo(() => [...new Set(data.map(d => d.subject).filter(Boolean))], [data]);
  const statuses = useMemo(() => [...new Set(data.map(d => d.status).filter(Boolean))], [data]);

  // Custom column filters
  const columnFilters = useMemo(() => {
    const f = [];
    if (examFilter.size > 0) f.push({ id: 'exam', value: examFilter });
    if (subjectFilter.size > 0) f.push({ id: 'subject', value: subjectFilter });
    if (statusFilter.size > 0) f.push({ id: 'status', value: statusFilter });
    return f;
  }, [examFilter, subjectFilter, statusFilter]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, columnFilters, pagination: { pageIndex: 0, pageSize } },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const search = filterValue.toLowerCase();
      const { exam, subject, topic } = row.original;
      return [exam, subject, topic].some(v => v?.toLowerCase().includes(search));
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Live stats from filtered rows
  const stats = useMemo(() => {
    const rows = table.getFilteredRowModel().rows;
    if (rows.length === 0) return { count: 0, avgScore: 0, avgAccuracy: 0, bestRank: null, totalXp: 0 };
    let scoreSum = 0, accSum = 0, xpSum = 0, bestRank = Infinity;
    rows.forEach(r => {
      const d = r.original;
      scoreSum += d.score || 0;
      accSum += d.accuracy || 0;
      xpSum += d.xp || 0;
      if (d.rank && d.rank < bestRank) bestRank = d.rank;
    });
    return {
      count: rows.length,
      avgScore: Math.round(scoreSum / rows.length),
      avgAccuracy: Math.round(accSum / rows.length),
      bestRank: bestRank === Infinity ? null : bestRank,
      totalXp: xpSum,
    };
  }, [table.getFilteredRowModel().rows]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1,2,3,4].map(i => <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />)}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16" data-testid="empty-history">
        <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="font-semibold text-slate-500 text-lg">No test history yet</p>
        <p className="text-sm text-slate-400 mt-1">Complete quizzes and battles to see your performance here</p>
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="test-history-table">
      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="stats-bar">
        <StatCard icon={Target} label="Avg Score" value={`${stats.avgScore}%`} color="text-violet-600 bg-violet-50" />
        <StatCard icon={TrendingUp} label="Avg Accuracy" value={`${stats.avgAccuracy}%`} color="text-emerald-600 bg-emerald-50" />
        <StatCard icon={Trophy} label="Best Rank" value={stats.bestRank ? `#${stats.bestRank}` : '—'} color="text-amber-600 bg-amber-50" />
        <StatCard icon={Zap} label="Total XP" value={stats.totalXp.toLocaleString()} color="text-orange-600 bg-orange-50" />
      </div>

      {/* ── Search + Filters ── */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="Search by exam, subject, or topic..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400"
            data-testid="global-search"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          {exams.length > 1 && <PillToggle label="Exam" options={exams} selected={examFilter} onChange={setExamFilter} />}
          {subjects.length > 1 && <PillToggle label="Subject" options={subjects} selected={subjectFilter} onChange={setSubjectFilter} />}
          {statuses.length > 1 && <PillToggle label="Status" options={statuses} selected={statusFilter} onChange={setStatusFilter} />}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="history-data-table">
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id} className="bg-slate-50 border-b border-slate-200">
                  {hg.headers.map(h => (
                    <th key={h.id} className="text-left px-4 py-3">
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-slate-400">No results match your filters</td></tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors" data-testid={`row-${row.index}`}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length}</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); table.setPageIndex(0); }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium outline-none"
              data-testid="page-size-select"
            >
              {[8, 15, 20, 50].map(s => <option key={s} value={s}>{s} / page</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <PagBtn onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>First</PagBtn>
            <PagBtn onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Prev</PagBtn>
            <span className="px-3 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
            </span>
            <PagBtn onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</PagBtn>
            <PagBtn onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>Last</PagBtn>
          </div>
        </div>
      </div>
    </div>
  );
};

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`rounded-xl p-3 border border-slate-100 ${color.split(' ')[1]}`} data-testid={`stat-${label.replace(/\s/g, '-').toLowerCase()}`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color.split(' ')[0]}`} />
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <p className={`text-xl font-bold mt-1 ${color.split(' ')[0]}`}>{value}</p>
    </div>
  );
}

function PagBtn({ children, ...props }) {
  return <button className="px-3 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" {...props}>{children}</button>;
}

export default TestHistoryTable;
