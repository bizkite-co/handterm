// src/hooks/useCommand.ts
import React, { useContext, useState, useCallback } from 'react';
import { CommandContext } from '../contexts/CommandContext';
import { parseCommand } from '../utils/commandUtils';
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

    const createCommandRecord = useCallback((
        command: string,
        response: string,
        status: number,
        commandTime: Date
    ): OutputElement => {
        const wpms = wpmCalculator.getWPMs();
        return {
            command,
            response,
            status,
            wpmAverage: wpms.wpmAverage,
            characterAverages: wpms.charWpms,
            commandTime
        };
    }, []);

    const processCommandOutput = useCallback((
        command: string,
        response: string,
        status: number,
    ): void => {
        const commandTime = new Date();
        const outputElement = createCommandRecord(command, response, status, commandTime);
        appendToOutput(outputElement);
        addToCommandHistory(command);
    }, [createCommandRecord, appendToOutput, addToCommandHistory]);

    const executeCommand = useCallback(async (parsedCommand: ParsedCommand) => {
        const command = commandRegistry.getCommand(parsedCommand.command);
        if (command && context) {
            const response = command.execute(context, parsedCommand);
            processCommandOutput(parsedCommand.command, response.message, response.status);
            handleCommandExecuted(parsedCommand);
        } else {
            const response = currentActivity.value === ActivityType.TUTORIAL ? `Tutorial attempt: ${parsedCommand.command}` : `Command not found: ${parsedCommand.command}`;
            processCommandOutput(parsedCommand.command, response, 404);
            handleCommandExecuted(parsedCommand);
        }
    }, [context, processCommandOutput, handleCommandExecuted, currentActivity]);

    const handleCommand = useCallback((parsedCommand: ParsedCommand) => {
        setCommandTime(new Date());
        if (currentActivity.value === ActivityType.TUTORIAL) {
            checkTutorialProgress(parsedCommand.command);
            // TODO: Write result to output
        }

        executeCommand(parsedCommand);
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
