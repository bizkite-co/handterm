import { useCallback } from 'react';

import { isInLoginProcessSignal, isInSignUpProcessSignal } from 'src/signals/appSignals';

interface IUseCharacterHandlerProps {
  setLastTypedCharacter: (value:string|null) => void;
  isInSvgMode: boolean;
  writeOutputInternal: (output: string) => void;
}

export type { IUseCharacterHandlerProps };

interface UseCharacterHandlerReturn {
  handleCharacter: (character: string) => void;
}

export const useCharacterHandler = ({
  setLastTypedCharacter,
  isInSvgMode,
  writeOutputInternal,
}: IUseCharacterHandlerProps): UseCharacterHandlerReturn => {

  const handleCharacter = useCallback((character: string): void => {
    localStorage.setItem('currentCharacter', character);

    if (isInSvgMode) {
      setLastTypedCharacter(character);
    } else {
      setLastTypedCharacter(null);
    }

    if (isInSignUpProcessSignal.value || isInLoginProcessSignal.value) {
      writeOutputInternal('*');
    }

  }, [
    setLastTypedCharacter,
    isInSvgMode,
    writeOutputInternal,
  ]);

  return { handleCharacter } satisfies UseCharacterHandlerReturn;
};
