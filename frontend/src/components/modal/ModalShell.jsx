import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Premium mobile-first modal shell used by both QuizRoomModal and
 * AcademicQuestionModal.
 *
 * Highlights:
 *  - Full-screen bottom-sheet on mobile (<768px), centered modal on >=768px.
 *  - Uses 100dvh + env(safe-area-inset-bottom) so the primary CTA is never hidden
 *    behind the iOS Safari toolbar or Android chrome.
 *  - Sticky slim header (56px) with icon tile + title + close. No bulky gradient
 *    block — gradient is a subtle 2px brand accent line below the divider.
 *  - Sticky footer with backdrop-blur and safe-area-aware padding.
 *  - Adds `data-modal-open` attribute to <body> while mounted; MobileBottomNav
 *    and CreatePostFAB read this and hide themselves so they can never overlap
 *    the modal's primary CTA.
 *
 * Props:
 *   open                : boolean
 *   onClose             : () => void
 *   icon                : ReactNode (rendered inside the 32x32 left icon tile)
 *   title               : string
 *   subtitle            : string  (single-line, hidden when truncation would wrap)
 *   children            : the scrollable body
 *   footer              : ReactNode (the sticky bottom footer — Cancel + CTA)
 *   syncIndicator       : optional ReactNode (small left-aligned status text)
 *   resumeBanner        : optional ReactNode (rendered between header and body)
 *   testid              : root data-testid
 *   maxWidth            : Tailwind max-w class for desktop (default `max-w-[560px]`)
 *   onRequestClose      : alias for onClose used by ESC + outside-tap
 */
const ModalShell = ({
  open,
  onClose,
  icon,
  title,
  subtitle,
  children,
  footer,
  syncIndicator,
  resumeBanner,
  testid = 'modal-shell',
  maxWidth = 'md:max-w-[560px]',
  onRequestClose,
}) => {
  const dialogRef = useRef(null);
  const handleClose = onRequestClose || onClose;

  // ── Body lock + bottom-nav / FAB hide ───────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    body.setAttribute('data-modal-open', 'true');
    html.setAttribute('data-modal-open', 'true');
    return () => {
      body.style.overflow = prevOverflow;
      body.removeAttribute('data-modal-open');
      html.removeAttribute('data-modal-open');
    };
  }, [open]);

  // ── ESC to close ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, handleClose]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-testid={testid}
      className="fixed inset-0 z-[100] flex items-end md:items-center md:justify-center"
      style={{ fontFamily: '"Geist", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', fontFeatureSettings: '"cv11", "ss01"' }}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal"
        onClick={handleClose}
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px] animate-fade-in"
        data-testid={`${testid}-backdrop`}
      />

      {/* Sheet / Centered card */}
      <div
        ref={dialogRef}
        className={`relative w-full md:w-[92vw] ${maxWidth} bg-white shadow-[0_24px_64px_-12px_rgba(15,23,42,0.18)]
                    rounded-t-[24px] md:rounded-[20px]
                    flex flex-col overflow-hidden
                    animate-sheet-up md:animate-modal-fade`}
        style={{
          height: '100dvh',
          maxHeight: '100dvh',
        }}
        // Switch to capped height on desktop via inline media-query-like override below
        // (Tailwind can't do dynamic max-h easily for dvh)
      >
        {/* Inline style override for desktop: cap height at 90dvh */}
        <style>{`
          @media (min-width: 768px) {
            [data-modal-card="true"] { height: auto !important; max-height: 90dvh !important; }
          }
          @keyframes sheet-up {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
          @keyframes modal-fade {
            from { opacity: 0; transform: scale(0.96); }
            to   { opacity: 1; transform: scale(1); }
          }
          @keyframes fade-in {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          .animate-sheet-up   { animation: sheet-up   320ms cubic-bezier(0.32,0.72,0,1); }
          .animate-modal-fade { animation: modal-fade 220ms ease-out; }
          .animate-fade-in    { animation: fade-in    220ms ease-out; }
          @media (prefers-reduced-motion: reduce) {
            .animate-sheet-up, .animate-modal-fade, .animate-fade-in { animation: none; }
          }
          /* Hide app bottom-nav + FAB while a modal is open */
          body[data-modal-open="true"] [data-mobile-bottom-nav],
          body[data-modal-open="true"] [data-create-post-fab] {
            display: none !important;
          }
        `}</style>

        <div data-modal-card="true" className="flex flex-col flex-1 overflow-hidden">
          {/* Drag handle (mobile only) */}
          <div className="md:hidden pt-2.5 pb-1.5 flex justify-center" aria-hidden>
            <span className="w-10 h-1 rounded-full bg-slate-300" />
          </div>

          {/* Sticky slim header (56px) */}
          <header className="sticky top-0 z-10 bg-white">
            <div className="flex items-center gap-3 px-5 h-14">
              {icon && (
                <div className="shrink-0 w-8 h-8 rounded-lg bg-[#EEF0FF] text-[#4F46E5] flex items-center justify-center">
                  {icon}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-[17px] font-semibold text-slate-900 leading-tight truncate" data-testid={`${testid}-title`}>
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-[13px] text-slate-500 leading-tight truncate">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                data-testid={`${testid}-close`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Hairline + 2px brand accent */}
            <div className="h-px bg-slate-200" />
            <div className="h-[2px] bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#4F46E5]" />
          </header>

          {/* Optional resume banner */}
          {resumeBanner}

          {/* Scrollable body */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain px-5 md:px-6 pt-4"
            style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}
            data-testid={`${testid}-body`}
          >
            {children}
          </div>

          {/* Sticky footer */}
          {footer && (
            <footer
              className="sticky bottom-0 z-10 border-t border-slate-200 bg-white/92 backdrop-blur-[16px]"
              style={{
                paddingTop: 12,
                paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
                paddingLeft: 20,
                paddingRight: 20,
              }}
              data-testid={`${testid}-footer`}
            >
              {syncIndicator && (
                <div className="mb-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                  {syncIndicator}
                </div>
              )}
              {footer}
            </footer>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalShell;
