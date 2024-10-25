import { useCallback } from 'react';
import { isInLoginProcessSignal, isInSignUpProcessSignal } from 'src/signals/appSignals';

interface IUseCharacterHandlerProps {
  setCommandLine: React.Dispatch<React.SetStateAction<string>>;
  setLastTypedCharacter: (value:string|null) => void;
  isInSvgMode: boolean;
  isInLoginProcess: boolean;
  writeOutputInternal: (output: string) => void;
}

export type { IUseCharacterHandlerProps };

export const useCharacterHandler = ({
  setCommandLine,
  setLastTypedCharacter,
  isInSvgMode,
  writeOutputInternal,
}: IUseCharacterHandlerProps) => {

  const handleCharacter = useCallback((character: string) => {
    localStorage.setItem('currentCharacter', character);

    if (isInSvgMode) {
      setLastTypedCharacter(character);
    } else {
      setLastTypedCharacter(null);
    }

    if (isInSignUpProcessSignal.value || isInLoginProcessSignal.value) {
      writeOutputInternal('*');
    }

    return;
  }, [ 
    setLastTypedCharacter, 
    isInSvgMode, 
    writeOutputInternal, 
  ]);

  return { handleCharacter };
};
