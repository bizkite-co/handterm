// src/hooks/useCommand.ts
import React, { useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { CommandContext, ICommandResponse } from '../contexts/CommandContext';
import { parseCommand, parsedCommandToString, loadCommandHistory, saveCommandHistory } from '../utils/commandUtils';
import { LogKeys } from '../types/TerminalTypes';
import { commandRegistry } from '../commands/commandRegistry';
import { ActivityType, OutputElement, ParsedCommand, WPMs } from '../types/Types';
import { useActivityMediator } from './useActivityMediator';
import { activitySignal, appendToOutput } from 'src/signals/appSignals';
import { useComputed } from '@preact/signals-react';
import { useWPMCalculator } from './useWPMCaculator';
import { setCommandTime } from 'src/signals/commandLineSignals';
import { useAuth } from 'src/hooks/useAuth';

export const useCommand = () => {
    const [output, setOutput] = useState<React.ReactNode[]>([]);
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [commandHistoryIndex, setCommandHistoryIndex] = useState(-1);
    const [commandHistoryFilter, setCommandHistoryFilter] = useState<string | null>(null);
    const currentActivity = useComputed(() => activitySignal.value);
    const {
        handleCommandExecuted,
        checkTutorialProgress
    } = useActivityMediator();
    const wpmCalculator = useWPMCalculator();
    const context = useContext(CommandContext);

    if (context === undefined) {
        throw new Error('useCommand must be used within a CommandProvider');
    }

    // Load command history from localStorage on mount
    useEffect(() => {
        const savedHistory = loadCommandHistory();
        if (savedHistory && savedHistory.length > 0) {
            setCommandHistory(savedHistory);
        }
    }, []);

    const resetOutput = useCallback(() => {
        setOutput([]);
    }, []);

    const addToCommandHistory = useCallback((command: string) => {
        setCommandHistory(prev => {
            // Don't add if it's identical to the previous command
            if (prev.length > 0 && prev[prev.length - 1] === command) {
                return prev;
            }
            const newHistory = [...prev, command].slice(-120); // Keep last 120 commands
            saveCommandHistory(newHistory); // Save to localStorage whenever history changes
            return newHistory;
        });
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
        for (const key of keys) {
            const historyJSON = localStorage.getItem(key);
            if (historyJSON) {
                history.push(historyJSON);
            }
        }
        return history;
    }, []);

    const createCommandRecord = useCallback((
        command: ParsedCommand,
        response: ReactNode,
        status: number,
        commandTime: Date,
        sensitive?: boolean
    ): OutputElement => {
        const wpms = wpmCalculator.getWPMs();
        return {
            command,
            response,
            status,
            wpmAverage: wpms.wpmAverage,
            characterAverages: wpms.charWpms,
            commandTime,
            sensitive
        };
    }, []);

    const processCommandOutput = useCallback((
        command: ParsedCommand,
        response: ICommandResponse,
    ): void => {
        const commandTime = new Date();
        const outputElement = createCommandRecord(
            command,
            response.message,
            response.status,
            commandTime,
            response.sensitive
        );
        appendToOutput(outputElement);
        addToCommandHistory(parsedCommandToString(command));
    }, [createCommandRecord, appendToOutput, addToCommandHistory]);

    const executeCommand = useCallback(async (parsedCommand: ParsedCommand) => {
        const command = commandRegistry.getCommand(parsedCommand.command);
        if (command && context) {
            try {
                const response = await command.execute(context, parsedCommand);
                processCommandOutput(parsedCommand, response);
                handleCommandExecuted(parsedCommand);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                processCommandOutput(parsedCommand, {
                    status: 500,
                    message: errorMessage
                });
                handleCommandExecuted(parsedCommand);
            }
        } else {
            const response = currentActivity.value === ActivityType.TUTORIAL ? `Tutorial attempt: ${parsedCommand.command}` : `Command not found: ${parsedCommand.command}`;
            processCommandOutput(parsedCommand, {
                status: 404,
                message: response
            });
            handleCommandExecuted(parsedCommand);
        }
    }, [context, processCommandOutput, handleCommandExecuted, currentActivity]);

    const handleCommand = useCallback(async (parsedCommand: ParsedCommand) => {
        setCommandTime(new Date());
        if (currentActivity.value === ActivityType.TUTORIAL) {
            checkTutorialProgress(parsedCommand.command);
            // TODO: Write result to output
        }

        await executeCommand(parsedCommand);
    }, [currentActivity.value, executeCommand, setCommandTime, checkTutorialProgress]);

    return {
        output,
        resetOutput,
        commandHistory,
        addToCommandHistory,
        getCommandResponseHistory,
        handleCommand,
        commandHistoryIndex,
        setCommandHistoryIndex,
        commandHistoryFilter,
        setCommandHistoryFilter,
        appendToOutput,
    };
};
