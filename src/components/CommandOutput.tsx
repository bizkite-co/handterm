// src/components/CommandOutput.tsx

import React, { ReactNode } from 'react';
import { TimeDisplay } from './TimeDisplay';
import WpmTable from './WpmTable';
import { ParsedCommand, WPMs } from '../types/Types';
import { parsedCommandToString } from 'src/utils/commandUtils';

interface CommandOutputProps {
    command: ParsedCommand;
    response: ReactNode;
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
    // Function to check if a string contains HTML tags
    const containsHTML = (str: string) => {
        return typeof str === 'string' && /<[a-z][\s\S]*>/i.test(str);
    };

    // Render response based on its type and content
    const renderResponse = () => {
        if (typeof response === 'string' && containsHTML(response)) {
            return <div className="response" dangerouslySetInnerHTML={{ __html: response }} />;
        }
        return <div className="response">{response}</div>;
    };

    return (
        <div data-status={status}>
            <div className="log-line">
                <span className="log-time">
                    <TimeDisplay time={commandTime} />
                </span>
                <span className="wpm-label">WPM:</span>
                <span className="wpm">{(wpms.wpmAverage ?? 0).toFixed(0)}</span>
                {parsedCommandToString(command)}
            </div>
            {renderResponse()}
            {wpms && wpms.charWpms && wpms.charWpms.length > 0 && (
                <WpmTable wpms={wpms.charWpms} name="slow-char" />
            )}
        </div>
    );
}
