import React from 'react';
import { Chord } from '../components/Chord';

const SpecialCommand: React.FC = () => {
  const specialChars = ['~', '`', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '=', '{', '[', '}', ']', '|', '\\', ':', ';', '"', "'", '<', '>', ',', '.', '?', '/'];
  return (
    <div className='chord-display-container'>
      {specialChars.map((element) => (
        <Chord key={element} displayChar={element} />
      ))}
    </div>
  );
};

export default SpecialCommand;
