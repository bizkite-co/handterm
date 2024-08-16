import React from 'react';
import CommandOutput from '../components/CommandOutput';

interface UpdateCommandHistoryProps {
    cmd: string;
    state: any;
    setState: (state: any) => void;
    saveCommandHistory: (history: string[]) => void;
}

const UpdateCommandHistory: React.FC<UpdateCommandHistoryProps> = ({ cmd, state,
    setState, saveCommandHistory }) => {
    if (cmd && cmd !== 'Return (ENTER)') {
        setState({
            ...state,
            commandHistory: [cmd, ...state.commandHistory],
            commandHistoryIndex: -1,
            commandHistoryFilter: null
        });
        saveCommandHistory(state.commandHistory);
        return <CommandOutput output="Command history updated" status={200} />;
    }
    return null;
};

export default UpdateCommandHistory;