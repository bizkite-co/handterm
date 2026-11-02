import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResizeCanvasAndFont } from '../useResizeCanvasAndFont';
import { terminalFontSizeSignal, setTerminalFontSize } from '../../signals/appSignals';

describe('useResizeCanvasAndFont', () => {
  beforeEach(() => {
    localStorage.clear();
    setTerminalFontSize(16);
    document.documentElement.style.setProperty('--terminal-font-size', '16px');
  });

  it('initializes font size from terminalFontSizeSignal and localStorage', () => {
    const { result } = renderHook(() => useResizeCanvasAndFont());
    expect(result.current.fontSize).toBe(16);
    expect(document.documentElement.style.getPropertyValue('--terminal-font-size')).toBe('16px');
  });

  it('scales font size during two-finger touch pinch gesture', () => {
    const { result } = renderHook(() => useResizeCanvasAndFont());

    // Start pinch with 2 touches 100px apart
    act(() => {
      result.current.handleTouchStart({
        touches: [
          { pageX: 0, pageY: 0 },
          { pageX: 100, pageY: 0 },
        ],
      } as any);
    });

    // Move pinch out to 150px apart (1.5x zoom)
    act(() => {
      result.current.handleTouchMove({
        touches: [
          { pageX: 0, pageY: 0 },
          { pageX: 150, pageY: 0 },
        ],
        preventDefault: vi.fn(),
      } as any);
    });

    // 16 * 1.5 = 24px
    expect(terminalFontSizeSignal.value).toBe(24);
    expect(document.documentElement.style.getPropertyValue('--terminal-font-size')).toBe('24px');

    // End touch
    act(() => {
      result.current.handleTouchEnd({} as any);
    });

    expect(localStorage.getItem('terminalFontSize')).toBe('24');
  });

  it('clamps font size to reasonable bounds', () => {
    const { result } = renderHook(() => useResizeCanvasAndFont());

    // Start pinch with 100px apart
    act(() => {
      result.current.handleTouchStart({
        touches: [
          { pageX: 0, pageY: 0 },
          { pageX: 100, pageY: 0 },
        ],
      } as any);
    });

    // Shrink down drastically (to 5px) -> should clamp to min 10
    act(() => {
      result.current.handleTouchMove({
        touches: [
          { pageX: 0, pageY: 0 },
          { pageX: 5, pageY: 0 },
        ],
        preventDefault: vi.fn(),
      } as any);
    });

    expect(terminalFontSizeSignal.value).toBe(10);
    expect(document.documentElement.style.getPropertyValue('--terminal-font-size')).toBe('10px');
  });
});
