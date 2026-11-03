import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef, type ForwardRefRenderFunction } from 'react';

export interface TimerProps {}

export interface TimerHandle {
  start: () => void;
  stop: () => number;
  reset: () => number;
  success: () => void;
  getElapsedTime: () => number;
}

const Timer: ForwardRefRenderFunction<TimerHandle, TimerProps> = (_props, ref) => {
  const [centiSecond, setCentiSecond] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [svgStatus, setSvgStatus] = useState<'start' | 'stop' | 'pause'>('start');
  const startTimeRef = useRef<number | null>(null);
  const elapsedMsRef = useRef<number>(0);

  useEffect(() => {
    let intervalId: number | null = null;

    if (isActive) {
      setSvgStatus('pause');
      intervalId = window.setInterval(() => {
        if (startTimeRef.current !== null) {
          const currentElapsed = elapsedMsRef.current + (performance.now() - startTimeRef.current);
          setCentiSecond(Math.floor(currentElapsed / 10));
        } else {
          setCentiSecond((prevCentiSecond: number) => prevCentiSecond + 1);
        }
      }, 10);
    } else if (!isActive && centiSecond !== 0) {
      setSvgStatus('start');
      if (intervalId) clearInterval(intervalId);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isActive, centiSecond]);

  const start = () => {
    if (!isActive) {
      startTimeRef.current = performance.now();
      setIsActive(true);
    }
  };

  const stop = (): number => {
    if (isActive && startTimeRef.current !== null) {
      elapsedMsRef.current += performance.now() - startTimeRef.current;
      startTimeRef.current = null;
    }
    setIsActive(false);
    return elapsedMsRef.current > 0 ? elapsedMsRef.current / 1000 : centiSecond / 100;
  };

  const reset = (): number => {
    const finalSeconds = stop();
    elapsedMsRef.current = 0;
    startTimeRef.current = null;
    setCentiSecond(0);
    setIsActive(false);
    return finalSeconds;
  };

  const success = () => {
    elapsedMsRef.current = 0;
    startTimeRef.current = null;
    setCentiSecond(0);
    setIsActive(false);
  };

  const getElapsedTime = (): number => {
    let totalMs = elapsedMsRef.current;
    if (isActive && startTimeRef.current !== null) {
      totalMs += performance.now() - startTimeRef.current;
    }
    return totalMs > 0 ? totalMs / 1000 : centiSecond / 100;
  };

  useImperativeHandle(ref, () => ({
    start,
    stop,
    reset,
    success,
    getElapsedTime
  }));

  const renderSvg = () => {
    switch (svgStatus) {
      case 'start':
        return <use href="#start" transform="scale(2,2)" />;
      case 'stop':
        return <use href="#stop" transform="scale(2,2)" />;
      case 'pause':
        return <use href="#pause" transform="scale(2,2)" />;
      default:
        return <use href="#stop" transform="scale(2,2)" />;
    }
  };

  return (
    <div id="timer-root">
      <svg width="15" height="20" style={{ verticalAlign: 'middle', marginRight: '4px' }}>
        {renderSvg()}
      </svg>
      <span id="timer">{(centiSecond / 100).toFixed(1)}</span>
    </div>
  );
};

export default forwardRef(Timer);
