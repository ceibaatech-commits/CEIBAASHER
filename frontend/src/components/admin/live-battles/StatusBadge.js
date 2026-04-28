import React from 'react';
import {
  Clock, Play, CheckCircle, XCircle, AlertTriangle, Eye, Ban,
} from 'lucide-react';

const STATUS_CONFIG = {
  waiting:      { bg: 'bg-yellow-100', text: 'text-yellow-800',  icon: Clock },
  in_progress:  { bg: 'bg-green-100',  text: 'text-green-800',   icon: Play },
  completed:    { bg: 'bg-blue-100',   text: 'text-blue-800',    icon: CheckCircle },
  terminated:   { bg: 'bg-red-100',    text: 'text-red-800',     icon: XCircle },
  pending:      { bg: 'bg-orange-100', text: 'text-orange-800',  icon: AlertTriangle },
  reviewed:     { bg: 'bg-purple-100', text: 'text-purple-800',  icon: Eye },
  action_taken: { bg: 'bg-red-100',    text: 'text-red-800',     icon: Ban },
  dismissed:    { bg: 'bg-gray-100',   text: 'text-gray-800',    icon: XCircle },
};

export const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.waiting;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-3 h-3" />
      {(status || 'waiting').replace('_', ' ')}
    </span>
  );
};
