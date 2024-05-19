import React, { TouchEventHandler } from "react";
import { TerminalCssClasses } from "./TerminalTypes";


export interface OutputProps {
    elements: string[];
    onTouchStart?: TouchEventHandler<HTMLDivElement>;
    onTouchEnd?: TouchEventHandler<HTMLDivElement>;
    onTouchMove?: TouchEventHandler<HTMLDivElement>;
}

export const Output: React.FC<OutputProps> = ({...props}) => {
    return (
        <div 
            id={TerminalCssClasses.Output} 
            className={TerminalCssClasses.Output}
            onTouchStart={props.onTouchStart}
            onTouchMove={props.onTouchMove}
            onTouchEnd={props.onTouchEnd}
            >
            {props.elements.map((htmlString, index) => (
                <div key={index} dangerouslySetInnerHTML={{ __html: htmlString }} />
            ))}
        </div>
    );
};