// src/hooks/useCommand.ts
import React, { useContext, useState, useCallback } from 'react';
import { CommandContext } from '../contexts/CommandContext';
import { parseCommand } from '../utils/commandUtils';
import { LogKeys } from '../types/TerminalTypes';
import { TimeDisplay } from '../components/TimeDisplay';
import WpmTable from '../components/WpmTable';
import { commandRegistry } from '../commands/commandRegistry';
import { useWPMCalculator, WPMs } from './useWPMCaculator';
import { useAppContext } from '../contexts/AppContext';
import { useActivityMediatorContext } from '../contexts/ActivityMediatorContext';
import { ActivityType, OutputElement, ParsedCommand, WPM } from '../types/Types';
import { useActivityMediator } from './useActivityMediator';
import { useTutorial } from './useTutorials';
import { CommandOutput } from 'src/components/CommandOutput';

export interface IUseCommandProps { }

export const useCommand = () => {
    const [output, setOutput] = useState<React.ReactNode[]>([]);
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [commandHistoryIndex, setCommandHistoryIndex] = useState(-1);
    const [commandHistoryFilter, setCommandHistoryFilter] = useState<string | null>(null);
    const wpmCalculator = useWPMCalculator();
    const { appendToOutput } = useAppContext();
    const { currentActivity } = useActivityMediatorContext();
    const { unlockTutorial, getNextTutorial } = useTutorial();
    const { handleCommandExecuted, determineActivityState } = useActivityMediator({
        currentActivity,
        startGame: function (): void {
            throw new Error('Function not implemented.');
        }
    });

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
        wpms: WPMs,
        commandTime: Date
    ): OutputElement => {
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
        wpms: WPMs
    ): void => {
        const commandTime = new Date();
        const outputElement = createCommandRecord(command, response, status, wpms, commandTime);
        appendToOutput(outputElement);
        addToCommandHistory(command);
    }, [createCommandRecord, appendToOutput, addToCommandHistory]);

    const executeCommand = useCallback(async (inputCmd: string, wpms: WPMs) => {
        const parsedCommand: ParsedCommand = parseCommand(inputCmd);
        const command = commandRegistry.getCommand(parsedCommand.command);
        if (command && context) {
            const response = await command.execute(context, parsedCommand);
            processCommandOutput(inputCmd, response.message, response.status, wpms);
            handleCommandExecuted(parsedCommand);
        } else {
            // Fix: Correct the arguments for processCommandOutput
            processCommandOutput(inputCmd, `Command not found: ${parsedCommand.command}`, 404, wpms);
            handleCommandExecuted(parsedCommand);
        }
    }, [context, processCommandOutput, handleCommandExecuted]);

    const handleCommand = useCallback((input: string, wpms: WPMs) => {
        executeCommand(input, wpms);
        if (currentActivity === ActivityType.TUTORIAL) {
            const tutorialCompleted = unlockTutorial(input);
            if (tutorialCompleted) {
                console.log(`Tutorial \"${input}\" completed!`, tutorialCompleted);
                const nextTutorial = getNextTutorial();
                if (nextTutorial) {
                    // Move to the next tutorial
                    determineActivityState(ActivityType.TUTORIAL);
                } else {
                    // All tutorials completed, move to normal mode
                    determineActivityState(ActivityType.NORMAL);
                }
            } else {
                console.log('Try again!');
            }
        }
    }, [currentActivity, unlockTutorial, executeCommand, getNextTutorial, determineActivityState]);

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
