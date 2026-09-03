import { navigate } from "../utils/navigationUtils.js";
import { type ICommand, type ICommandContext, type ICommandResponse } from "../contexts/CommandContext.js";
import { ActivityType, type ParsedCommand } from '@handterm/types';
import {
  getRepoTree,
  listRecentRepos,
  unlinkGitHub,
  getGitHubDeviceCode,
  pollGitHubDeviceAuth,
} from "../utils/apiClient.js";
import { createLogger } from "../utils/Logger.js";
import { commandRegistry } from "./commandRegistry.js";

const logger = createLogger({ prefix: "GitHubCommand" });

const POLL_INTERVAL = 5000;
const MAX_POLL_TIME = 300000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const GitHubCommand: ICommand = {
  name: 'gh',
  description: 'GitHub account and repository management',
  subcommands: {
    help: 'Show help for gh command',
    link: 'Link GitHub account',
    unlink: 'Unlink GitHub account',
    recent: 'List recent repositories',
    tree: 'Get repository tree (Usage: gh tree owner/repo [path] [sha])',
  },
  execute: async (
    context: ICommandContext,
    parsedCommand: ParsedCommand
  ): Promise<ICommandResponse> => {
    const subcommand = parsedCommand.args[0] ?? 'help';
    const args = parsedCommand.args.slice(1);

    // Show help if requested or no subcommand provided
    if (subcommand === 'help') {
      return {
        status: 200,
        message: commandRegistry.formatCommandHelp(GitHubCommand),
      };
    }

    try {
      if (subcommand === 'link') {
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

        // Display the device code and verification URL in the terminal so the
        // code is visible even if clipboard access is unavailable or blocked.
        context.appendToOutput({
            command: parsedCommand,
            status: 200,
            commandTime: new Date(),
            response:
                'GitHub authorization required:<br />' +
                `1. Open: ${verification_uri}<br />` +
                `2. Enter code: <strong>${user_code}</strong>`,
        });

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

      if (subcommand === 'unlink') {
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
              'GitHub account unlinked. Use "gh link" to link again with new permissions.',
          };
        }

        return {
          status: response.status,
          message: response.error ?? 'Failed to unlink GitHub account.',
        };
      }

      if (subcommand === 'recent') {
        const response = await listRecentRepos(context.auth);

        if (response.status === 200 && response.data !== null && response.data !== undefined && typeof response.data === 'object') {
          const repoRows = response.data
            .map((repo) => `<tr><td class="repo-name">${repo.name}</td><td class="repo-desc">${repo.description ?? 'No description'}</td></tr>`)
            .join('');
          return {
            status: 200,
            message: `Recent Repositories:<br /><table class="repo-list-table">${repoRows}</table>`,
          };
        }

        return {
          status: response.status,
          message: response.error ?? 'Failed to retrieve repositories.',
        };
      }

      if (subcommand === 'tree') {
        const repoArg = args[0];
        if (repoArg == null) {
          return {
            status: 400,
            message:
              'Repository parameter required. Usage: gh tree owner/repo [path] [sha]',
          };
        }

        const path = args[1] ?? '';
        const sha = args[2] ?? '';

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
        status: 200,
        message: commandRegistry.formatCommandHelp(GitHubCommand),
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
