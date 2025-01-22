import { navigate } from "../utils/navigationUtils.js";
import { type ICommand, type ICommandContext, type ICommandResponse } from "../contexts/CommandContext.js";
import { ActivityType } from '@handterm/types';
import type { ParsedCommand } from "../types/Types";
import {
  getRepoTree,
  listRecentRepos,
  unlinkGitHub,
  getGitHubDeviceCode,
  pollGitHubDeviceAuth,
} from "../utils/apiClient.js";
import { createLogger } from "../utils/Logger.js";

const logger = createLogger({ prefix: "GitHubCommand" });

const POLL_INTERVAL = 5000;
const MAX_POLL_TIME = 300000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const GitHubCommand: ICommand = {
  name: 'github',
  description: 'GitHub account and repository management',
  switches: {
    h: 'Show help for GitHub command',
    l: 'Link GitHub account',
    u: 'Unlink GitHub account',
    r: 'List recent repositories',
    t: 'Get repository tree (Usage: -t owner/repo [path] [sha])',
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
                github -h : Show this help message`,
      };
    }

    try {
      if ('l' in parsedCommand.switches) {
        // Get device code from GitHub
        const deviceCodeResponse = await getGitHubDeviceCode(context.auth);
        if (deviceCodeResponse.status !== 200 || deviceCodeResponse.data === null) {
          return {
            status: deviceCodeResponse.status,
            message: deviceCodeResponse.error ?? 'Failed to get device code',
          };
        }

        if (deviceCodeResponse.data === null || deviceCodeResponse.data === undefined) {
          return {
            status: 500,
            message: 'Invalid device code response',
          };
        }
        const { verification_uri, user_code, device_code } = deviceCodeResponse.data;

        // Copy code to clipboard
        await navigator.clipboard.writeText(user_code);

        // Open browser to verification URL
        window.open(verification_uri, '_blank');

        // Log authentication steps
        logger.info('Opening browser for GitHub authentication...');
        logger.info('Device code copied to clipboard!', user_code);
        logger.info('Waiting for authentication...');

        // Poll for completion
        const startTime = Date.now();
        while (Date.now() - startTime < MAX_POLL_TIME) {
          const pollResponse = await pollGitHubDeviceAuth(
            context.auth,
            device_code
          );

          if (
            pollResponse.status === 200 &&
            pollResponse.data !== null &&
            pollResponse.data !== undefined &&
            pollResponse.data.status === 'complete'
          ) {
            return {
              status: 200,
              message: 'Successfully linked GitHub account!',
            };
          }

          if (pollResponse.status !== undefined && pollResponse.status !== null && pollResponse.status !== 202) {
            return {
              status: pollResponse.status,
              message:
                pollResponse.error ?? 'Failed to check authorization status',
            };
          }

          await sleep(POLL_INTERVAL);
        }

        return {
          status: 408,
          message: 'Authentication timed out. Please try again.',
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
            message:
              'GitHub account unlinked. Use "github -l" to link again with new permissions.',
          };
        }

        return {
          status: response.status,
          message: response.error ?? 'Failed to unlink GitHub account.',
        };
      }

      if ('r' in parsedCommand.switches) {
        const response = await listRecentRepos(context.auth);

        if (response.status === 200 && response.data !== null && response.data !== undefined && typeof response.data === 'object') {
          const repoList = response.data
            .map((repo) => `${repo.name}: ${repo.description ?? 'No description'}`)
            .join('<br />');

          return {
            status: 200,
            message: `Recent Repositories:<br />${repoList}`,
          };
        }

        return {
          status: response.status,
          message: response.error ?? 'Failed to retrieve repositories.',
        };
      }

      if ('t' in parsedCommand.switches) {
        const repoArg: string =
          parsedCommand.switches.t === true
            ? parsedCommand.args[0] as string
            : parsedCommand.switches.t as string;
        if (repoArg == null) {
          return {
            status: 400,
            message:
              'Repository parameter required. Usage: github -t owner/repo [path] [sha]',
          };
        }

        const path = parsedCommand.args[1] ?? '';
        const sha = parsedCommand.args[2] ?? '';

        logger.info('Fetching tree for repo:', repoArg);
        const response = await getRepoTree(context.auth, repoArg, path, sha);
        logger.info('Tree response:', response);

        if (response.status === 200 && response.data !== null) {
          // Store current repository for file fetching
          localStorage.setItem('current_github_repo', repoArg);

          // Store tree items in localStorage
          localStorage.setItem('github_tree_items', JSON.stringify(response.data));

          // Switch to tree view mode
          logger.info('Switching to TREE mode');
          navigate({
            activityKey: ActivityType.TREE,
            contentKey: repoArg,
            groupKey: null,
          });

          return {
            status: 200,
            message:
              'Repository tree loaded. Use j/k to navigate, Enter to select a file, e to close.',
          };
        }

        return {
          status: response.status,
          message: response.error ?? 'Failed to retrieve repository tree.',
        };
      }

      return {
        status: 400,
        message: 'Invalid command. Use -h to show command help info',
      };
    } catch (error: unknown) {
      logger.error('GitHub command error:', error);
      return {
        status: 501,
        message: 'Failed to process GitHub command',
      };
    }
  },
};
