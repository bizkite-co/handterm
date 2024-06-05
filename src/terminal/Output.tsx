import React, { TouchEventHandler } from "react";
import { TerminalCssClasses } from "./TerminalTypes";


export interface OutputProps {
    elements: React.ReactNode[];
    onTouchStart: TouchEventHandler<HTMLDivElement>;
    onTouchEnd: TouchEventHandler<HTMLDivElement>;
}

export const Output: React.FC<OutputProps> = ({ elements, ...props }) => {
    return (
        <div
            id={TerminalCssClasses.Output}
            className={TerminalCssClasses.Output}
            onTouchStart={props.onTouchStart}
            onTouchEnd={props.onTouchEnd}
        >
            {elements.map((element, index) => {
                if (typeof element === 'string') {
                    // Only use dangerouslySetInnerHTML for string values
                    return <div key={index} dangerouslySetInnerHTML={{ __html: element }} />;
                } else {
                    // For non-string ReactNode elements, render them directly
                    return <div key={index}>{element}</div>;
                }
            })}
        </div>
    );
};