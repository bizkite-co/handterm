import React, { useState, useImperativeHandle, forwardRef } from 'react';

interface ErrorDisplayProps {
  svgCharacter: HTMLElement;
  chordImageHolder: HTMLElement;
  mismatchedChar: string;
  mismatchedCharCode: string;
  isVisible: boolean;
}

const ErrorDisplay = forwardRef((props: ErrorDisplayProps, ref) => {
  const [errorCount, setErrorCount] = useState(0);
  const { svgCharacter, chordImageHolder, mismatchedChar, mismatchedCharCode, isVisible } = props;


  const showError = (charCode: string) => {
    // svgCharacter.hidden = !isVisible;

    // chordImageHolder.hidden = false;
    // const firstChild = chordImageHolder.children[0] as HTMLElement;
    // firstChild.hidden = false;
    // mismatchedCharCode = charCode;
    setErrorCount(prevCount => prevCount + 1);
    console.log("showError", isVisible, mismatchedChar, mismatchedCharCode, errorCount);
  };

  const hideError = () => {
    // svgCharacter.hidden = false;
    // chordImageHolder.hidden = false;
    console.log("hideError", isVisible, mismatchedChar, mismatchedCharCode, errorCount);
  };

  // Use useImperativeHandle to expose functions to the parent component
  useImperativeHandle(ref, () => ({
    showError,
    hideError,
  }));

  return (
    <div style={{ display: props.isVisible ? 'block' : 'none'}} >
      <div>Error Count: {errorCount}</div>
      <div className="chord-image-holder" id="chord-image-holder" data-source="ErrorDisplay.tsx">
        <div className="col-sm-2 row generated next" id="chord2" >
          <span id="char15">{mismatchedChar}</span>
          <img loading="lazy" alt="2" src={`/images/svgs/${mismatchedCharCode}.svg`} width="100" className="hand"></img>
        </div></div>
    </div>
  );
});

export default ErrorDisplay;