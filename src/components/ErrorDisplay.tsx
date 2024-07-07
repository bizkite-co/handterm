import { useState, useImperativeHandle, forwardRef } from 'react';
import { ChordDisplay } from './ChordDisplay';

interface ErrorDisplayProps {
  mismatchedChar: string;
  isVisible: boolean;
}

const ErrorDisplay = forwardRef((props: ErrorDisplayProps, ref) => {
  const [errorCount, setErrorCount] = useState(0);
  const { mismatchedChar } = props;


  const showError = () => {
    setErrorCount(prevCount => prevCount + 1);
  };


  // Use useImperativeHandle to expose functions to the parent component
  useImperativeHandle(ref, () => ({
    showError,
  }));

  return (
    <div style={{ display: props.isVisible ? 'block' : 'none' }} >
      <div>Error Count: {errorCount}</div>
      {mismatchedChar &&
        <ChordDisplay displayChar={mismatchedChar} />
      }
    </div>
  );
});

export default ErrorDisplay;