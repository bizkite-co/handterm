import { isNullOrEmptyString } from '../utils/typeSafetyUtils';
import { type ICommand, type ICommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { StorageKeys } from '../types/TerminalTypes';
import { type ParsedCommand, type OutputElement } from '../types/Types';

interface HandTermProps {
    auth: {
        saveLog: (key: string, content: string, format: string) => Promise<boolean>;
    };
    prompt: () => void;
}

interface HandTermCurrent {
    current?: {
        props: HandTermProps;
        prompt: () => void;
    } | null;
}

export const archiveCommand: ICommand = {
    name: 'archive',
    description: 'Archive the current command history',
    execute: async (
        context: ICommandContext,
        parsedCommand: ParsedCommand,
    ): Promise<ICommandResponse> => {
        const archiveNext = async (index: number): Promise<ICommandResponse> => {
            if (index >= localStorage.length) return { status: 200, message: 'Command history archived.' }; // Stop if we've processed all items

            const key = localStorage.key(index);
            if (isNullOrEmptyString(key)) {
                await archiveNext(index + 1); // Skip and move to the next item
                return {
                    status: 500,
                    message: 'Stopping archive due to localStorage key not found.'
                };
            }

            if (key.startsWith(StorageKeys.command + '_') || key.startsWith(StorageKeys.charTime + '_')) {
                if (key.includes('_archive_')) {
                    localStorage.removeItem(key);
                } else {
                    const logKey = key.substring(0, key.indexOf('_'));
                    const content = localStorage.getItem(key);
                    if (content !== null && content !== '') {
                        try {
                            const _handTerm: HandTermCurrent = window._handTerm ?? { current: null };

                            if (
                                _handTerm.current === null
                                || _handTerm.current === undefined
                                || _handTerm.current.props === null
                                || _handTerm.current.props.auth === null
                            ) {
                                const outputElement: OutputElement = {
                                    command: parsedCommand,
                                    response: 'Authentication not available.',
                                    status: 500,
                                    commandTime: new Date()
                                };
                                context.appendToOutput(outputElement);
                                return {
                                    status: 500,
                                    message: 'Authentication not available.'
                                };
                            }

                            const result = await _handTerm.current.props.auth.saveLog(key, content, 'json');
                            if (!result) {
                                // If saveLog returns false, stop the archiving process
                                const outputElement: OutputElement = {
                                    command: parsedCommand,
                                    response: 'Stopping archive due to saveLog returning false.',
                                    status: 500,
                                    commandTime: new Date()
                                };
                                context.appendToOutput(outputElement);
                                return {
                                    status: 500,
                                    message: 'Stopping archive due to saveLog returning false.'
                                };
                            }
                            localStorage.setItem(key.replace(logKey, logKey + '_archive'), content);
                            localStorage.removeItem(key);
                        } catch (e) {
                            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
                            const outputElement: OutputElement = {
                                command: parsedCommand,
                                response: `Archive error: ${errorMessage}`,
                                status: 500,
                                commandTime: new Date()
                            };
                            context.appendToOutput(outputElement);
                            return {
                                status: 500,
                                message: `Archive error: ${errorMessage}`
                            };
                        }
                    }
                }
            }

            // Use setTimeout to avoid blocking the main thread
            // and process the next item in the next event loop tick
            return new Promise((resolve) => {
                setTimeout(() => {
                    archiveNext(index + 1).then(resolve).catch((error: unknown) => {
                        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
                        const outputElement: OutputElement = {
                            command: parsedCommand,
                            response: `Archive error: ${errorMessage}`,
                            status: 500,
                            commandTime: new Date()
                        };
                        context.appendToOutput(outputElement);
                        resolve({
                            status: 500,
                            message: `Archive error: ${errorMessage}`
                        });
                    });
                }, 300);
            });
        };

        // Ensure _handTerm is defined in the global scope
        if (typeof window._handTerm === 'undefined') {
            window._handTerm = { current: null };
        }

        const result = await archiveNext(0); // Start processing from the first item
        window._handTerm.current?.prompt();
        return result;
    },
}

// Extend the global Window interface to include _handTerm
declare global {
    interface Window {
        _handTerm: HandTermCurrent;
    }
}
