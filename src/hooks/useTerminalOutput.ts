// src/hooks/useTerminalOutput.ts
import React from 'react';
import { useCommand } from './useCommand';

export const useTerminalOutput = () => {
    const { appendToOutput, commandHistory } = useCommand();

    return {
        writeOutput: (output: React.ReactNode) => {
            appendToOutput(output);
        },
        writeHelpOutput: (helpText: string) => {
            appendToOutput(
                React.createElement(
                    'div',
                    { dangerouslySetInnerHTML: { __html: helpText } }
                )
            );
        },
        // Add other terminal output related functions here
    };
};