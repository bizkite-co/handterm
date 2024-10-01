import { useCallback } from 'react';
import { ActivityType } from '../types/Types';
import { IAuthProps } from '../lib/useAuth';
import { LogKeys } from '../types/TerminalTypes';
import GamePhrases from '../utils/GamePhrases';
import { parseCommand } from '../utils/commandUtils';
import { useActivityMediatorReturn } from './useActivityMediator';

interface UseCommandHandlerProps {
  auth: IAuthProps;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  updateUserName: () => void;
  writeOutput: (output: string) => void;
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  setEditContent: React.Dispatch<React.SetStateAction<string>>;
  setEditFilePath: React.Dispatch<React.SetStateAction<string>>;
  setEditFileExtension: React.Dispatch<React.SetStateAction<string>>;
  setTargetWPM: React.Dispatch<React.SetStateAction<number>>;
  handleFocusEditor: () => void;
  activityMediator: useActivityMediatorReturn; // Use the correct type for your activityMediator
  setCurrentActivity: React.Dispatch<React.SetStateAction<ActivityType>>;
}

export const useCommandHandler = ({
  auth,
  setIsLoggedIn,
  updateUserName,
  writeOutput,
  setEditMode,
  setEditContent,
  setEditFilePath,
  setEditFileExtension,
  setTargetWPM,
  handleFocusEditor,
  activityMediator,
  setCurrentActivity,
}: UseCommandHandlerProps) => {
  const handleCommand = useCallback(async (inputCmd: string) => {
    let status = 404;
    let response = "Command not found.";

    const { parsedCommand, args } = parseCommand(inputCmd);

    if (parsedCommand === 'help' || parsedCommand === '411') {
      status = 200;
      response = "Help command executed"; // You might want to implement a proper help command
    }

    if (parsedCommand === 'special') {
      status = 200;
      response = "Special command executed"; // You might want to implement a proper special command
    }

    if (parsedCommand === 'edit') {
      const expiresAtString = auth.getExpiresAt();
      if (!expiresAtString) {
        response = "You must login to edit files.";
        writeOutput(response);
        status = 401;
        setEditMode(false);
        return;
      }
      response = `Editing ${args[0] || '_index'}.${args[1] || 'md'}`;
      setEditFilePath(args[0] || '_index');
      setEditFileExtension(args[1] || 'md');
      try {
        const fileContent = await auth.getFile(
          args[0] || '_index',
          args[1] || 'md'
        );
        setEditContent(fileContent.data as string);
        setEditMode(true);
        handleFocusEditor();
      } catch (error: any) {
        writeOutput(`Error fetching file: ${error.message}`);
      }
    }

    if (parsedCommand === 'target') {
      if (args.length === 0) {
        response = "Target WPM: " + localStorage.getItem(LogKeys.TargetWPM);
      } else {
        const targetWPM: number = parseInt(args[0], 10);
        if (!isNaN(targetWPM)) {
          setTargetWPM(targetWPM);
          localStorage.setItem(LogKeys.TargetWPM, targetWPM.toString());
          response = "Target WPM set to " + targetWPM.toString();
        } else {
          response = "Target WPM must be a number";
        }
      }
    }

    if (parsedCommand === 'show') {
      if (args.length === 0) {
        response = GamePhrases.getGamePhrasesAchieved().map((phrase: { wpm: number; phraseName: string; }) => `${phrase.wpm}:${phrase.phraseName}`).join('\n');
        status = 200;
      }
    }

    if (parsedCommand === 'cat') {
      if (args.length === 0) {
        status = 200;
        const filename = '_index';
        try {
          const userResponse: any = await auth.getFile(filename, 'md');
          if (userResponse.status === 200) {
            const content = userResponse.data.content.replaceAll('\n', '\n');
            writeOutput(content);
          } else {
            writeOutput(userResponse.error.join('\n'));
          }
        } catch (error: any) {
          console.error("Error fetching user:", error);
          writeOutput(`Error: ${error.message}`);
        }
      } else {
        const content = args.join(' ');
        auth.setUser(content);
      }
    }

    if (parsedCommand === 'profile') {
      status = 200;
      try {
        const user = await auth.getUser();
        writeOutput(JSON.stringify(user));
      } catch (error: any) {
        writeOutput(`Error fetching profile: ${error.message}`);
      }
      return;
    }

    if (parsedCommand === 'github') {
      status = 200;
      if (!localStorage.getItem(LogKeys.GitHubUsername)) {
        auth.initiateGitHubAuth();
        response = "Opening github.com for you to authenticate there.";
      } else {
        if (args.length === 1) {
          const repo = args[0];
          try {
            const tree = await auth.getRepoTree(repo);

            const treePathArray = Array.from(tree as any).map((treeItem: any) => treeItem.type === 'tree' ? `${treeItem.path}/` : treeItem.path);
            writeOutput(treePathArray.join('\n'));
          } catch (error: any) {
            writeOutput(`Error fetching repo tree: ${error.message}`);
          }
        } else {
          try {
            const repos = await auth.listRecentRepos();

            const repoNames = Array.from(repos as any).map((repo: any) => repo.name);
            localStorage.setItem(LogKeys.RepoNames, JSON.stringify(repoNames));
            writeOutput(repoNames.join('\n'));
          } catch (error: any) {
            writeOutput(`Error listing repos: ${error.message}`);
          }
        }
      }
      return;
    }

    if (parsedCommand === 'logout') {
      auth.logout();
      response = "Logged out successfully.";
      status = 200;
      setIsLoggedIn(false);
      updateUserName();
    }

    activityMediator.gameHandleRef.current?.resetGame();

    if (activityMediator.isInGameMode) {
      response = '';
    }

    if (parsedCommand === '') return;
    if (parsedCommand.startsWith('debug')) {
      let isDebug = parsedCommand.includes('--true') || parsedCommand.includes('-t');
      localStorage.setItem('xterm-debug', String(isDebug));
      return;
    }

    writeOutput(response);
    return { status, response };
  }, [auth, setIsLoggedIn, updateUserName, writeOutput, setEditMode, setEditContent, setEditFilePath, setEditFileExtension, setTargetWPM, handleFocusEditor, activityMediator, setCurrentActivity]);

  return { handleCommand };
};
