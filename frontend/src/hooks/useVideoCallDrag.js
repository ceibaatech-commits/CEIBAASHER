import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Keeps VC drag math isolated and stable so page rendering logic stays lean.
 */
export default function useVideoCallDrag({ vcState, vcSize, setVcSize, vcPos, setVcPos }) {
  const [isDragging, setIsDragging] = useState(false);

  const dragStateRef = useRef({ dragging: false, startX: 0, startY: 0, posX: 0, posY: 0 });
  const vcSizeRef = useRef(vcSize);
  const vcPosRef = useRef(vcPos);
  const wasDragRef = useRef(false);

  const vcDims = useMemo(() => ({
    mini: { w: 120, h: 190 },
    pip: { w: 300, h: 420 },
    full: { w: 0, h: 0 },
  }), []);

  useEffect(() => {
    vcSizeRef.current = vcSize;
  }, [vcSize]);

  useEffect(() => {
    vcPosRef.current = vcPos;
  }, [vcPos]);

  useEffect(() => {
    if (vcState !== 'active') return;
    const { w } = vcDims.pip;
    const margin = 12;
    setVcPos({
      x: Math.max(margin, window.innerWidth - w - margin),
      y: 100,
    });
    setVcSize('pip');
  }, [vcState, vcDims, setVcPos, setVcSize]);

  const onDragStart = useCallback((e) => {
    if (vcSizeRef.current === 'full') return;
    if (e.target.closest?.('[data-vc-control]')) return;
    const point = e.touches ? e.touches[0] : e;
    dragStateRef.current = {
      dragging: false,
      moved: false,
      startX: point.clientX,
      startY: point.clientY,
      posX: vcPosRef.current.x,
      posY: vcPosRef.current.y,
    };
  }, []);

  const onDragMove = useCallback((e) => {
    const ds = dragStateRef.current;
    if (!ds || !ds.startX) return;
    const point = e.touches ? e.touches[0] : e;
    const dx = point.clientX - ds.startX;
    const dy = point.clientY - ds.startY;

    if (!ds.dragging && Math.hypot(dx, dy) > 5) {
      ds.dragging = true;
      ds.moved = true;
      setIsDragging(true);
    }
    if (!ds.dragging) return;

    const { w, h } = vcDims[vcSizeRef.current] || vcDims.pip;
    const margin = 6;
    const nx = Math.max(margin, Math.min(window.innerWidth - w - margin, ds.posX + dx));
    const ny = Math.max(margin, Math.min(window.innerHeight - h - margin, ds.posY + dy));
    setVcPos({ x: nx, y: ny });
  }, [setVcPos, vcDims]);

  const onDragEnd = useCallback(() => {
    const ds = dragStateRef.current;
    if (!ds) return;

    if (ds.dragging) {
      setIsDragging(false);
      wasDragRef.current = true;
      const { w, h } = vcDims[vcSizeRef.current] || vcDims.pip;
      const margin = 12;
      setVcPos((p) => {
        const cx = p.x + w / 2;
        const x = cx < window.innerWidth / 2 ? margin : window.innerWidth - w - margin;
        const y = Math.max(margin, Math.min(window.innerHeight - h - margin, p.y));
        return { x, y };
      });
    }

    dragStateRef.current = { dragging: false, moved: false, startX: 0, startY: 0, posX: 0, posY: 0 };
  }, [setVcPos, vcDims]);

  const onOverlayClick = useCallback((e) => {
    if (wasDragRef.current) {
      wasDragRef.current = false;
      return;
    }
    if (e.target.closest?.('[data-vc-control]')) return;
    if (vcSizeRef.current === 'mini') setVcSize('pip');
  }, [setVcSize]);

  useEffect(() => {
    if (vcState !== 'active') return undefined;

    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('touchend', onDragEnd);
    window.addEventListener('touchcancel', onDragEnd);

    return () => {
      window.removeEventListener('mousemove', onDragMove);
      window.removeEventListener('mouseup', onDragEnd);
      window.removeEventListener('touchmove', onDragMove);
      window.removeEventListener('touchend', onDragEnd);
      window.removeEventListener('touchcancel', onDragEnd);
    };
  }, [vcState, onDragMove, onDragEnd]);

  return {
    vcDims,
    isDragging,
    onDragStart,
    onOverlayClick,
  };
}
