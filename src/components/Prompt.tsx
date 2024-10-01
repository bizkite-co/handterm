import React from 'react';
import { TerminalCssClasses } from "../types/TerminalTypes"

interface PromptProps {
    domain: string;
    username: string;
    timestamp: string;
    githubUsername: string | null;
}

const PromptComponent: React.FC<PromptProps> = ({ domain, username, timestamp, githubUsername }) => {
    return (
        <pre id={TerminalCssClasses.Prompt}>
            <span className="timestamp">{timestamp}</span>
            <span className="user">{username}</span>
            <span className="domain">@{domain}</span>
            {githubUsername &&
                <span className="github">
                    <i className="fa fa-github" aria-hidden="true"></i> 
                    {githubUsername}
                </span>
            }
        </pre>
    )
}

export const Prompt = React.memo(PromptComponent);
