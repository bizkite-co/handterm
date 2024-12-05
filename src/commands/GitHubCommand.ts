import { ICommand, ICommandContext, ICommandResponse } from '../contexts/CommandContext';
import { ParsedCommand, ActivityType } from '../types/Types';
import { getRepoTree, listRecentRepos, unlinkGitHub, getGitHubDeviceCode, pollGitHubDeviceAuth } from '../utils/apiClient';

const POLL_INTERVAL = 5000; // 5 seconds
const MAX_POLL_TIME = 300000; // 5 minutes

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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
                // Get device code from GitHub
                const deviceCodeResponse = await getGitHubDeviceCode(context.auth);
                if (deviceCodeResponse.status !== 200 || !deviceCodeResponse.data) {
                    return {
                        status: deviceCodeResponse.status,
                        message: deviceCodeResponse.error || 'Failed to get device code'
                    };
                }

                const { verification_uri, user_code, device_code, interval } = deviceCodeResponse.data;

                // Copy code to clipboard
                await navigator.clipboard.writeText(user_code);

                // Open browser to verification URL
                window.open(verification_uri, '_blank');

                // Show instructions
                console.log(`Opening browser for GitHub authentication...`);
                console.log(`Device code copied to clipboard!`, user_code);
                console.log(`Waiting for authentication...`);

                // Poll for completion
                const startTime = Date.now();
                while (Date.now() - startTime < MAX_POLL_TIME) {
                    const pollResponse = await pollGitHubDeviceAuth(context.auth, device_code);

                    if (pollResponse.status === 200 && pollResponse.data?.status === 'complete') {
                        return {
                            status: 200,
                            message: 'Successfully linked GitHub account!'
                        };
                    }

                    if (pollResponse.status !== 202) {
                        return {
                            status: pollResponse.status,
                            message: pollResponse.error || 'Failed to check authorization status'
                        };
                    }

                    await sleep(interval * 1000 || POLL_INTERVAL);
                }

                return {
                    status: 408,
                    message: 'Authentication timed out. Please try again.'
                };
            }

            if ('u' in parsedCommand.switches) {
                const response = await unlinkGitHub(context.auth);
                if (response.status === 200) {
                    // Clear GitHub-related items from localStorage
                    localStorage.removeItem('githubUsername');
                    localStorage.removeItem('current_github_repo');
                    localStorage.removeItem('github_tree_items');
                    sessionStorage.removeItem('github_auth_state');

                    return {
                        status: 200,
                        message: 'GitHub account unlinked. Use "github -l" to link again with new permissions.'
                    };
                }

                return {
                    status: response.status,
                    message: response.error || 'Failed to unlink GitHub account.'
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
