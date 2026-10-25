// src/commands/TaCommand.ts

import { type ICommand, type ICommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { type ParsedCommand } from '@handterm/types';
import { getRepoTree, getRepoContent, saveRepoFile, type TreeItemResponse } from '../utils/apiClient';
import { commandRegistry } from './commandRegistry';
import { createLogger } from '../utils/Logger';

const logger = createLogger({ prefix: 'TaCommand' });

export const DEFAULT_TASK_REPO = 'bizkite-co/handterm-tasks';

export interface TaskEntry {
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'DRAFT';
  slug: string;
  path: string;
}

export function slugify(text: string): string {
  let slug = text.toLowerCase();
  slug = slug.replace(/[^\w\s.-]/g, '');
  slug = slug.replace(/[\s_]+/g, '-');
  slug = slug.replace(/-+/g, '-');
  slug = slug.replace(/^-+|-+$/g, '');
  slug = slug.replace(/\.(md|json|txt|html|xml|yml|yaml)$/i, '');
  return slug.replace(/^-+|-+$/g, '');
}

export function parseTasksFromTree(items: TreeItemResponse[]): TaskEntry[] {
  const tasks: TaskEntry[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const match = item.path.match(/^(active|pending|completed|draft)\/([^/]+)(?:\/README\.md|\.md)$/i);
    if (!match) continue;

    const statusRaw = match[1].toLowerCase();
    const slug = match[2];
    const key = `${statusRaw}:${slug}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const statusMap: Record<string, TaskEntry['status']> = {
      active: 'ACTIVE',
      pending: 'PENDING',
      completed: 'COMPLETED',
      draft: 'DRAFT',
    };

    tasks.push({
      status: statusMap[statusRaw] ?? 'PENDING',
      slug,
      path: item.path,
    });
  }

  const statusWeight: Record<TaskEntry['status'], number> = {
    ACTIVE: 0,
    PENDING: 1,
    DRAFT: 2,
    COMPLETED: 3,
  };

  tasks.sort((a, b) => {
    const wA = statusWeight[a.status] ?? 99;
    const wB = statusWeight[b.status] ?? 99;
    if (wA !== wB) return wA - wB;
    return a.slug.localeCompare(b.slug);
  });

  return tasks;
}

export function extractTitleFromContent(content: string, fallbackSlug: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  if (match) {
    return match[1].trim();
  }
  return fallbackSlug;
}

export const TaCommand: ICommand = {
  name: 'ta',
  aliases: ['task'],
  description: 'Task Agent mission queue manager',
  subcommands: {
    list: 'List active and pending tasks (alias: ls)',
    new: 'Create a task: ta new <title> [-c <criteria>] [-b <body>] (alias: add)',
    active: 'Mark a task active: ta active [slug]',
    help: 'Show help for ta command',
  },
  execute: async (
    context: ICommandContext,
    parsedCommand: ParsedCommand
  ): Promise<ICommandResponse> => {
    const subcommand = parsedCommand.args[0] ?? 'list';
    const args = parsedCommand.args.slice(1);
    const switches = parsedCommand.switches ?? {};
    const repo = (switches.repo || switches.r || DEFAULT_TASK_REPO) as string;

    if (subcommand === 'help') {
      return {
        status: 200,
        message: commandRegistry.formatCommandHelp(TaCommand),
      };
    }

    try {
      if (subcommand === 'list' || subcommand === 'ls') {
        const treeResponse = await getRepoTree(context.auth, repo);

        if (treeResponse.status === 401 || !treeResponse.data) {
          return {
            status: treeResponse.status,
            message: 'GitHub account not linked or unauthorized. Run "gh link" to authenticate.',
          };
        }

        const tasks = parseTasksFromTree(treeResponse.data);
        const activeAndPending = tasks.filter(t => t.status === 'ACTIVE' || t.status === 'PENDING');

        if (activeAndPending.length === 0) {
          return {
            status: 200,
            message: 'No active or pending tasks found in mission queue.',
          };
        }

        const titles = await Promise.all(
          activeAndPending.map(async (t) => {
            try {
              const contentRes = await getRepoContent(context.auth, repo, t.path);
              if (contentRes.status === 200 && contentRes.data?.content) {
                return extractTitleFromContent(contentRes.data.content, t.slug);
              }
            } catch {
              // fallback to slug
            }
            return t.slug;
          })
        );

        const lines = activeAndPending.map((t, i) => {
          const title = titles[i] || t.slug;
          const statusClass = t.status === 'ACTIVE' ? 'ta-active' : 'ta-pending';
          return `[${i + 1}] <span class="${statusClass}">${t.status}</span>: ${title}`;
        });

        return {
          status: 200,
          message: `<div class="ta-task-list">\n${lines.join('\n')}\n</div>`,
        };
      }

      if (subcommand === 'new' || subcommand === 'add') {
        const title = args.join(' ').trim();
        if (!title) {
          return {
            status: 400,
            message: 'Title required. Usage: ta new <title> [-c <criteria>] [-b <body>]',
          };
        }

        const criteria = (switches.c || switches.criteria || '') as string;
        const body = (switches.b || switches.body || '') as string;
        const slug = slugify(title);
        const now = new Date().toISOString();

        let content = `---\ncreated_at: ${now}\n---\n\n# ${title}\n`;
        if (body) {
          content += `\n${body}\n`;
        }
        if (criteria) {
          content += `\n## Completion Criteria\n\n${criteria}\n`;
        }

        const taskPath = `pending/${slug}/README.md`;
        const commitMessage = `task: create ${slug}`;
        const saveRes = await saveRepoFile(context.auth, repo, taskPath, content, commitMessage);

        if (saveRes.status !== 200) {
          if (saveRes.status === 401) {
            return {
              status: 401,
              message: 'GitHub account not linked or unauthorized. Run "gh link" to authenticate.',
            };
          }
          return {
            status: saveRes.status,
            message: saveRes.error ?? `Failed to create task ${slug}`,
          };
        }

        return {
          status: 200,
          message: `Created task: ${slug} (Status: pending)`,
        };
      }

      if (subcommand === 'active') {
        const targetSlug = args[0]?.trim();

        if (!targetSlug) {
          // List active tasks only
          const treeRes = await getRepoTree(context.auth, repo);
          if (treeRes.status === 401 || !treeRes.data) {
            return {
              status: treeRes.status,
              message: 'GitHub account not linked or unauthorized. Run "gh link" to authenticate.',
            };
          }

          const tasks = parseTasksFromTree(treeRes.data).filter(t => t.status === 'ACTIVE');
          if (tasks.length === 0) {
            return {
              status: 200,
              message: 'No active tasks.',
            };
          }

          const titles = await Promise.all(
            tasks.map(async (t) => {
              try {
                const contentRes = await getRepoContent(context.auth, repo, t.path);
                if (contentRes.status === 200 && contentRes.data?.content) {
                  return extractTitleFromContent(contentRes.data.content, t.slug);
                }
              } catch {
                // fallback
              }
              return t.slug;
            })
          );

          const lines = tasks.map((t, i) => `[${i + 1}] <span class="ta-active">ACTIVE</span>: ${titles[i] || t.slug}`);
          return {
            status: 200,
            message: `<div class="ta-task-list">\n${lines.join('\n')}\n</div>`,
          };
        }

        // Slug is provided: activate it
        let pendingPath = `pending/${targetSlug}/README.md`;
        let contentRes = await getRepoContent(context.auth, repo, pendingPath);
        if (contentRes.status !== 200 || !contentRes.data?.content) {
          // Try single-file format
          pendingPath = `pending/${targetSlug}.md`;
          contentRes = await getRepoContent(context.auth, repo, pendingPath);
        }

        if (contentRes.status !== 200 || !contentRes.data?.content) {
          // Check if already active
          const activeRes = await getRepoContent(context.auth, repo, `active/${targetSlug}/README.md`);
          if (activeRes.status === 200 && activeRes.data?.content) {
            return {
              status: 200,
              message: `Task '${targetSlug}' is already active.`,
            };
          }
          return {
            status: 404,
            message: `Task '${targetSlug}' not found in pending queue.`,
          };
        }

        // Commit to active/<slug>/README.md
        const activePath = `active/${targetSlug}/README.md`;
        const activateRes = await saveRepoFile(
          context.auth,
          repo,
          activePath,
          contentRes.data.content,
          `task: activate ${targetSlug}`
        );

        if (activateRes.status !== 200) {
          if (activateRes.status === 401) {
            return {
              status: 401,
              message: 'GitHub account not linked or unauthorized. Run "gh link" to authenticate.',
            };
          }
          return {
            status: activateRes.status,
            message: activateRes.error ?? `Failed to activate task ${targetSlug}`,
          };
        }

        return {
          status: 200,
          message: `Task '${targetSlug}' is now active.`,
        };
      }

      return {
        status: 200,
        message: commandRegistry.formatCommandHelp(TaCommand),
      };
    } catch (error: unknown) {
      logger.error('Task Agent command error:', error);
      return {
        status: 500,
        message: 'Failed to process Task Agent command',
      };
    }
  },
};

export default TaCommand;
