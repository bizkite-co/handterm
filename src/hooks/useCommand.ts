// src/hooks/useCommand.ts
import React, { useContext, useState, useCallback } from 'react';
import { CommandContext } from '../contexts/CommandContext';
import { parseCommand } from '../utils/commandUtils';
import { LogKeys } from '../types/TerminalTypes';
import { TimeDisplay } from '../components/TimeDisplay';
import WpmTable from '../components/WpmTable';
import { commandRegistry } from '../commands/commandRegistry';
import { useWPMCalculator } from './useWPMCaculator';
import { useAppContext } from '../contexts/AppContext';
import { useActivityMediatorContext } from '../contexts/ActivityMediatorContext';
import { ParsedCommand } from '../types/Types';

export interface IUseCommandProps { }

export const useCommand = () => {
    const [output, setOutput] = useState<React.ReactNode[]>([]);
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [commandHistoryIndex, setCommandHistoryIndex] = useState(-1);
    const [commandHistoryFilter, setCommandHistoryFilter] = useState<string | null>(null);
    const wpmCalculator = useWPMCalculator();
    const { appendToOutput } = useAppContext();
    const { handleCommandExecuted } = useActivityMediatorContext();

    const context = useContext(CommandContext);

    if (context === undefined) {
        throw new Error('useCommand must be used within a CommandProvider');
    }

    const resetOutput = useCallback(() => {
        setOutput([]);
    }, []);

    const addToCommandHistory = useCallback((command: string) => {
        setCommandHistory(prev => [...prev, command].slice(-120)); // Keep last 120 commands
    }, []);

    const getCommandResponseHistory = useCallback((): string[] => {
        const keys: string[] = [];
        const history: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(LogKeys.Command + '_')) {
                keys.push(key);
            }
        }
        keys.sort();
        for (let key of keys) {
            const historyJSON = localStorage.getItem(key);
            if (historyJSON) {
                history.push(historyJSON);
            }
        }
        return history;
    }, []);

    const createCommandRecord = useCallback((command: string, commandTime: Date): React.ReactNode => {
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

        const outputElement = React.createElement('div', { 'data-status': status },
            commandRecord,
            React.createElement('div', { className: "response" }, response),
            React.createElement(WpmTable, {
                wpms: characterAverages, name: "slow-char"
            })
        );

        appendToOutput(outputElement);
        addToCommandHistory(command);

        console.log(`Command output for ${LogKeys.Command}_${timeCode}:`, outputElement);
    }, [wpmCalculator, createCommandRecord, appendToOutput, addToCommandHistory]);

    const executeCommand = useCallback(async (inputCmd: string) => {
        console.log('useCommand: executeCommand called with:', inputCmd);
        const parsedCommand:ParsedCommand = parseCommand(inputCmd);
        const command = commandRegistry.getCommand(parsedCommand.command);
        if (command && context) {
            const response = await command.execute(context, parsedCommand);
            processCommandOutput(inputCmd, response.message, response.status);
            console.log('useCommand: Calling handleCommandExecuted with:', inputCmd);
            handleCommandExecuted(parsedCommand);
        } else {
            processCommandOutput(inputCmd, `Command or context not found: ${parsedCommand}`, 404);
            console.log('useCommand: Calling handleCommandExecuted with:', inputCmd);
            handleCommandExecuted(parsedCommand);
        }
    }, [context, processCommandOutput, handleCommandExecuted]);

    return {
        output,
        resetOutput,
        commandHistory,
        addToCommandHistory,
        getCommandResponseHistory,
        executeCommand,
        commandHistoryIndex,
        setCommandHistoryIndex,
        commandHistoryFilter,
        setCommandHistoryFilter,
        appendToOutput,
    };
};
