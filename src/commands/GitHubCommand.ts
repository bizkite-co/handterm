
// src/commands/GitHubCommand.ts
import { ICommand, ICommandContext, ICommandResponse } from '../contexts/CommandContext';
import { ParsedCommand } from '../types/Types';
import { ENDPOINTS } from 'src/shared/endpoints';

export const GitHubCommand: ICommand = {
    name: 'github',
    description: 'Link your GitHub account',
    switches: {
        'h': 'Show help for GitHub command',
        'l': 'Link GitHub account',
        'u': 'Unlink GitHub account'
    },
    execute: async (
        context: ICommandContext, 
        parsedCommand: ParsedCommand
    ): Promise<ICommandResponse> => {
        // Show help if requested
        if ('h' in parsedCommand.switches) {
            return {
                status: 200,
                message: `GitHub Command Usage:
                github -l : Link your GitHub account
                github -u : Unlink your GitHub account
                github -h : Show this help message`
            };
        }

        // Check if user is logged in
        if (!context.auth.isLoggedIn) {
            return {
                status: 401,
                message: 'You must be logged in to use GitHub integration.'
            };
        }

        try {
            if ('l' in parsedCommand.switches) {
                // Create a state parameter with timestamp to prevent CSRF
                const state = btoa(JSON.stringify({
                    timestamp: Date.now(),
                    action: 'link'
                }));

                // Store state in sessionStorage for verification when GitHub redirects back
                sessionStorage.setItem('github_auth_state', state);

                // Construct GitHub auth URL
                const githubAuthUrl = `${ENDPOINTS.api.BaseUrl}/github_auth?state=${encodeURIComponent(state)}`;

                // Redirect to GitHub auth
                window.location.href = githubAuthUrl;

                return {
                    status: 202,
                    message: 'Redirecting to GitHub authorization...'
                };
            }

            if ('u' in parsedCommand.switches) {
                // TODO: Implement unlinking GitHub account
                return {
                    status: 501,
                    message: 'Unlinking GitHub account is not yet implemented.'
                };
            }

            return {
                status: 400,
                message: 'Please specify either -l to link or -u to unlink your GitHub account. Use -h for help.'
            };

        } catch (error) {
            console.error('GitHub command error:', error);
            return {
                status: 500,
                message: `Failed to process GitHub command: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};