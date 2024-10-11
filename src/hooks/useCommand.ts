// src/hooks/useCommand.ts
import React, { useContext, useState, useCallback } from 'react';
import { CommandContext } from '../contexts/CommandContext';
import { parseCommand } from '../utils/commandUtils';
import { LogKeys } from '../types/TerminalTypes';
import { commandRegistry } from '../commands/commandRegistry';
import { useAppContext } from '../contexts/AppContext';
import { ActivityType, OutputElement, ParsedCommand, WPMs } from '../types/Types';
import { useActivityMediator } from './useActivityMediator';
import { useTutorial } from './useTutorials';
import { activitySignal } from 'src/signals/activitySignals';
import { useComputed } from '@preact/signals-react';
import { useWPMCalculator } from './useWPMCaculator';

export interface IUseCommandProps { }

export const useCommand = () => {
    const [output, setOutput] = useState<React.ReactNode[]>([]);
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [commandHistoryIndex, setCommandHistoryIndex] = useState(-1);
    const [commandHistoryFilter, setCommandHistoryFilter] = useState<string | null>(null);
    const { appendToOutput } = useAppContext();
    const { unlockTutorial, getNextTutorial } = useTutorial();
    const currentActivity = useComputed(() => activitySignal.value);
    const { 
        handleCommandExecuted, determineActivityState, 
        checkTutorialProgress 
    } = useActivityMediator({
        currentActivity,
    });
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

    const executeCommand = useCallback(async (inputCmd: string) => {
        const parsedCommand: ParsedCommand = parseCommand(inputCmd);
        const command = commandRegistry.getCommand(parsedCommand.command);
        if (command && context) {
            const response = await command.execute(context, parsedCommand);
            processCommandOutput(inputCmd, response.message, response.status);
            handleCommandExecuted(parsedCommand);
        } else {
            // Fix: Correct the arguments for processCommandOutput
            const response = currentActivity.value === ActivityType.TUTORIAL ? `Tutorial attempt: ${inputCmd}` : `Command not found: ${inputCmd}`;
            processCommandOutput(inputCmd, response, 404);
            handleCommandExecuted(parsedCommand);
        }
    }, [context, processCommandOutput, handleCommandExecuted]);

    const handleCommand = useCallback((input: string) => {
        if (currentActivity.value === ActivityType.TUTORIAL) {
            checkTutorialProgress(input);
            // TODO: Write result to output
        }

        executeCommand(input);
    }, [currentActivity.value, unlockTutorial, executeCommand, getNextTutorial, determineActivityState]);

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
