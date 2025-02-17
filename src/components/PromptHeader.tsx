import { useComputed } from '@preact/signals-react';
import type React from 'react';

import { promptInfoSignal } from 'src/signals/commandLineSignals';

import { TerminalCssClasses } from '@handterm/types'

interface PromptProps {
    domain: string;
    username: string;
    timestamp: string;
    githubUsername: string | null;
}

export const PromptHeader: React.FC<PromptProps> = ({ domain, username, timestamp, githubUsername }) => {
    const promptInfo = useComputed(() => promptInfoSignal.value);

    return (
        <pre id={TerminalCssClasses.promptHeader}>
            <span className="timestamp">{timestamp}</span>
            <span className="user">{username}</span>
            <span className="domain">@{domain}</span>
            {githubUsername &&
                <span className="github">
                    <i className="fa fa-github" aria-hidden="true"></i>
                    {githubUsername}
                </span>
            }
            <span>{promptInfo.value}</span>
        </pre>
    )
}
