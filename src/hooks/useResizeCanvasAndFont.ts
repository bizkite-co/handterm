// useResizeCanvasAndFont.ts
import { useState, useCallback, useRef, useEffect, type RefObject, type TouchEventHandler } from 'react';
import { terminalFontSizeSignal, setTerminalFontSize } from '../signals/appSignals';

export function useResizeCanvasAndFont(containerRef?: RefObject<HTMLElement | null>): {
  fontSize: number;
  canvasHeight: number;
  handleTouchMove: (event: TouchEvent | React.TouchEvent<HTMLElement>) => void;
  handleTouchStart: (event: TouchEvent | React.TouchEvent<HTMLElement>) => void;
  handleTouchEnd: (event: TouchEvent | React.TouchEvent<HTMLElement>) => void;
} {
  const [fontSize, setFontSize] = useState<number>(() => terminalFontSizeSignal.value);
  const initialCanvasHeight = parseInt(localStorage.getItem('canvas-height') ?? '100', 10);
  const [canvasHeight, setCanvasHeight] = useState<number>(initialCanvasHeight);

  const lastTouchDistanceRef = useRef<number | null>(null);
  const initialTouchFontSizeRef = useRef<number>(fontSize);
  const initialTouchCanvasHeightRef = useRef<number>(canvasHeight);

  // Sync state with signal
  useEffect(() => {
    return terminalFontSizeSignal.subscribe((val) => {
      setFontSize(val);
    });
  }, []);

  const getDistanceBetweenTouches = (touches: TouchList | React.TouchList): number => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    if (!touch1 || !touch2) return 0;
    return Math.sqrt(
      Math.pow(touch2.pageX - touch1.pageX, 2) +
      Math.pow(touch2.pageY - touch1.pageY, 2)
    );
  };

  const handleTouchStart = useCallback((event: TouchEvent | React.TouchEvent<HTMLElement>) => {
    const touches = 'touches' in event ? event.touches : null;
    if (touches && touches.length === 2) {
      const distance = getDistanceBetweenTouches(touches);
      lastTouchDistanceRef.current = distance;
      initialTouchFontSizeRef.current = terminalFontSizeSignal.value;
      initialTouchCanvasHeightRef.current = canvasHeight;
    }
  }, [canvasHeight]);

  const handleTouchMove = useCallback((event: TouchEvent | React.TouchEvent<HTMLElement>) => {
    const touches = 'touches' in event ? event.touches : null;
    if (touches && touches.length === 2 && lastTouchDistanceRef.current && lastTouchDistanceRef.current > 0) {
      if ('cancelable' in event && event.cancelable) {
        event.preventDefault();
      }

      const currentDistance = getDistanceBetweenTouches(touches);
      const scaleFactor = currentDistance / lastTouchDistanceRef.current;
      const eventTarget = event.target as HTMLElement | null;

      if (eventTarget && eventTarget.nodeName === 'CANVAS') {
        const newHeight = Math.max(50, Math.min(800, Math.round(initialTouchCanvasHeightRef.current * scaleFactor)));
        setCanvasHeight(newHeight);
      } else {
        const targetSize = initialTouchFontSizeRef.current * scaleFactor;
        setTerminalFontSize(targetSize);
      }
    }
  }, []);

  const handleTouchEnd = useCallback((_event?: TouchEvent | React.TouchEvent<HTMLElement>) => {
    lastTouchDistanceRef.current = null;
    localStorage.setItem('terminalFontSize', String(terminalFontSizeSignal.value));
    localStorage.setItem('canvas-height', String(canvasHeight));
  }, [canvasHeight]);

  // Optionally attach native non-passive touch listeners to containerRef to reliably prevent default pinch-zoom
  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;

    const onNativeTouchStart = (e: TouchEvent) => handleTouchStart(e);
    const onNativeTouchMove = (e: TouchEvent) => handleTouchMove(e);
    const onNativeTouchEnd = (e: TouchEvent) => handleTouchEnd(e);

    el.addEventListener('touchstart', onNativeTouchStart, { passive: true });
    el.addEventListener('touchmove', onNativeTouchMove, { passive: false });
    el.addEventListener('touchend', onNativeTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onNativeTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onNativeTouchStart);
      el.removeEventListener('touchmove', onNativeTouchMove);
      el.removeEventListener('touchend', onNativeTouchEnd);
      el.removeEventListener('touchcancel', onNativeTouchEnd);
    };
  }, [containerRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    fontSize,
    canvasHeight,
    handleTouchMove: handleTouchMove as (event: TouchEvent | React.TouchEvent<HTMLElement>) => void,
    handleTouchStart: handleTouchStart as TouchEventHandler<HTMLElement>,
    handleTouchEnd: handleTouchEnd as TouchEventHandler<HTMLDivElement>,
  };
}
