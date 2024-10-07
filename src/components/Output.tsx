// src/components/Output.tsx

import React from "react";
import { TerminalCssClasses } from "../types/TerminalTypes";
import { useAppContext } from "../contexts/AppContext";


export const Output: React.FC = () => {
    const { outputElements } = useAppContext();

  console.log('Rendering Output component, outputElements:', outputElements);
    console.log(outputElements);
    return (
        <div
            id={TerminalCssClasses.Output}
            className={TerminalCssClasses.Output}
        >
            {outputElements.map((element, index) => {
                if (typeof element === 'string') {
                    return <div key={index} dangerouslySetInnerHTML={{ __html: element }} />;
                } else {
                    return <div key={index}>{element}</div>;
                }
            })}
        </div>
    );
};
