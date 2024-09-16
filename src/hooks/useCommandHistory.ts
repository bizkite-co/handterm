import { useState, useCallback } from 'react';
import { LogKeys } from '../types/TerminalTypes';

export const useCommandHistory = (initialHistory: string[]) => {
  const [commandHistory, setCommandHistory] = useState(initialHistory);
  const [commandHistoryIndex, setCommandHistoryIndex] = useState(-1);
  const [commandHistoryFilter, setCommandHistoryFilter] = useState<string | null>(null);

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

  return {
    commandHistory,
    commandHistoryIndex,
    commandHistoryFilter,
    setCommandHistoryIndex,
    setCommandHistoryFilter,
    addToCommandHistory,
    getCommandResponseHistory,
  };
};
