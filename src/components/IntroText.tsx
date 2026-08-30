import type { FC } from 'react';
import './IntroText.css';

export const IntroText: FC = () => {
  return (
    <div className="intro-text">
      <p className="intro-title">Welcome to HandTerm!</p>
      <p>This is a terminal application that you can control with your hands.</p>
      <p>Use the gestures for &quot;enter&quot; and &quot;backspace&quot; to navigate and execute commands.</p>
      <p>Try typing &quot;help&quot; to see a list of available commands.</p>
    </div>
  );
};
