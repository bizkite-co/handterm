import React from 'react';

interface CommandOutputProps {
    output: string;
    status: number;
}

const CommandOutput: React.FC<CommandOutputProps> = ({ output, status }) => {
    return (
        <div>
            <span>Status: {status}</span>
            <pre>{output}</pre>
        </div>
    );
};

export default CommandOutput;