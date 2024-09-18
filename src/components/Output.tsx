// src/components/Output.tsx

import React, { TouchEventHandler } from "react";
import { TerminalCssClasses } from "../types/TerminalTypes";

export interface OutputProps {
    elements: React.ReactNode[];
    onTouchStart: TouchEventHandler<HTMLDivElement>;
    onTouchEnd: TouchEventHandler<HTMLDivElement>;
}

export const Output = React.memo(React.forwardRef<HTMLDivElement, OutputProps>(({ elements, onTouchStart, onTouchEnd }, ref) => {
    return (
        <div
            id={TerminalCssClasses.Output}
            className={TerminalCssClasses.Output}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            ref={ref}
        >
            {elements.map((element, index) => {
                if (typeof element === 'string') {
                    return <div key={index} dangerouslySetInnerHTML={{ __html: element }} />;
                } else {
                    return <div key={index}>{element}</div>;
                }
            })}
        </div>
    );
}));
