import React from 'react';
import './KeyIndicator.css';

interface KeyIndicatorProps {
  keyType: 'enter' | 'backspace';
}

export const KeyIndicator: React.FC<KeyIndicatorProps> = ({ keyType }) => {
  const svgPath = `/images/svgs/${keyType}-key.svg`;

  return (
    <div className="key-indicator">
      <img src={svgPath} alt={`${keyType} key`} />
    </div>
  );
};
