import React from 'react';

interface TimeDisplayProps {
  time?: Date;
}

export const TimeDisplay: React.FC<TimeDisplayProps> = ({ time = new Date() }) => {
  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  return (
    <>
      <span className="log-hour">{hours}</span>
      <span className="log-minute">{minutes}</span>
      <span className="log-second">{seconds}</span>
    </>
  );
};
