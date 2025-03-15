// src/hooks/useCommand.ts
import { useComputed } from '@preact/signals-react';
import type React from 'react';
import { useContext, useState, useCallback, useEffect } from 'react';

import { activitySignal, appendToOutput } from 'src/signals/appSignals';
import { setCommandTime } from 'src/signals/commandLineSignals';
import { createLogger } from 'src/utils/Logger';

import { commandRegistry } from '../commands/commandRegistry';
import { CommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { ActivityType, StorageKeys } from '@handterm/types';
import { type OutputElement, type ParsedCommand } from '../types/Types';
import { parsedCommandToString, loadCommandHistory, saveCommandHistory } from '../utils/commandUtils';

import { useActivityMediator } from './useActivityMediator';
import { useWPMCalculator } from './useWPMCaculator';


const logger: ReturnType<typeof createLogger> = createLogger({ prefix: 'useCommand' });

export const useCommand = (): {
    output: OutputElement[];
    resetOutput: () => void;
    commandHistory: string[];
    addToCommandHistory: (command: ParsedCommand | string) => void;
    getCommandResponseHistory: () => string[];
    handleCommand: (parsedCommand: ParsedCommand) => Promise<void>;
    commandHistoryIndex: number;
    setCommandHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
    commandHistoryFilter: string | null;
    setCommandHistoryFilter: React.Dispatch<React.SetStateAction<string | null>>;
    appendToOutput: (outputElement: OutputElement) => void;
    executeCommand: (parsedCommand: ParsedCommand) => Promise<void>;
} => {
    const [output, setOutput] = useState<OutputElement[]>([]);
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

    // Handle wc-init and wc-exit commands
    const handleWebContainerCommands = (command: string) => {
        if (command === 'wc-init') {
            context?.updateLocation({ activityKey: ActivityType.WEBCONTAINER });
            return true;
        } else if (command === 'wc-exit') {
            context?.updateLocation({ activityKey: ActivityType.NORMAL });
            return true;
        }
        return false;
    }

    if (context === undefined) {
        throw new Error('useCommand must be used within a CommandProvider');
    }

    // Load command history from localStorage on mount
    useEffect(() => {
        const savedHistory = loadCommandHistory();
        if (savedHistory && savedHistory.length > 0) {
            logger.debug('Loaded command history:', savedHistory);
            setCommandHistory(savedHistory);
        }
    }, []);

    const resetOutput = useCallback((): void => {
        logger.debug('Resetting output');
        setOutput([]);
    }, []);

    const addToCommandHistory = useCallback((command: ParsedCommand | string): void => {
        const commandString = typeof command === 'string'
            ? command
            : parsedCommandToString(command);

        logger.debug('Adding to command history:', commandString);
        setCommandHistory(prev => {
            // Don't add if it's identical to the previous command
            if (prev.length > 0 && prev[prev.length - 1] === commandString) {
                return prev;
            }
            const newHistory = [...prev, commandString].slice(-120); // Keep last 120 commands
            saveCommandHistory(newHistory); // Save to localStorage whenever history changes
            return newHistory;
        });
    }, []);

    const getCommandResponseHistory = useCallback((): string[] => {
        const keys: string[] = [];
        const history: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(StorageKeys.command + '_')) {
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
        logger.debug('Retrieved command response history:', history);
        return history;
    }, []);

    const createCommandRecord = useCallback((
        command: ParsedCommand,
        response: React.ReactNode,
        status: number,
        commandTime: Date,
        sensitive: boolean
    ): OutputElement => {
        const wpms = wpmCalculator.getWPMs();
        logger.debug('Creating command record:', { command, response, status });
        return {
            command,
            response,
            status,
            wpmAverage: wpms.wpmAverage,
            characterAverages: wpms.charWpms,
            commandTime,
            sensitive: sensitive ?? false
        };
    }, [wpmCalculator]);

    const processCommandOutput = useCallback((
        command: ParsedCommand,
        response: ICommandResponse,
    ): void => {
        logger.debug('Processing command output:', { command, response });
        const commandTime = new Date();
        if (response.type === 'webcontainer') {
            // Use non-null assertion here
            context!.handTermRef.current!.writeOutput(response.message);
        } else {
            const outputElement = createCommandRecord(
                command,
                response.message,
                response.status,
                commandTime,
                response.sensitive ?? false
            );
            appendToOutput(outputElement);
            addToCommandHistory(command);
        }

    }, [createCommandRecord, addToCommandHistory, context]);

    const executeCommand = useCallback(async (parsedCommand: ParsedCommand) => {
        // Breakpoint 5: Start of command execution
        logger.debug('Executing command:', parsedCommand);

        const command = commandRegistry.getCommand(parsedCommand.command);
        if (command != null && context != null) {
            try {
                const response = await command.execute(context, parsedCommand);
                logger.debug('Command executed successfully:', response);
                processCommandOutput(parsedCommand, response);
                handleCommandExecuted(parsedCommand);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                logger.error('Command execution failed:', error);
                processCommandOutput(parsedCommand, {
                    status: 500,
                    message: errorMessage
                });
                handleCommandExecuted(parsedCommand);
            }
        } else {
            // Breakpoint 6: Tutorial command handling
            const response = currentActivity.value === ActivityType.TUTORIAL ? `Tutorial attempt: ${parsedCommand.command}` : `Command not found: ${parsedCommand.command}`;
            logger.debug('Command not found:', { command: parsedCommand.command, activity: currentActivity.value });
            processCommandOutput(parsedCommand, {
                status: 404,
                message: response
            });
            handleCommandExecuted(parsedCommand);
        }
    }, [context, processCommandOutput, handleCommandExecuted, currentActivity]);

    const handleCommand = useCallback(async (parsedCommand: ParsedCommand) => {
        // Breakpoint 7: Start of command handling
        const initialActivity = currentActivity.value;
        logger.debug('Handling command:', {
            parsedCommand,
            activity: initialActivity,
            timestamp: new Date().toISOString()
        });

        setCommandTime(new Date());

        // Handle webcontainer commands first
        if (handleWebContainerCommands(parsedCommand.command)) {
            return;
        }

        // Only check tutorial progress if we're explicitly in tutorial mode
        if (initialActivity === ActivityType.TUTORIAL) {
            // Breakpoint 8: Tutorial progress check
            logger.debug('Processing tutorial command:', {
                command: parsedCommand.command,
                activity: initialActivity
            });
            checkTutorialProgress(parsedCommand.command);

            // If activity changed during tutorial progress check, skip command execution
            if (currentActivity.value !== initialActivity) {
                logger.debug('Activity changed during tutorial progress - skipping command execution');
                return;
            }
        } else {
            logger.debug('Processing non-tutorial command:', {
                command: parsedCommand.command,
                activity: initialActivity
            });
        }

        await executeCommand(parsedCommand);

        logger.debug('Command handling complete:', {
            parsedCommand,
            activity: currentActivity.value,
            timestamp: new Date().toISOString()
        });
    }, [currentActivity.value, executeCommand, checkTutorialProgress]);

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
        executeCommand
    };
};
