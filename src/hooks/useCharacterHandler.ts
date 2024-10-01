import { useCallback, useRef } from 'react';
import { IWPMCalculator } from '../utils/WPMCalculator';
import { CharDuration, LogKeys } from '../types/TerminalTypes';

interface UseCharacterHandlerProps {
  wpmCalculator: IWPMCalculator;
  setCommandLine: React.Dispatch<React.SetStateAction<string>>;
  setLastTypedCharacter: React.Dispatch<React.SetStateAction<string | null>>;
  isInSvgMode: boolean;
  isInLoginProcess: boolean;
  setIsInLoginProcess: React.Dispatch<React.SetStateAction<boolean>>;
  writeOutputInternal: (output: string) => void;
  auth: any; // Replace 'any' with the correct type for your auth object
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  updateUserName: () => void;
  terminalReset: () => void;
  prompt: () => void;
}

export type { UseCharacterHandlerProps };

export const useCharacterHandler = ({
  wpmCalculator,
  setCommandLine,
  setLastTypedCharacter,
  isInSvgMode,
  isInLoginProcess,
  setIsInLoginProcess,
  writeOutputInternal,
  auth,
  setIsLoggedIn,
  updateUserName,
  terminalReset,
  prompt,
}: UseCharacterHandlerProps) => {
  const tempUserNameRef = useRef<string>('');
  const tempPasswordRef = useRef<string>('');

  const handleCharacter = useCallback((character: string): number|CharDuration => {
    const charDuration = wpmCalculator.addKeystroke(character);
    setCommandLine((prev) => prev + character);
    localStorage.setItem('currentCharacter', character);

    if (isInSvgMode) {
      setLastTypedCharacter(character);
    } else {
      setLastTypedCharacter(null);
    }

    if (isInLoginProcess) {
      if (character === '\r') {
        setIsInLoginProcess(false);
        (async () => {
          try {
            const result = await auth.login(tempUserNameRef.current, tempPasswordRef.current);
            if (result.status === 200) {
              writeOutputInternal(`Login successful! Status: ${JSON.stringify(result.status)}`);
              localStorage.setItem(LogKeys.Username, tempUserNameRef.current);
              setIsLoggedIn(true);
              updateUserName();
            } else {
              writeOutputInternal(`Login failed! Status: ${JSON.stringify(result.status)}<br />${result.message}`);
              setIsLoggedIn(false);
            }
            prompt();
          } catch (error: any) {
            writeOutputInternal(`Login failed: ${error.message}`);
          } finally {
            tempUserNameRef.current = '';
            tempPasswordRef.current = '';
            tempUserNameRef.current = '';
            tempPasswordRef.current = '';
            terminalReset();
          }
        })();
        return 0;
      } else {
        tempPasswordRef.current += character;
        return 0;
      }
    }

    return charDuration;
  }, [wpmCalculator, setCommandLine, setLastTypedCharacter, isInSvgMode, isInLoginProcess, setIsInLoginProcess, writeOutputInternal, auth, setIsLoggedIn, updateUserName, terminalReset, prompt]);

  return { handleCharacter };
};
