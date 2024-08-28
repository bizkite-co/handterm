import React from 'react';
import { TerminalCssClasses } from "../types/TerminalTypes"

interface PromptProps {
    domain: string;
    username: string;
    timestamp: string;
    githubUsername: string | null;
}

const githubLogo = '\uf09b';

export const Prompt: React.FC<PromptProps> = ({ domain, username, timestamp, githubUsername }) => {
    return (
        <pre id={TerminalCssClasses.Prompt}>
            <span className="timestamp">{timestamp}</span>
            <span className="user">{username}</span>
            <span className="domain">@{domain}</span>
            {githubUsername &&
                <span className="github">
                    <span className="github-logo">
                        <i className="fa fa-github" aria-hidden="true"></i>
                    </span> {githubUsername}
                </span>
            }
        </pre>
    )
}
