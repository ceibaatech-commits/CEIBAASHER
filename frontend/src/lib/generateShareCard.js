/**
 * Share-card generator for the SponsoredQuiz results screen.
 * Renders a 1080x1080 PNG using pure HTML Canvas — no external deps.
 *
 * Supports per-quiz branded themes via `quiz.share_theme`:
 *   {
 *     deep:      "#1e293b",       // base background color (below the diagonal)
 *     bg_start:  "#7c3aed",       // top of the gradient layer
 *     bg_mid:    "#8b5cf6",       // middle stop
 *     bg_end:    "#a78bfa",       // bottom stop
 *     accent:    "#f59e0b",       // used for medal / accent glow
 *     text:      "#ffffff",       // headline / body text color
 *     mascot_url: "https://…"     // optional PNG/JPG served with CORS enabled
 *   }
 * Any missing field falls back to the default purple palette.
 */

const DEFAULT_THEME = {
  deep: '#4c1d95',
  bg_start: '#7c3aed',
  bg_mid: '#8b5cf6',
  bg_end: '#a78bfa',
  accent: null, // when null, use the medalVariant palette
  text: '#ffffff',
  mascot_url: null,
};

export const MEDAL_PALETTES = {
  gold: { top: '#fde68a', bottom: '#f59e0b', ring: '#b45309' },
  silver: { top: '#e5e7eb', bottom: '#9ca3af', ring: '#4b5563' },
  bronze: { top: '#fed7aa', bottom: '#c2410c', ring: '#7c2d12' },
  default: { top: '#c4b5fd', bottom: '#7c3aed', ring: '#4c1d95' },
};

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text || '').split(' ');
  let line = '';
  const lines = [];
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}

function loadImage(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function generateShareCard({
  quiz,
  score,
  maxScore,
  correct,
  total,
  headline,
  medalVariant = 'gold',
}) {
  const theme = { ...DEFAULT_THEME, ...(quiz?.share_theme || {}) };
  const palette = MEDAL_PALETTES[medalVariant] || MEDAL_PALETTES.default;

  const W = 1080;
  const H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 1) Base color
  ctx.fillStyle = theme.deep;
  ctx.fillRect(0, 0, W, H);

  // 2) Diagonal brighter layer (matches on-screen QuizScreen)
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, theme.bg_start);
  grad.addColorStop(0.55, theme.bg_mid);
  grad.addColorStop(1, theme.bg_end);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.42);
  ctx.lineTo(W, H * 0.30);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // 3) Optional mascot (top-right of hero area) — if supplied
  const mascot = await loadImage(theme.mascot_url);
  if (mascot) {
    const size = 220;
    ctx.save();
    ctx.globalAlpha = 0.9;
    // shadow
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    ctx.drawImage(mascot, W - size - 60, 60, size, size);
    ctx.restore();
  }

  // 4) Medal disc with ribbons
  const cx = W / 2;
  const cy = H * 0.30;

  // Ribbons
  ctx.save();
  ctx.translate(cx, cy - 60);
  ctx.rotate(0.1);
  const ribbonRed = ctx.createLinearGradient(0, 0, 0, 180);
  ribbonRed.addColorStop(0, '#f87171');
  ribbonRed.addColorStop(1, '#dc2626');
  ctx.fillStyle = ribbonRed;
  ctx.fillRect(-70, 0, 60, 180);
  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy - 60);
  ctx.rotate(-0.1);
  const ribbonBlue = ctx.createLinearGradient(0, 0, 0, 180);
  ribbonBlue.addColorStop(0, '#818cf8');
  ribbonBlue.addColorStop(1, '#4f46e5');
  ctx.fillStyle = ribbonBlue;
  ctx.fillRect(10, 0, 60, 180);
  ctx.restore();

  // Medal disc
  const discGrad = ctx.createRadialGradient(cx - 40, cy - 30, 20, cx, cy, 160);
  discGrad.addColorStop(0, palette.top);
  discGrad.addColorStop(1, theme.accent || palette.bottom);
  ctx.fillStyle = discGrad;
  ctx.beginPath();
  ctx.arc(cx, cy + 40, 140, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = palette.ring;
  ctx.stroke();

  // Trophy emoji inside the disc
  ctx.font =
    "140px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🏆', cx, cy + 46);

  // 5) Headline
  ctx.fillStyle = theme.text;
  ctx.textAlign = 'center';
  ctx.font = "bold 72px Geist, Inter, system-ui, sans-serif";
  wrapText(ctx, headline, cx, H * 0.56, W - 160, 84);

  // 6) Score big
  ctx.font = "800 140px Geist, Inter, system-ui, sans-serif";
  ctx.fillText(`${score}/${maxScore}`, cx, H * 0.72);

  // 7) Accuracy / correct-line
  const pct = total ? Math.round((correct / total) * 100) : 0;
  ctx.font = "500 34px Geist, Inter, system-ui, sans-serif";
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(`${correct}/${total} correct · ${pct}% accuracy`, cx, H * 0.79);

  // 8) Quiz title
  ctx.font = "500 32px Geist, Inter, system-ui, sans-serif";
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  wrapText(ctx, quiz?.title || '', cx, H * 0.86, W - 200, 40);

  // 9) Sponsor line (if present)
  ctx.font = "500 26px Geist, Inter, system-ui, sans-serif";
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  const sponsor = quiz?.sponsor_name
    ? `Sponsored by ${quiz.sponsor_name}`
    : 'Cody · Sponsored Quiz';
  ctx.fillText(sponsor, cx, H * 0.93);

  return new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/png', 0.95)
  );
}

