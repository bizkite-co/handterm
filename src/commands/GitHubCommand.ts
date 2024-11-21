// src/commands/GitHubCommand.ts
import { ICommand, ICommandContext, ICommandResponse } from '../contexts/CommandContext';
import { ParsedCommand } from '../types/Types';
import ENDPOINTS from 'src/shared/endpoints.json';
import axios from 'axios';

export const GitHubCommand: ICommand = {
    name: 'github',
    description: 'GitHub account and repository management',
    switches: {
        'h': 'Show help for GitHub command',
        'l': 'Link GitHub account',
        'u': 'Unlink GitHub account',
        'r': 'List recent repositories'
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
                github -u : Unlink GitHub account
                github -r : List recent repositories
                github -h : Show this help message`
            };
        }

        // Validate authentication using the centralized auth check
        const isAuthenticated = await context.auth.validateAndRefreshToken();
        if (!isAuthenticated) {
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

            if ('r' in parsedCommand.switches) {
                try {
                    // Get the current access token
                    const accessToken = localStorage.getItem('AccessToken');
                    if (!accessToken) {
                        return {
                            status: 401,
                            message: 'No access token found. Please log in again.'
                        };
                    }

                    // Make the API request
                    const response = await axios.get(`${ENDPOINTS.api.BaseUrl}${ENDPOINTS.api.ListRecentRepos}`, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    const repos = response.data.repositories || [];
                    const repoList = repos.map((repo: any) =>
                        `${repo.full_name} (${repo.language || 'Unknown'}): ${repo.description || 'No description'}`
                    ).join('\n');

                    return {
                        status: 200,
                        message: repos.length > 0
                            ? `Recent Repositories:\n${repoList}`
                            : 'No recent repositories found.'
                    };
                } catch (error: any) {
                    console.error('Failed to fetch repositories:', error);
                    if (error.response?.status === 401) {
                        return {
                            status: 401,
                            message: 'Authentication failed. Please log in again.'
                        };
                    }
                    return {
                        status: error.response?.status || 500,
                        message: error.response?.data?.message || 'Failed to retrieve repositories. Please try again later.'
                    };
                }
            }

            return {
                status: 400,
                message: 'Please specify a valid GitHub command. Use -h for help.'
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
