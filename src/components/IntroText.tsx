import React from 'react';
import './IntroText.css';

export const IntroText: React.FC = () => {
  return (
    <div className="intro-text">
      <h1>Welcome to HandTerm!</h1>
      <p>This is a terminal application that you can control with your hands.</p>
      <p>Use the gestures for "enter" and "backspace" to navigate and execute commands.</p>
      <p>Try typing "help" to see a list of available commands.</p>
    </div>
  );
};
