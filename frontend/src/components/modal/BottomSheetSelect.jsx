import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, X } from 'lucide-react';

/**
 * Premium mobile-first select.
 *
 * Behaviour:
 *  - Trigger looks like a regular form input (52px tall, 14px radius).
 *  - On mobile (<768px) opens a bottom sheet with all options.
 *  - On tablet/desktop (>=768px) opens an absolute-positioned dropdown panel.
 *
 * Props:
 *   value, onChange, options: Array<{value, label, hint?}>, placeholder,
 *   disabled, label, required, testid
 */
const BottomSheetSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select',
  disabled = false,
  testid = 'bs-select',
  ariaLabel,
}) => {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel || placeholder}
        data-testid={testid}
        className={`relative w-full h-[52px] px-4 pr-11 rounded-[14px] border-[1.5px] transition-all text-left
                    text-[15px] font-medium tabular-nums
                    ${disabled
                      ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300 focus:outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/20'}
                    ${!current ? 'text-slate-400 font-normal' : ''}`}
      >
        <span className="block truncate">{current ? current.label : placeholder}</span>
        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-500 pointer-events-none" />
      </button>

      {open && createPortal(
        <BSSheet
          options={options}
          value={value}
          onClose={() => setOpen(false)}
          onSelect={(v) => { onChange(v); setOpen(false); }}
        />,
        document.body
      )}
    </>
  );
};

const BSSheet = ({ options, value, onClose, onSelect }) => {
  return (
    <div className="fixed inset-0 z-[120] flex items-end md:items-center md:justify-center" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/55 animate-fade-in"
      />
      <div
        className="relative w-full md:w-[420px] bg-white rounded-t-[24px] md:rounded-[20px] shadow-[0_24px_64px_-12px_rgba(15,23,42,0.18)] animate-sheet-up md:animate-modal-fade flex flex-col"
        style={{ maxHeight: '80dvh' }}
      >
        <div className="md:hidden pt-2.5 pb-1.5 flex justify-center" aria-hidden>
          <span className="w-10 h-1 rounded-full bg-slate-300" />
        </div>
        <div className="flex items-center justify-between px-5 h-12 border-b border-slate-100">
          <span className="text-[15px] font-semibold text-slate-700">Select</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close picker"
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <ul
          role="listbox"
          className="overflow-y-auto py-1"
          style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))' }}
        >
          {options.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-slate-400">No options available</li>
          )}
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value || opt.label} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => onSelect(opt.value)}
                  className={`w-full text-left flex items-start gap-3 px-5 py-3.5 transition-colors ${
                    active ? 'bg-[#EEF0FF]' : 'hover:bg-slate-50 active:bg-slate-100'
                  }`}
                >
                  <span className="flex-1 min-w-0">
                    <span className={`block text-[15px] ${active ? 'font-semibold text-[#4F46E5]' : 'text-slate-800'}`}>
                      {opt.label}
                    </span>
                    {opt.hint && (
                      <span className="block text-[12px] text-slate-500 mt-0.5">{opt.hint}</span>
                    )}
                  </span>
                  {active && <Check className="w-4 h-4 text-[#4F46E5] mt-1.5" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default BottomSheetSelect;
