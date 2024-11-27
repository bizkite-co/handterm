import { ICommand, ICommandContext, ICommandResponse } from '../contexts/CommandContext';
import { ParsedCommand, ActivityType } from '../types/Types';
import ENDPOINTS from '../shared/endpoints.json';
import { getRepoTree, listRecentRepos } from '../utils/apiClient';

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

        try {
            if ('l' in parsedCommand.switches) {
                // Get the IdToken which contains user identity information
                const authResponse = await context.auth.validateAndRefreshToken();
                if (!authResponse || authResponse.status !== 200 || !authResponse.data) {
                    return {
                        status: 401,
                        message: 'Unable to authenticate with GitHub. Please try logging in again.'
                    };
                }

                const idToken = authResponse.data.IdToken;
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
                const response = await listRecentRepos(context.auth);

                if (response.status === 200 && response.data) {
                    const repoList = response.data.map(repo =>
                        `${repo.name}: ${repo.description || 'No description'}`
                    ).join('<br />');

                    return {
                        status: 200,
                        message: response.data.length > 0
                            ? `Recent Repositories:<br />${repoList}`
                            : 'No recent repositories found.'
                    };
                }

                return {
                    status: response.status,
                    message: response.error || 'Failed to retrieve repositories.'
                };
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

                console.log('Fetching tree for repo:', repoArg);
                const response = await getRepoTree(context.auth, repoArg, path, sha);
                console.log('Tree response:', response);

                if (response.status === 200 && response.data) {
                    // Store current repository for file fetching
                    localStorage.setItem('current_github_repo', repoArg);

                    // Store tree items in localStorage
                    localStorage.setItem('github_tree_items', JSON.stringify(response.data));

                    // Switch to tree view mode
                    console.log('Switching to TREE mode');
                    context.updateLocation({
                        activityKey: ActivityType.TREE,
                        contentKey: null,
                        groupKey: null
                    });

                    return {
                        status: 200,
                        message: 'Repository tree loaded. Use j/k to navigate, Enter to select a file, e to close.'
                    };
                }

                return {
                    status: response.status,
                    message: response.error || 'Failed to retrieve repository tree.'
                };
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
