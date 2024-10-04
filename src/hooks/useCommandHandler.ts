// hooks/useCommandHandler.ts
import { RefObject, useCallback } from 'react';
import { ActivityType } from '../types/Types';
import { IAuthProps } from '../lib/useAuth';
import { LogKeys } from '../types/TerminalTypes';
import GamePhrases from '../utils/GamePhrases';
import { parseCommand } from '../utils/commandUtils';
import { useActivityMediatorReturn } from './useActivityMediator';
import { commandRegistry } from '../commands/commandRegistry';
import { IHandTermWrapperMethods } from 'src/components/HandTermWrapper';

export interface IUseCommandHandlerProps {
  handTermRef: React.MutableRefObject<IHandTermWrapperMethods | null>;
  auth: IAuthProps;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  updateUserName: () => void;
  writeOutput: (output: string) => void;
  setEditContent: React.Dispatch<React.SetStateAction<string>>;
  setEditFilePath: React.Dispatch<React.SetStateAction<string>>;
  setEditFileExtension: React.Dispatch<React.SetStateAction<string>>;
  setTargetWPM: React.Dispatch<React.SetStateAction<number>>;
  handleFocusEditor: () => void;
  activityMediator: useActivityMediatorReturn;
  setCurrentActivity: React.Dispatch<React.SetStateAction<ActivityType>>;
}

export const useCommandHandler = (props: IUseCommandHandlerProps) => {
  const handleCommand = useCallback(async (inputCmd: string) => {
    let status = 404;
    let response = "Command not found.";

    const { parsedCommand, args, switches } = parseCommand(inputCmd);
    const command = commandRegistry.getCommand(parsedCommand);

    if (command) {
      const result = command.execute(parsedCommand, args, switches, props.handTermRef);
      return result;
    }

    // Existing command logic
    switch (parsedCommand) {
      case 'special':
        status = 200;
        response = "Special command executed";
        break;
      case 'edit':
        const expiresAtString = props.auth.getExpiresAt();
        if (!expiresAtString) {
          response = "You must login to edit files.";
          props.writeOutput(response);
          status = 401;
          props.activityMediator.determineActivityState(ActivityType.NORMAL);
          return;
        }
        response = `Editing ${args[0] || '_index'}.${args[1] || 'md'}`;
        props.setEditFilePath(args[0] || '_index');
        props.setEditFileExtension(args[1] || 'md');
        try {
          const fileContent = await props.auth.getFile(
            args[0] || '_index',
            args[1] || 'md'
          );
          props.setEditContent(fileContent.data as string);
          props.activityMediator.determineActivityState(ActivityType.EDIT);
          props.handleFocusEditor();
        } catch (error: any) {
          props.writeOutput(`Error fetching file: ${error.message}`);
        }
        break;
      case 'target':
        // ... (existing target command logic)
        break;
      case 'show':
        // ... (existing show command logic)
        break;
      case 'cat':
        // ... (existing cat command logic)
        break;
      case 'profile':
        // ... (existing profile command logic)
        break;
      case 'github':
        // ... (existing github command logic)
        break;
      case 'logout':
        // ... (existing logout command logic)
        break;
      default:
        // No matching command found
        break;
    }

    props.handTermRef.current?.writeOutput(response);
    return { status, response };
  }, [props.handTermRef]);

  return { handleCommand };
};