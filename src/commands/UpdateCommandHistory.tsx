import React from 'react';
import CommandOutput from '../components/CommandOutput';
import { saveCommandHistory } from '../utils/commandUtils';

interface UpdateCommandHistoryProps {
    cmd: string;
    state: any;
    setState: (state: any) => void;
}

const UpdateCommandHistory: React.FC<UpdateCommandHistoryProps> = ({ cmd, state,
    setState }) => {
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