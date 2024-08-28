import React from 'react';
import { TerminalCssClasses } from "src/types/TerminalTypes"

interface PromptProps {
    domain: string;
    username: string;
    timestamp: string;
    githubUsername: string;
}

export const Prompt: React.FC<PromptProps> = ({ domain, username, timestamp, githubUsername }) => {
    return (
        <pre id={TerminalCssClasses.Prompt}>
            <span className="domain">{domain}</span> <span className="user">{username}@{githubUsername}</span> <span className="timestamp">{timestamp}</span>
        </pre>
    )
}