/**
 * Runs the share pipeline. Guarantees `minSpinnerMs` visible loading time
 * so the UI feedback is perceptible on fast devices. Falls back through
 * navigator.share (files) → navigator.share (text/url) → clipboard →
 * programmatic download of the PNG.
 *
 * @returns {"shared" | "downloaded" | "copied" | "canceled"}
 */
export async function shareResults({
  quiz,
  score,
  maxScore,
  correct,
  total,
  headline,
  medalVariant,
  minSpinnerMs = 300,
} = {}) {
  const startedAt = Date.now();
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  const enforceMinDelay = async () => {
    const elapsed = Date.now() - startedAt;
    if (elapsed < minSpinnerMs) await delay(minSpinnerMs - elapsed);
  };

  let blob;
  try {
    blob = await generateShareCard({
      quiz, score, maxScore, correct, total, headline, medalVariant,
    });
  } catch (e) {
    await enforceMinDelay();
    throw e;
  }

  const file = blob
    ? new File([blob], 'quiz-score.png', { type: 'image/png' })
    : null;
  const shareText = `I scored ${score}/${maxScore} on "${quiz?.title || 'the quiz'}"${
    quiz?.sponsor_name ? ` — a ${quiz.sponsor_name} quiz` : ''
  }!`;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Try Web Share API with files
  try {
    if (
      file &&
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      navigator.canShare({ files: [file] }) &&
      navigator.share
    ) {
      await navigator.share({
        title: quiz?.title || 'Quiz results',
        text: shareText,
        files: [file],
        url: shareUrl,
      });
      await enforceMinDelay();
      return 'shared';
    }
  } catch (e) {
    if (e && e.name === 'AbortError') {
      await enforceMinDelay();
      return 'canceled';
    }
    // fall through
  }

  // Try Web Share API without files
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({
        title: quiz?.title || 'Quiz results',
        text: shareText,
        url: shareUrl,
      });
      await enforceMinDelay();
      return 'shared';
    }
  } catch (e) {
    if (e && e.name === 'AbortError') {
      await enforceMinDelay();
      return 'canceled';
    }
    // fall through
  }

  // Clipboard fallback (copy text + url)
  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      // Also trigger the PNG download so the user gets both text + image
      if (blob) triggerDownload(blob);
      await enforceMinDelay();
      return 'copied';
    }
  } catch {
    // fall through to download only
  }

  // Final fallback: download the PNG
  if (blob) triggerDownload(blob);
  await enforceMinDelay();
  return 'downloaded';
}

function triggerDownload(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quiz-score.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
