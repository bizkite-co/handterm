// ScrollingTextLayer.tsx
import type React from 'react';

interface ScrollingTextLayerProps {
    text: string;
    canvasHeight: number;
}

const ScrollingTextLayer: React.FC<ScrollingTextLayerProps> = (props: ScrollingTextLayerProps) => {
    const textBottom = 60 - props.canvasHeight;
    return (
        <div
            className="scrolling-text-container"
            style={{
                position: 'absolute',
                bottom: textBottom,
                height: props.canvasHeight,
                width: '100%',
                zIndex: 1,
                overflow: 'hidden'
            }}>
            <div className="scrolling-text" style={{ whiteSpace: 'nowrap' }}>
                {props.text}
            </div>
        </div>
    );
};

export default ScrollingTextLayer;

// function getTextHeight(fontFamily: string, fontSize: string, text: string): number {
//   // Create a temporary span element
//   const span = document.createElement('span');
//   span.style.fontFamily = fontFamily;
//   span.style.fontSize = fontSize;
//   span.style.position = 'absolute'; // Position it out of the normal document flow
//   span.style.whiteSpace = 'nowrap'; // Prevent line breaks
//   span.style.visibility = 'hidden'; // Make it invisible
//   span.textContent = text;

//   // Append the span to the body and calculate the height
//   document.body.appendChild(span);
//   const textHeight = span.getBoundingClientRect().height;

//   // Clean up and remove the temporary span
//   document.body.removeChild(span);

//   return textHeight;
// }