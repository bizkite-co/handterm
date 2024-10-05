/** @jsxImportSource react */
import React, { useCallback } from 'react';
import { WpmTable } from '../components/WpmTable'; // Assuming you have this component
import { TimeDisplay } from '../components/TimeDisplay'; // Assuming you have this component
import { IWPMCalculator } from '../utils/WPMCalculator';
import { LogKeys } from '../types/TerminalTypes';

interface UseCommandOutputProps {
    wpmCalculator: IWPMCalculator;
    addToCommandHistory: (output: string) => void;
    onOutputUpdate: (output: React.ReactNode) => void;
}

export const useCommandOutput = ({ wpmCalculator, addToCommandHistory,
    onOutputUpdate }: UseCommandOutputProps) => {
    const createCommandRecord = useCallback((command: string, commandTime: Date):
        React.ReactNode => {
        return React.createElement('div', { className: "log-line" },
            React.createElement('span', { className: "log-time" },
                React.createElement(TimeDisplay, { time: commandTime })
            ),
            React.createElement('span', { className: "wpm-label" }, "WPM:"),
            React.createElement('span', { className: "wpm" },
                wpmCalculator.getWPMs().wpmAverage.toFixed(0)),
            command
        );
    }, [wpmCalculator]);

    const processCommandOutput = useCallback((command: string, response: string, status: number): void => {
        const commandTime = new Date();
        const timeCode = commandTime.toISOString();
        const commandRecord = createCommandRecord(command, commandTime);

        const { wpmAverage, charWpms } = wpmCalculator.getWPMs();
        wpmCalculator.saveKeystrokes(timeCode);
        wpmCalculator.clearKeystrokes();

        const characterAverages = charWpms
            .filter(wpm => wpm.durationMilliseconds > 1)
            .sort((a, b) => a.wpm - b.wpm)
            .slice(0, 5);

        const output = React.createElement('div', { 'data-status': status },
            commandRecord,
            React.createElement('div', { className: "response" }, response),
            React.createElement(WpmTable, {
                wpms: characterAverages, name: "slow-char"
            })              
        );

        addToCommandHistory(command);
        onOutputUpdate(output);

        // You might want to handle persistence differently in a React app
        // For now, we'll just log it
        console.log(`Command output for ${LogKeys.Command}_${timeCode}:`, output);
    }, [wpmCalculator, createCommandRecord, addToCommandHistory, onOutputUpdate])

    return { processCommandOutput };
};