// src/commands/TaCommand.ts

import { type ICommand, type ICommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { type ParsedCommand } from '@handterm/types';
import { getRepoTree, getRepoContent, saveRepoFile, commitRepoFiles, type TreeItemResponse } from '../utils/apiClient';
import { commandRegistry } from './commandRegistry';
import { createLogger } from '../utils/Logger';

const logger = createLogger({ prefix: 'TaCommand' });

export const DEFAULT_TASK_REPO = 'bizkite-co/handterm-tasks';

export interface TaskEntry {
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'DRAFT';
  slug: string;
  path: string;
}

export interface TaskFrontmatter {
  created_at?: string;
  blocked_by?: string[];
  subtask_of?: string;
}

export interface TaskItem {
  name: string;
  slug: string;
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'DRAFT';
  path: string;
  priority: number;
  date: string; // MM-DD
  blocked_by: string[];
  subtask_of?: string;
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
    let trimmed = item.path;
    let isTaskFile = false;

    if (trimmed.endsWith('/README.md')) {
      trimmed = trimmed.slice(0, -'/README.md'.length);
      isTaskFile = true;
    } else if (trimmed.endsWith('.md')) {
      trimmed = trimmed.slice(0, -'.md'.length);
      isTaskFile = true;
    }

    if (!isTaskFile) continue;

    const segments = trimmed.split('/');
    if (segments.length < 2) continue;

    const station = segments[0].toLowerCase();
    const slug = segments[segments.length - 1];

    if (!slug || slug === 'README') continue;

    const statusMap: Record<string, TaskEntry['status']> = {
      active: 'ACTIVE',
      pending: 'PENDING',
      completed: 'COMPLETED',
      draft: 'DRAFT',
    };

    const status = statusMap[station];
    if (!status) continue;

    const key = `${status}:${slug}`;
    if (seen.has(key)) continue;
    seen.add(key);

    tasks.push({
      status,
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

export function parseFrontmatter(content: string): TaskFrontmatter {
  if (!content.startsWith('---')) return {};
  const parts = content.split('---', 3);
  if (parts.length < 3) return {};

  const fm = parts[1];
  const result: TaskFrontmatter = {};

  for (const line of fm.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim().toLowerCase();
    const val = trimmed.slice(colonIdx + 1).trim();

    if (key === 'created_at') {
      result.created_at = val;
    } else if (key === 'blocked_by' || key === 'dependencies') {
      result.blocked_by = val ? val.split(',').map(s => s.trim()).filter(Boolean) : [];
    } else if (key === 'subtask_of') {
      result.subtask_of = val || undefined;
    }
  }

  return result;
}

export function formatDateMMDD(isoOrDateStr?: string): string {
  if (!isoOrDateStr) return '     ';
  const match = isoOrDateStr.match(/\d{4}-(\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }
  try {
    const d = new Date(isoOrDateStr);
    if (!isNaN(d.getTime())) {
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${mm}-${dd}`;
    }
  } catch {
    // fallback
  }
  return isoOrDateStr.slice(0, 5).padEnd(5, ' ');
}

export function parseMissionUsv(usvContent: string): {
  name: string;
  slug: string;
  blocked_by: string[];
  subtask_of?: string;
}[] {
  const lines = usvContent.split('\n');
  const items: { name: string; slug: string; blocked_by: string[]; subtask_of?: string }[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = line.split('\x1f');
    if (parts.length === 1) {
      const slug = parts[0].trim();
      items.push({ name: slug, slug, blocked_by: [] });
    } else if (parts.length === 2) {
      items.push({ name: parts[0].trim(), slug: parts[1].trim(), blocked_by: [] });
    } else if (parts.length === 3) {
      const blocked_by = parts[2].split(',').map(s => s.trim()).filter(Boolean);
      items.push({ name: parts[0].trim(), slug: parts[1].trim(), blocked_by });
    } else {
      const blocked_by = parts[2].split(',').map(s => s.trim()).filter(Boolean);
      const subtask_of = parts[3].trim() || undefined;
      items.push({ name: parts[0].trim(), slug: parts[1].trim(), blocked_by, subtask_of });
    }
  }

  return items;
}

export function buildHierarchyRows(issues: TaskItem[]): { issue: TaskItem; depth: number }[] {
  const slugToIssue = new Map(issues.map(i => [i.slug, i]));
  const childrenMap = new Map<string, string[]>();

  for (const issue of issues) {
    if (issue.subtask_of && slugToIssue.has(issue.subtask_of)) {
      const children = childrenMap.get(issue.subtask_of) || [];
      children.push(issue.slug);
      childrenMap.set(issue.subtask_of, children);
    }
  }

  const visited = new Set<string>();
  const rowsToDisplay: { issue: TaskItem; depth: number }[] = [];

  function buildRows(issue: TaskItem, depth: number) {
    if (visited.has(issue.slug)) return;
    visited.add(issue.slug);
    rowsToDisplay.push({ issue, depth });
    const children = childrenMap.get(issue.slug) || [];
    for (const childSlug of children) {
      const child = slugToIssue.get(childSlug);
      if (child) {
        buildRows(child, depth + 1);
      }
    }
  }

  // Root nodes: tasks with no subtask_of parent in the active/pending issue set
  for (const issue of issues) {
    if (!issue.subtask_of || !slugToIssue.has(issue.subtask_of)) {
      buildRows(issue, 0);
    }
  }

  for (const issue of issues) {
    if (!visited.has(issue.slug)) {
      buildRows(issue, 0);
    }
  }

  return rowsToDisplay;
}

export function formatTaskQueueTable(
  repo: string,
  rowsToDisplay: { issue: TaskItem; depth: number }[],
  slugToIssue: Map<string, TaskItem>,
  completedSlugs: Set<string>,
  termWidth: number = 96
): string {
  const remoteLine = `Store remote: git@github.com:${repo}.git`;
  const titleText = 'Task Queue';
  const titlePad = Math.max(0, Math.floor((termWidth - titleText.length) / 2));
  const titleLine = ' '.repeat(titlePad) + titleText;

  const headerLine = 'Pri  Date   Status   Blocked   Slug';

  const rowLines = rowsToDisplay.map(({ issue, depth }) => {
    const priStr = String(issue.priority).padStart(3, ' ');
    const dateStr = issue.date.padEnd(5, ' ');
    const statusStr = issue.status.padEnd(7, ' ');

    const activeBlockers = issue.blocked_by.filter(b => !completedSlugs.has(b));
    let blockedStr = '';
    if (activeBlockers.length > 0) {
      const blockerNums = activeBlockers.map(b => {
        const blk = slugToIssue.get(b);
        return blk ? String(blk.priority) : b.slice(0, 4);
      });
      blockedStr = blockerNums.join(' ');
    }
    const blockedPadded = blockedStr.padEnd(8, ' ');

    const indent = depth > 1 ? '  '.repeat(depth - 1) : '';
    const prefixPlain = depth > 0 ? '└─ ' : '';
    const prefixHtml = depth > 0 ? '<span class="ta-tree">└─ </span>' : '';

    const availableWidth = Math.max(10, termWidth - 31 - 2);
    const prefixLen = indent.length + prefixPlain.length;
    const maxSlugLen = Math.max(5, availableWidth - prefixLen);

    let slugStr = issue.slug;
    if (slugStr.length > maxSlugLen) {
      slugStr = slugStr.slice(0, maxSlugLen - 1) + '…';
    }

    const statusClass = issue.status === 'ACTIVE' ? 'ta-active' : 'ta-pending';

    return `<span class="ta-pri">${priStr}</span>  <span class="ta-date">${dateStr}</span>  <span class="${statusClass}">${statusStr}</span>  <span class="ta-blocked">${blockedPadded}</span>  ${indent}${prefixHtml}<span class="ta-slug">${slugStr}</span>`;
  });

  return `<div class="ta-task-list">\n${remoteLine}\n${titleLine}\n<span class="ta-header">${headerLine}</span>\n${rowLines.join('\n')}\n</div>`;
}

export const HANDTERM_WRITER = 'handterm';

export function buildCreateOp(slug: string, title: string, body: string, at: string, id: string) {
  return {
    v: 1,
    id,
    writer: HANDTERM_WRITER,
    at,
    verb: 'create',
    slug,
    payload: {
      name: title,
      station: 'pending',
      body,
    },
  };
}

export function newOpId(at: Date = new Date()): { at: string; id: string } {
  const iso = at.toISOString();
  const stamp = iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '').replace('Z', '');
  const suffix = Math.random().toString(16).slice(2, 8);
  return { at: iso, id: `${stamp}-${suffix}` };
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
        const treeResponse = await getRepoTree(context.auth, repo, undefined, undefined, true);

        if (treeResponse.status === 401 || !treeResponse.data) {
          return {
            status: treeResponse.status,
            message: 'GitHub account not linked or unauthorized. Run "gh link" to authenticate.',
          };
        }

        const treeTasks = parseTasksFromTree(treeResponse.data);
        const activeAndPendingTreeTasks = treeTasks.filter(t => t.status === 'ACTIVE' || t.status === 'PENDING');

        if (activeAndPendingTreeTasks.length === 0) {
          return {
            status: 200,
            message: 'No active or pending tasks found in mission queue.',
          };
        }

        const missionFileItem = treeResponse.data.find(
          item => item.path === '.task-agent/mission.usv'
        );

        let usvIssues: ReturnType<typeof parseMissionUsv> = [];
        if (missionFileItem) {
          try {
            const usvRes = await getRepoContent(context.auth, repo, '.task-agent/mission.usv');
            if (usvRes.status === 200 && usvRes.data?.content) {
              usvIssues = parseMissionUsv(usvRes.data.content);
            }
          } catch {
            // fallback
          }
        }

        const taskPathMap = new Map<string, string>();
        const taskStatusMap = new Map<string, TaskEntry['status']>();
        for (const t of treeTasks) {
          taskPathMap.set(t.slug, t.path);
          taskStatusMap.set(t.slug, t.status);
        }

        const completedSlugs = new Set(
          treeTasks.filter(t => t.status === 'COMPLETED').map(t => t.slug)
        );

        // Fetch task file contents in parallel to extract created_at date and frontmatter
        const taskDetails = await Promise.all(
          activeAndPendingTreeTasks.map(async (t) => {
            try {
              const contentRes = await getRepoContent(context.auth, repo, t.path);
              if (contentRes.status === 200 && contentRes.data?.content) {
                const raw = contentRes.data.content;
                const fm = parseFrontmatter(raw);
                const title = extractTitleFromContent(raw, t.slug);
                return { slug: t.slug, title, fm };
              }
            } catch {
              // fallback
            }
            return { slug: t.slug, title: t.slug, fm: {} as TaskFrontmatter };
          })
        );

        const detailsBySlug = new Map(taskDetails.map(d => [d.slug, d]));

        let issues: TaskItem[] = [];

        if (usvIssues.length > 0) {
          for (const u of usvIssues) {
            const st = taskStatusMap.get(u.slug);
            if (st === 'ACTIVE' || st === 'PENDING') {
              const det = detailsBySlug.get(u.slug);
              issues.push({
                name: u.name || det?.title || u.slug,
                slug: u.slug,
                status: st,
                path: taskPathMap.get(u.slug) || `${st.toLowerCase()}/${u.slug}/README.md`,
                priority: 0,
                date: formatDateMMDD(det?.fm.created_at),
                blocked_by: (u.blocked_by && u.blocked_by.length > 0) ? u.blocked_by : (det?.fm.blocked_by || []),
                subtask_of: u.subtask_of || det?.fm.subtask_of,
              });
            }
          }

          // Append any active/pending tasks in tree not in mission.usv
          const knownSlugs = new Set(issues.map(i => i.slug));
          for (const t of activeAndPendingTreeTasks) {
            if (!knownSlugs.has(t.slug)) {
              const det = detailsBySlug.get(t.slug);
              issues.push({
                name: det?.title || t.slug,
                slug: t.slug,
                status: t.status,
                path: t.path,
                priority: 0,
                date: formatDateMMDD(det?.fm.created_at),
                blocked_by: det?.fm.blocked_by || [],
                subtask_of: det?.fm.subtask_of,
              });
            }
          }
        } else {
          // No mission.usv
          issues = activeAndPendingTreeTasks.map(t => {
            const det = detailsBySlug.get(t.slug);
            return {
              name: det?.title || t.slug,
              slug: t.slug,
              status: t.status,
              path: t.path,
              priority: 0,
              date: formatDateMMDD(det?.fm.created_at),
              blocked_by: det?.fm.blocked_by || [],
              subtask_of: det?.fm.subtask_of,
            };
          });
        }

        // Sort active tasks first (preserving relative order), then pending tasks (preserving relative order)
        const statusOrder: Record<string, number> = { ACTIVE: 0, PENDING: 1 };
        issues.sort((a, b) => {
          const ordA = statusOrder[a.status] ?? 99;
          const ordB = statusOrder[b.status] ?? 99;
          return ordA - ordB;
        });

        // Reassign 1-based sequential priorities matching task-agent sync_mission
        for (let i = 0; i < issues.length; i++) {
          issues[i].priority = i + 1;
        }

        const slugToIssue = new Map(issues.map(i => [i.slug, i]));
        const rowsToDisplay = buildHierarchyRows(issues);

        const tableHtml = formatTaskQueueTable(repo, rowsToDisplay, slugToIssue, completedSlugs);

        return {
          status: 200,
          message: tableHtml,
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
        const { at, id } = newOpId();
        const op = buildCreateOp(slug, title, content, at, id);
        const opPath = `.task-agent/ops/${HANDTERM_WRITER}/${id}.op.json`;
        const saveRes = await commitRepoFiles(context.auth, repo, commitMessage, [
          { path: taskPath, content },
          { path: opPath, content: `${JSON.stringify(op, null, 2)}\n` },
        ]);

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
          const treeRes = await getRepoTree(context.auth, repo, undefined, undefined, true);
          if (treeRes.status === 401 || !treeRes.data) {
            return {
              status: treeRes.status,
              message: 'GitHub account not linked or unauthorized. Run "gh link" to authenticate.',
            };
          }

          const treeTasks = parseTasksFromTree(treeRes.data);
          const activeTasks = treeTasks.filter(t => t.status === 'ACTIVE');
          if (activeTasks.length === 0) {
            return {
              status: 200,
              message: 'No active tasks.',
            };
          }

          const taskDetails = await Promise.all(
            activeTasks.map(async (t) => {
              try {
                const contentRes = await getRepoContent(context.auth, repo, t.path);
                if (contentRes.status === 200 && contentRes.data?.content) {
                  const raw = contentRes.data.content;
                  const fm = parseFrontmatter(raw);
                  const title = extractTitleFromContent(raw, t.slug);
                  return { slug: t.slug, title, fm };
                }
              } catch {
                // fallback
              }
              return { slug: t.slug, title: t.slug, fm: {} as TaskFrontmatter };
            })
          );

          const detailsBySlug = new Map(taskDetails.map(d => [d.slug, d]));
          const issues: TaskItem[] = activeTasks.map((t, idx) => {
            const det = detailsBySlug.get(t.slug);
            return {
              name: det?.title || t.slug,
              slug: t.slug,
              status: 'ACTIVE',
              path: t.path,
              priority: idx + 1,
              date: formatDateMMDD(det?.fm.created_at),
              blocked_by: det?.fm.blocked_by || [],
              subtask_of: det?.fm.subtask_of,
            };
          });

          const slugToIssue = new Map(issues.map(i => [i.slug, i]));
          const rowsToDisplay = buildHierarchyRows(issues);
          const completedSlugs = new Set(
            treeTasks.filter(t => t.status === 'COMPLETED').map(t => t.slug)
          );

          return {
            status: 200,
            message: formatTaskQueueTable(repo, rowsToDisplay, slugToIssue, completedSlugs),
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
