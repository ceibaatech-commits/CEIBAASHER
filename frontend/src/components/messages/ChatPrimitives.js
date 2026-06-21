/**
 * ChatPrimitives.js
 *
 * Tiny presentational atoms used inside the Messages chat window.
 * Extracted so they can be imported individually and benefit from
 * module-level dead-code elimination.
 */
import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

/** Thin labelled day-divider between groups of messages. */
export const DaySeparator = ({ label, isDark }) => (
  <div className="flex justify-center my-4" data-testid="day-separator">
    <span
      className={`text-[11px] font-medium font-geist px-3 py-1 rounded-full ${
        isDark ? 'bg-[#1E2230] text-[#94A3B8]' : 'bg-[#F1F2F6] text-[#64748B]'
      }`}
    >
      {label}
    </span>
  </div>
);

/** Centred informational system message (e.g. "Chat started"). */
export const SystemMessage = ({ text, isDark }) => (
  <div className="flex justify-center py-1.5">
    <span
      className={`text-[12px] font-geist px-3 py-1 ${
        isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'
      }`}
    >
      {text}
    </span>
  </div>
);

/** Three bouncing dots shown while the other party is typing. */
export const TypingIndicator = ({ isDark }) => (
  <div className="flex items-end gap-2 mt-1" data-testid="typing-indicator">
    <div className="w-7 shrink-0" />
    <div
      className={`flex gap-1 px-3.5 py-3 rounded-2xl rounded-bl-md ${
        isDark ? 'bg-[#1E2230]' : 'bg-[#F1F2F6]'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? 'bg-[#94A3B8]' : 'bg-[#64748B]'}`} style={{ animationDelay: '0ms' }} />
      <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? 'bg-[#94A3B8]' : 'bg-[#64748B]'}`} style={{ animationDelay: '150ms' }} />
      <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? 'bg-[#94A3B8]' : 'bg-[#64748B]'}`} style={{ animationDelay: '300ms' }} />
    </div>
  </div>
);

/**
 * Message delivery / read receipt icon.
 * - Single tick  → sent
 * - Double grey  → delivered
 * - Double purple → read
 */
export const Receipt = ({ msg, isDark }) => {
  if (msg.read) {
    return (
      <CheckCheck
        data-testid={`receipt-read-${msg.id}`}
        aria-label="Read"
        className="w-3.5 h-3.5 text-[#7C3AED]"
      />
    );
  }
  if (msg.delivered) {
    return (
      <CheckCheck
        data-testid={`receipt-delivered-${msg.id}`}
        aria-label="Delivered"
        className={`w-3.5 h-3.5 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}
      />
    );
  }
  return (
    <Check
      data-testid={`receipt-sent-${msg.id}`}
      aria-label="Sent"
      className={`w-3.5 h-3.5 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}
    />
  );
};
