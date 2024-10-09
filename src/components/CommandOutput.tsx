// src/components/CommandOutput.tsx

import React from 'react';
import { TimeDisplay } from './TimeDisplay';
import WpmTable from './WpmTable';
import { WPMs } from '../types/Types';

interface CommandOutputProps {
    command: string;
    response: string;
    status: number;
    wpms: WPMs;
    commandTime: Date;
}

export const CommandOutput: React.FC<CommandOutputProps> = ({
    command,
    response,
    status,
    wpms,
    commandTime
}) => {

    return (
        <div data-status={status}>
            <div className="log-line">
                <span className="log-time">
                    <TimeDisplay time={commandTime} />
                </span>
                <span className="wpm-label">WPM:</span>
                <span className="wpm">{(wpms.wpmAverage ?? 0).toFixed(0)}</span>
                {command}
            </div>
            <div className="response">{response}</div>
            {wpms && wpms.charWpms && wpms.charWpms.length > 0 && (
                <WpmTable wpms={wpms.charWpms} name="slow-char" />
            )}
        </div>
    );
};