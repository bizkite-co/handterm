import { LogKeys } from '../types/TerminalTypes';
import { ICommand, ICommandContext } from '../contexts/CommandContext';

export const archiveCommand: ICommand = {
    name: 'archive',
    description: 'Archive the current command history',
    execute: (
        _commandName: string,
        context: ICommandContext,
        _args?: string[],
        _switches?: Record<string, boolean | string>,
    ) => {
        const archiveNext = async (index: number) => {
            if (index >= localStorage.length) return { status: 200, message: 'Command history archived.' }; // Stop if we've processed all items

            const key = localStorage.key(index);
            if (!key) {
                archiveNext(index + 1); // Skip and move to the next item
                return {
                    status: 500,
                    message: 'Stopping archive due to localStorage key not found.'
                };
            }

            if (key.startsWith(LogKeys.Command + '_') || key.startsWith(LogKeys.CharTime + '_')) {

                if (key.includes('_archive_')) {
                    localStorage.removeItem(key);
                } else {
                    const logKey = key.substring(0, key.indexOf('_'));
                    const content = localStorage.getItem(key);
                    if (content) {
                        (async () => {
                            try {
                                const result = await (_handTerm.current as any)?.props.auth.saveLog(key, content, 'json');
                                if (!result) {
                                    // If saveLog returns false, stop the archiving process
                                    context.appendToOutput("Stopping archive due to saveLog returning false.");
                                    return {
                                        status: 500,
                                        message: 'Stopping archive due to saveLog returning false.'
                                    };
                                }
                                localStorage.setItem(key.replace(logKey, logKey + '_archive'), content);
                                localStorage.removeItem(key);
                            } catch (e: any) {
                                context.appendToOutput(e.message);
                            }
                        })();
                    }
                }
            }

            // Use setTimeout to avoid blocking the main thread
            // and process the next item in the next event loop tick
            setTimeout(() => archiveNext(index + 1), 300);
        };

        archiveNext(0); // Start processing from the first item
        _handTerm.current?.prompt();
        return { status: 200, message: 'Command history archived.' };
    },
}
