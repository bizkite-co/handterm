import React, { useState, useEffect, useImperativeHandle, forwardRef} from 'react';


const Timer = forwardRef((_props: any, ref: any) => {
  const [centiSecond, setCentiSecond] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [svgStatus, setSvgStatus] = useState<'start' | 'stop' | 'pause'>('start');

  useEffect(() => {
    let intervalId: number | null = null;

    if (isActive) {
      setSvgStatus('pause');
      intervalId = window.setInterval(() => {
        setCentiSecond((prevCentiSecond: number) => prevCentiSecond + 1);
      }, 10);
    } else if (!isActive && centiSecond !== 0) {
      setSvgStatus('start');
      clearInterval(intervalId!);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isActive, centiSecond]);

  const start = () => {
    setIsActive(true);
  };

  const stop = () => {
    setIsActive(false);
  };

  const reset = (): number => {
    setIsActive(false);
    const finalCentiSecond = centiSecond;
    setCentiSecond(0);
    console.log('Timer reset from:', finalCentiSecond); // This will still log the old value due to the asynchronous nature of setState
    return finalCentiSecond;
  };

  const success = () => {
    console.log("Timer Success");
    setCentiSecond(0);
    setIsActive(false);
  };

  useImperativeHandle(ref, () => ({
    start,
    stop,
    reset,
    success
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
    <React.Fragment>
      <span id="timer">{(centiSecond / 100).toFixed(1)}</span>
      <svg width="15" height="20" style={{ float: 'left' }}>
        {renderSvg()}
      </svg>
      {/* Add buttons or interactions to control the timer */}
    </React.Fragment>
  );
});

export default Timer;