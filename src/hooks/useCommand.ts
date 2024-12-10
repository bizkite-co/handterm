// src/hooks/useCommand.ts
import React, { useContext, useState, useCallback, useEffect } from 'react';
import { CommandContext, ICommandResponse } from '../contexts/CommandContext';
import { parsedCommandToString, loadCommandHistory, saveCommandHistory } from '../utils/commandUtils';
import { LogKeys } from '../types/TerminalTypes';
import { commandRegistry } from '../commands/commandRegistry';
import { ActivityType, OutputElement, ParsedCommand } from '../types/Types';
import { useActivityMediator } from './useActivityMediator';
import { activitySignal, appendToOutput } from 'src/signals/appSignals';
import { useComputed } from '@preact/signals-react';
import { useWPMCalculator } from './useWPMCaculator';
import { setCommandTime } from 'src/signals/commandLineSignals';
import { createLogger } from 'src/utils/Logger';

const logger = createLogger({ prefix: 'useCommand' });

export const useCommand = () => {
    const [output, setOutput] = useState<React.ReactNode[]>([]);
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [commandHistoryIndex, setCommandHistoryIndex] = useState(-1);
    const [_commandHistoryFilter, _setCommandHistoryFilter] = useState<string | null>(null);
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
            logger.debug('Loaded command history:', savedHistory);
            setCommandHistory(savedHistory);
        }
    }, []);

    const resetOutput = useCallback(() => {
        logger.debug('Resetting output');
        setOutput([]);
    }, []);

    const addToCommandHistory = useCallback((command: ParsedCommand | string) => {
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
        logger.debug('Retrieved command response history:', history);
        return history;
    }, []);

    const createCommandRecord = useCallback((
        command: ParsedCommand,
        response: React.ReactNode,
        status: number,
        commandTime: Date,
        sensitive?: boolean
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
            sensitive
        };
    }, [wpmCalculator]);

    const processCommandOutput = useCallback((
        command: ParsedCommand,
        response: ICommandResponse,
    ): void => {
        logger.debug('Processing command output:', { command, response });
        const commandTime = new Date();
        const outputElement = createCommandRecord(
            command,
            response.message,
            response.status,
            commandTime,
            response.sensitive
        );
        appendToOutput(outputElement);
        addToCommandHistory(command);
    }, [createCommandRecord, addToCommandHistory]);

    const executeCommand = useCallback(async (parsedCommand: ParsedCommand) => {
        // Breakpoint 5: Start of command execution
        logger.debug('Executing command:', parsedCommand);
        const command = commandRegistry.getCommand(parsedCommand.command);
        if (command && context) {
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
        logger.debug('Handling command:', { parsedCommand, activity: currentActivity.value });
        setCommandTime(new Date());
        if (currentActivity.value === ActivityType.TUTORIAL) {
            // Breakpoint 8: Tutorial progress check
            logger.debug('Processing tutorial command:', parsedCommand.command);
            checkTutorialProgress(parsedCommand.command);
        }

        await executeCommand(parsedCommand);
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
        commandHistoryFilter: _commandHistoryFilter,
        setCommandHistoryFilter: _setCommandHistoryFilter,
        appendToOutput,
    };
};
