import { ICommand, ICommandContext, ICommandResponse } from '../contexts/CommandContext';
import { ParsedCommand } from '../types/Types';
import ENDPOINTS from '../shared/endpoints.json';
import axios from 'axios';
import { useReactiveLocation } from 'src/hooks/useReactiveLocation';
import { ActivityType } from 'src/types/Types';

export const GitHubCommand: ICommand = {
    name: 'github',
    description: 'GitHub account and repository management',
    switches: {
        'h': 'Show help for GitHub command',
        'l': 'Link GitHub account',
        'u': 'Unlink GitHub account',
        'r': 'List recent repositories',
        't': 'Get repository tree (Usage: -t owner/repo [path] [sha])'
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
                github -t owner/repo [path] [sha] : Get repository tree
                github -h : Show this help message`
            };
        }

        // Validate authentication and get auth info using the centralized auth check
        const myAuthResponse = await context.auth.validateAndRefreshToken();
        if (!myAuthResponse || myAuthResponse.status !== 200 || !myAuthResponse.data) {
            return {
                status: 401,
                message: 'You must be logged in to use GitHub integration.'
            };
        }

        try {
            if ('l' in parsedCommand.switches) {
                // Get the IdToken which contains user identity information
                const idToken = myAuthResponse.data.IdToken;
                if (!idToken) {
                    return {
                        status: 401,
                        message: 'Unable to authenticate with GitHub. Please try logging in again.'
                    };
                }

                // Create a state parameter with timestamp and user context to prevent CSRF
                const state = btoa(JSON.stringify({
                    timestamp: Date.now(),
                    refererUrl: encodeURIComponent(window.location.origin),
                    cognitoUserId: idToken
                }));

                // Store state in sessionStorage for verification when GitHub redirects back
                sessionStorage.setItem('github_auth_state', state);

                // Construct GitHub auth URL
                const githubAuthUrl = `${ENDPOINTS.api.BaseUrl}${ENDPOINTS.api.GitHubAuth}?state=${encodeURIComponent(state)}`;

                // Redirect to GitHub auth
                window.location.href = githubAuthUrl;

                return {
                    status: 202,
                    message: 'Redirecting to GitHub authorization...',
                };
            }

            if ('u' in parsedCommand.switches) {
                return {
                    status: 501,
                    message: 'Unlinking GitHub account is not yet implemented.'
                };
            }

            if ('r' in parsedCommand.switches) {
                try {
                    const response = await axios.get(`${ENDPOINTS.api.BaseUrl}${ENDPOINTS.api.ListRecentRepos}`, {
                        headers: {
                            'Authorization': `Bearer ${myAuthResponse.data.AccessToken}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    const repos = response.data || [];
                    const repoList = repos.map((repo: any) =>
                        `${repo.name}: ${repo.description || 'No description'}`
                    ).join('<br />');

                    return {
                        status: 200,
                        message: repos.length > 0
                            ? `Recent Repositories:<br />${repoList}`
                            : 'No recent repositories found.'
                    };
                } catch (error: any) {
                    console.error('Failed to fetch repositories:', error);

                    if (error.response?.data?.message?.includes('installation required')) {
                        const installUrl = error.response.data.message.match(/https:\/\/github\.com\/apps\/[^\/]+\/installations\/new/)?.[0];
                        if (installUrl) {
                            window.open(installUrl, '_blank');
                            return {
                                status: 400,
                                message: `The HandTerm GitHub App needs to be installed to access repositories.<br/><br/>
                                A new tab has opened where you can install the app.<br/><br/>
                                After installing, try the 'github -r' command again.`
                            };
                        }
                    }

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

            if ('t' in parsedCommand.switches) {
                const repoArg = parsedCommand.switches.t === true ? parsedCommand.args[0] : parsedCommand.switches.t;
                if (!repoArg) {
                    return {
                        status: 400,
                        message: 'Repository parameter required. Usage: github -t owner/repo [path] [sha]'
                    };
                }

                const path = parsedCommand.args[1] || '';
                const sha = parsedCommand.args[2] || '';

                try {
                    const response = await axios.get(`${ENDPOINTS.api.BaseUrl}${ENDPOINTS.api.GetRepoTree}`, {
                        headers: {
                            'Authorization': `Bearer ${myAuthResponse.data.AccessToken}`,
                            'Content-Type': 'application/json'
                        },
                        params: {
                            repo: repoArg,
                            ...(path && { path }),
                            ...(sha && { sha })
                        }
                    });

                    // Store current repository for file fetching
                    localStorage.setItem('current_github_repo', repoArg);

                    // Update tree view state
                    if (Array.isArray(response.data)) {
                        // Switch to tree view mode
                        context.updateLocation({
                            activityKey: ActivityType.TREE,
                            contentKey: null,
                            groupKey: null
                        });

                        // Store tree items in localStorage for the MonacoEditor to access
                        localStorage.setItem('github_tree_items', JSON.stringify(
                            response.data.map(item => ({
                                path: item.path,
                                type: item.type
                            }))
                        ));

                        return {
                            status: 200,
                            message: 'Repository tree loaded. Use j/k to navigate, Enter to select a file, e to close.'
                        };
                    }

                    return {
                        status: 200,
                        message: 'No items found in repository tree.'
                    };
                } catch (error: any) {
                    console.error('Failed to fetch repo tree:', error);

                    if (error.response?.status === 401) {
                        return {
                            status: 401,
                            message: 'Authentication failed. Please log in again.'
                        };
                    }

                    if (error.response?.status === 400) {
                        return {
                            status: 400,
                            message: error.response.data.message || 'Invalid request. Please check repository name and parameters.'
                        };
                    }

                    return {
                        status: error.response?.status || 500,
                        message: error.response?.data?.message || 'Failed to retrieve repository tree. Please try again later.'
                    };
                }
            }

            return {
                status: 400,
                message: 'Invalid command. Use -h to show command help info',
            };
        } catch (error) {
            console.error('GitHub command error:', error);
            return {
                status: 501,
                message: 'Failed to process GitHub command',
            };
        }
    }
}
