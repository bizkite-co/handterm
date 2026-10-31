import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type ICommandContext } from 'src/contexts/CommandContext';
import { type IAuthProps } from 'src/hooks/useAuth';
import { type ParsedCommand } from '@handterm/types';

import * as apiClient from 'src/utils/apiClient';
import {
  TaCommand,
  slugify,
  parseTasksFromTree,
  parseFrontmatter,
  formatDateMMDD,
  parseMissionUsv,
  buildHierarchyRows,
  formatTaskQueueTable,
  extractTitleFromContent,
  DEFAULT_TASK_REPO,
  type TaskItem,
} from '../TaCommand';

vi.mock('src/utils/apiClient', () => ({
  getRepoTree: vi.fn(),
  getRepoContent: vi.fn(),
  saveRepoFile: vi.fn(),
  commitRepoFiles: vi.fn(),
}));

describe('TaCommand', () => {
  const createMockContext = (overrides: Partial<ICommandContext> = {}): ICommandContext => ({
    executeCommand: vi.fn(),
    commandHistory: [],
    addToCommandHistory: vi.fn(),
    output: [],
    appendToOutput: vi.fn(),
    handTermRef: { current: null },
    auth: {
      user: { id: 'user-1', email: 'test@example.com' },
      token: 'jwt-token',
    } as unknown as IAuthProps,
    updateLocation: vi.fn(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('slugify', () => {
    it('converts to lowercase and replaces spaces and symbols with hyphens', () => {
      expect(slugify('My First Task!')).toBe('my-first-task');
      expect(slugify('Add ta (task-agent) command')).toBe('add-ta-task-agent-command');
      expect(slugify('test___task___name')).toBe('test-task-name');
    });

    it('removes file extensions from the slug', () => {
      expect(slugify('my-task.md')).toBe('my-task');
      expect(slugify('config.json')).toBe('config');
      expect(slugify('notes.yaml')).toBe('notes');
    });

    it('trims leading and trailing hyphens', () => {
      expect(slugify('--leading-trailing--')).toBe('leading-trailing');
    });
  });

  describe('parseTasksFromTree', () => {
    it('extracts task entries from tree items and sorts active before pending', () => {
      const treeItems = [
        { path: 'pending/second-task/README.md', mode: '100644', type: 'blob', sha: 'sha1' },
        { path: 'active/first-task/README.md', mode: '100644', type: 'blob', sha: 'sha2' },
        { path: 'completed/old-task/README.md', mode: '100644', type: 'blob', sha: 'sha3' },
        { path: 'completed/2026/07/archived-task/README.md', mode: '100644', type: 'blob', sha: 'sha4' },
        { path: 'other/file.txt', mode: '100644', type: 'blob', sha: 'sha5' },
      ];

      const tasks = parseTasksFromTree(treeItems);
      expect(tasks).toHaveLength(4);
      expect(tasks[0]).toEqual({
        status: 'ACTIVE',
        slug: 'first-task',
        path: 'active/first-task/README.md',
      });
      expect(tasks[1]).toEqual({
        status: 'PENDING',
        slug: 'second-task',
        path: 'pending/second-task/README.md',
      });
      expect(tasks[2]).toEqual({
        status: 'COMPLETED',
        slug: 'archived-task',
        path: 'completed/2026/07/archived-task/README.md',
      });
      expect(tasks[3]).toEqual({
        status: 'COMPLETED',
        slug: 'old-task',
        path: 'completed/old-task/README.md',
      });
    });

    it('supports flat markdown task files like pending/task-name.md', () => {
      const treeItems = [
        { path: 'pending/flat-task.md', mode: '100644', type: 'blob', sha: 'sha5' },
      ];
      const tasks = parseTasksFromTree(treeItems);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].slug).toBe('flat-task');
      expect(tasks[0].status).toBe('PENDING');
    });

    it('deduplicates tasks if multiple paths exist for same slug and status', () => {
      const treeItems = [
        { path: 'pending/task-dup/README.md', mode: '100644', type: 'blob', sha: 'sha6' },
        { path: 'pending/task-dup.md', mode: '100644', type: 'blob', sha: 'sha7' },
      ];
      const tasks = parseTasksFromTree(treeItems);
      expect(tasks).toHaveLength(1);
    });

    it('ignores secondary markdown documents inside task directories', () => {
      const treeItems = [
        { path: 'active/yazi-like-file-browse-br/README.md', mode: '100644', type: 'blob', sha: 'sha1' },
        { path: 'active/yazi-like-file-browse-br/findings-and-plan.md', mode: '100644', type: 'blob', sha: 'sha2' },
        { path: 'active/yazi-like-file-browse-br/progress.md', mode: '100644', type: 'blob', sha: 'sha3' },
        { path: 'active/yazi-like-file-browse-br/video-mode-transparency.md', mode: '100644', type: 'blob', sha: 'sha4' },
        { path: 'pending/my-task/implementation-notes.md', mode: '100644', type: 'blob', sha: 'sha5' },
      ];
      const tasks = parseTasksFromTree(treeItems);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].slug).toBe('yazi-like-file-browse-br');
    });
  });

  describe('parseFrontmatter and formatDateMMDD', () => {
    it('parses created_at, blocked_by, and subtask_of from frontmatter', () => {
      const content = `---
created_at: 2026-08-25T11:59:13.281330-07:00
blocked_by: task-a, task-b
subtask_of: parent-task
---

# My Task Title
`;
      const fm = parseFrontmatter(content);
      expect(fm.created_at).toBe('2026-08-25T11:59:13.281330-07:00');
      expect(fm.blocked_by).toEqual(['task-a', 'task-b']);
      expect(fm.subtask_of).toBe('parent-task');
      expect(formatDateMMDD(fm.created_at)).toBe('08-25');
    });

    it('handles frontmatter without dependencies or subtask', () => {
      const content = `---
created_at: 2026-10-13T10:00:00Z
---
`;
      const fm = parseFrontmatter(content);
      expect(fm.created_at).toBe('2026-10-13T10:00:00Z');
      expect(fm.blocked_by).toBeUndefined();
      expect(fm.subtask_of).toBeUndefined();
      expect(formatDateMMDD(fm.created_at)).toBe('10-13');
    });
  });

  describe('parseMissionUsv', () => {
    it('parses USV delimited fields correctly', () => {
      const usv = [
        'Root Task\x1froot-task\x1f\x1f',
        'Subtask A\x1fsub-a\x1f\x1froot-task',
        'Subtask B\x1fsub-b\x1fsub-a\x1froot-task',
      ].join('\n');

      const items = parseMissionUsv(usv);
      expect(items).toHaveLength(3);
      expect(items[0]).toEqual({ name: 'Root Task', slug: 'root-task', blocked_by: [] });
      expect(items[1]).toEqual({ name: 'Subtask A', slug: 'sub-a', blocked_by: [], subtask_of: 'root-task' });
      expect(items[2]).toEqual({ name: 'Subtask B', slug: 'sub-b', blocked_by: ['sub-a'], subtask_of: 'root-task' });
    });
  });

  describe('buildHierarchyRows and formatTaskQueueTable', () => {
    it('nests subtasks under their parent with └─ prefix and formats table', () => {
      const issues: TaskItem[] = [
        {
          name: 'Parent 1',
          slug: 'parent-1',
          status: 'ACTIVE',
          path: 'active/parent-1/README.md',
          priority: 1,
          date: '08-25',
          blocked_by: [],
        },
        {
          name: 'Child 1',
          slug: 'child-1',
          status: 'PENDING',
          path: 'pending/child-1/README.md',
          priority: 2,
          date: '08-25',
          blocked_by: [],
          subtask_of: 'parent-1',
        },
        {
          name: 'Independent 2',
          slug: 'independent-2',
          status: 'ACTIVE',
          path: 'active/independent-2/README.md',
          priority: 3,
          date: '10-13',
          blocked_by: ['child-1'],
        },
      ];

      const slugToIssue = new Map(issues.map(i => [i.slug, i]));
      const completedSlugs = new Set<string>();
      const rows = buildHierarchyRows(issues);

      expect(rows).toHaveLength(3);
      expect(rows[0].issue.slug).toBe('parent-1');
      expect(rows[0].depth).toBe(0);
      expect(rows[1].issue.slug).toBe('child-1');
      expect(rows[1].depth).toBe(1);
      expect(rows[2].issue.slug).toBe('independent-2');
      expect(rows[2].depth).toBe(0);

      const table = formatTaskQueueTable('bizkite-co/handterm-tasks', rows, slugToIssue, completedSlugs);
      expect(table).toContain('Store remote: git@github.com:bizkite-co/handterm-tasks.git');
      expect(table).toContain('Task Queue');
      expect(table).toContain('Pri  Date   Status   Blocked   Slug');
      expect(table).toContain('<span class="ta-pri">  1</span>  <span class="ta-date">08-25</span>  <span class="ta-active">ACTIVE </span>  <span class="ta-blocked">        </span>  <span class="ta-slug">parent-1</span>');
      expect(table).toContain('<span class="ta-pri">  2</span>  <span class="ta-date">08-25</span>  <span class="ta-pending">PENDING</span>  <span class="ta-blocked">        </span>  <span class="ta-tree">└─ </span><span class="ta-slug">child-1</span>');
      // independent-2 is blocked by child-1 (pri 2)
      expect(table).toContain('<span class="ta-pri">  3</span>  <span class="ta-date">10-13</span>  <span class="ta-active">ACTIVE </span>  <span class="ta-blocked">2       </span>  <span class="ta-slug">independent-2</span>');
    });
  });

  describe('extractTitleFromContent', () => {
    it('extracts first H1 title from content', () => {
      const md = `---
created_at: 2026-10-25T16:00:00Z
---

# Build the New Feature

Details here...`;
      expect(extractTitleFromContent(md, 'fallback')).toBe('Build the New Feature');
    });

    it('returns fallback slug if no H1 exists', () => {
      const md = `Just text without headers.`;
      expect(extractTitleFromContent(md, 'my-fallback-slug')).toBe('my-fallback-slug');
    });
  });

  describe('command execution', () => {
    it('returns help output for "ta help"', async () => {
      const context = createMockContext();
      const parsedCommand: ParsedCommand = {
        command: 'ta',
        args: ['help'],
        switches: {},
      };

      const res = await TaCommand.execute(context, parsedCommand);
      expect(res.status).toBe(200);
      expect(res.message).toContain('ta list');
      expect(res.message).toContain('ta new');
      expect(res.message).toContain('ta active');
    });

    it('returns help output when run with no arguments ("ta")', async () => {
      const context = createMockContext();
      const parsedCommand: ParsedCommand = {
        command: 'ta',
        args: [],
        switches: {},
      };

      const res = await TaCommand.execute(context, parsedCommand);
      expect(res.status).toBe(200);
      expect(res.message).toContain('ta list');
      expect(res.message).toContain('ta new');
      expect(res.message).toContain('ta active');
    });

    describe('ta list', () => {
      it('returns 401 prompt when GitHub is not linked or unauthorized', async () => {
        vi.mocked(apiClient.getRepoTree).mockResolvedValue({
          status: 401,
          error: 'Unauthorized',
        });

        const context = createMockContext();
        const parsedCommand: ParsedCommand = {
          command: 'ta',
          args: ['list'],
          switches: {},
        };

        const res = await TaCommand.execute(context, parsedCommand);
        expect(res.status).toBe(401);
        expect(res.message).toContain('gh link');
      });

      it('returns message when no active or pending tasks exist', async () => {
        vi.mocked(apiClient.getRepoTree).mockResolvedValue({
          status: 200,
          data: [],
        });

        const context = createMockContext();
        const parsedCommand: ParsedCommand = {
          command: 'ta',
          args: ['list'],
          switches: {},
        };

        const res = await TaCommand.execute(context, parsedCommand);
        expect(res.status).toBe(200);
        expect(res.message).toContain('No active or pending tasks found');
      });

      it('lists active and pending tasks with titles retrieved from file contents and table formatting', async () => {
        vi.mocked(apiClient.getRepoTree).mockResolvedValue({
          status: 200,
          data: [
            { path: 'active/current-work/README.md', mode: '100644', type: 'blob', sha: 'sha1' },
            { path: 'pending/next-work/README.md', mode: '100644', type: 'blob', sha: 'sha2' },
          ],
        });

        vi.mocked(apiClient.getRepoContent).mockImplementation(async (_auth, _repo, path) => {
          if (path === 'active/current-work/README.md') {
            return {
              status: 200,
              data: {
                content: '---\ncreated_at: 2026-08-25T11:00:00Z\n---\n\n# Implement Core Engine\n\nSome body',
                encoding: 'utf-8',
                sha: 's1',
                size: 30,
              },
            };
          }
          if (path === 'pending/next-work/README.md') {
            return {
              status: 200,
              data: {
                content: '---\ncreated_at: 2026-10-13T10:00:00Z\n---\n\n# Add Unit Tests\n\nSome body',
                encoding: 'utf-8',
                sha: 's2',
                size: 25,
              },
            };
          }
          return { status: 404, error: 'Not found' };
        });

        const context = createMockContext();
        const parsedCommand: ParsedCommand = {
          command: 'ta',
          args: ['list'],
          switches: {},
        };

        const res = await TaCommand.execute(context, parsedCommand);
        expect(res.status).toBe(200);
        expect(res.message).toContain('Store remote: git@github.com:bizkite-co/handterm-tasks.git');
        expect(res.message).toContain('Task Queue');
        expect(res.message).toContain('Pri  Date   Status   Blocked   Slug');
        expect(res.message).toContain('ACTIVE </span>');
        expect(res.message).toContain('PENDING</span>');
        expect(res.message).toContain('current-work');
        expect(res.message).toContain('next-work');
        expect(res.message).toContain('08-25');
        expect(res.message).toContain('10-13');
      });

      it('falls back to fetching active and pending subtrees if root returns directory stubs (un-deployed CDK)', async () => {
        vi.mocked(apiClient.getRepoTree).mockImplementation(async (_auth, _repo, path) => {
          if (!path) {
            // Root query on old backend returns only directory stubs
            return {
              status: 200,
              data: [
                { path: 'active', mode: '040000', type: 'tree', sha: 't1' },
                { path: 'pending', mode: '040000', type: 'tree', sha: 't2' },
              ],
            };
          }
          if (path === 'active') {
            return {
              status: 200,
              data: [
                { path: 'active/current-work/README.md', mode: '100644', type: 'blob', sha: 'sha1' },
              ],
            };
          }
          if (path === 'pending') {
            return {
              status: 200,
              data: [
                { path: 'pending/next-work/README.md', mode: '100644', type: 'blob', sha: 'sha2' },
              ],
            };
          }
          return { status: 200, data: [] };
        });

        vi.mocked(apiClient.getRepoContent).mockImplementation(async (_auth, _repo, path) => {
          if (path === 'active/current-work/README.md') {
            return {
              status: 200,
              data: {
                content: '---\ncreated_at: 2026-08-25T11:00:00Z\n---\n\n# Implement Core Engine',
                encoding: 'utf-8',
                sha: 's1',
                size: 30,
              },
            };
          }
          if (path === 'pending/next-work/README.md') {
            return {
              status: 200,
              data: {
                content: '---\ncreated_at: 2026-10-13T10:00:00Z\n---\n\n# Add Unit Tests',
                encoding: 'utf-8',
                sha: 's2',
                size: 25,
              },
            };
          }
          return { status: 404, error: 'Not found' };
        });

        const context = createMockContext();
        const parsedCommand: ParsedCommand = {
          command: 'ta',
          args: ['list'],
          switches: {},
        };

        const res = await TaCommand.execute(context, parsedCommand);
        expect(res.status).toBe(200);
        expect(res.message).toContain('current-work');
        expect(res.message).toContain('next-work');
        expect(res.message).toContain('ACTIVE </span>');
        expect(res.message).toContain('PENDING</span>');
      });
    });

    describe('ta new', () => {
      it('returns 400 when no title is provided', async () => {
        const context = createMockContext();
        const parsedCommand: ParsedCommand = {
          command: 'ta',
          args: ['new'],
          switches: {},
        };

        const res = await TaCommand.execute(context, parsedCommand);
        expect(res.status).toBe(400);
        expect(res.message).toContain('Title required');
      });

      it('creates a new task with criteria and body and commits to pending/<slug>/README.md', async () => {
        vi.mocked(apiClient.commitRepoFiles).mockResolvedValue({
          status: 200,
          data: { commit: { sha: 'newsha' }, branch: 'main' },
        });

        const context = createMockContext();
        const parsedCommand: ParsedCommand = {
          command: 'ta',
          args: ['new', 'Support', 'Custom', 'Themes'],
          switches: {
            c: 'All themes load correctly',
            b: 'User can choose dark or light mode',
          },
        };

        const res = await TaCommand.execute(context, parsedCommand);
        expect(res.status).toBe(200);
        expect(res.message).toContain('Created task: support-custom-themes (Status: pending)');

        expect(apiClient.commitRepoFiles).toHaveBeenCalledWith(
          context.auth,
          DEFAULT_TASK_REPO,
          'task: create support-custom-themes',
          expect.any(Array)
        );

        const files = vi.mocked(apiClient.commitRepoFiles).mock.calls[0][3];
        const readme = files.find((file) => file.path === 'pending/support-custom-themes/README.md');
        const opFile = files.find((file) => file.path.startsWith('.task-agent/ops/handterm/'));
        expect(readme?.content).toContain('created_at:');
        expect(readme?.content).toContain('User can choose dark or light mode');
        expect(readme?.content).toContain('## Completion Criteria\n\nAll themes load correctly');
        expect(opFile).toBeDefined();
        const op = JSON.parse(opFile?.content ?? '{}') as { verb: string; payload: { body: string } };
        expect(op.verb).toBe('create');
        expect(op.payload.body).toContain('# Support Custom Themes');
      });

      it('handles 401 unauthorized on save', async () => {
        vi.mocked(apiClient.commitRepoFiles).mockResolvedValue({
          status: 401,
          error: 'Unauthorized',
        });

        const context = createMockContext();
        const parsedCommand: ParsedCommand = {
          command: 'ta',
          args: ['new', 'Test Task'],
          switches: {},
        };

        const res = await TaCommand.execute(context, parsedCommand);
        expect(res.status).toBe(401);
        expect(res.message).toContain('gh link');
      });
    });

    describe('ta active', () => {
      it('lists active tasks when no slug is provided', async () => {
        vi.mocked(apiClient.getRepoTree).mockResolvedValue({
          status: 200,
          data: [
            { path: 'active/task-one/README.md', mode: '100644', type: 'blob', sha: 'sha1' },
            { path: 'pending/task-two/README.md', mode: '100644', type: 'blob', sha: 'sha2' },
          ],
        });

        vi.mocked(apiClient.getRepoContent).mockResolvedValue({
          status: 200,
          data: { content: '# Task One In Progress', encoding: 'utf-8', sha: 's1', size: 20 },
        });

        const context = createMockContext();
        const parsedCommand: ParsedCommand = {
          command: 'ta',
          args: ['active'],
          switches: {},
        };

        const res = await TaCommand.execute(context, parsedCommand);
        expect(res.status).toBe(200);
        expect(res.message).toContain('ACTIVE </span>');
        expect(res.message).toContain('task-one');
        expect(res.message).not.toContain('task-two');
      });

      it('returns message if no active tasks when listing', async () => {
        vi.mocked(apiClient.getRepoTree).mockResolvedValue({
          status: 200,
          data: [
            { path: 'pending/task-two/README.md', mode: '100644', type: 'blob', sha: 'sha2' },
          ],
        });

        const context = createMockContext();
        const parsedCommand: ParsedCommand = {
          command: 'ta',
          args: ['active'],
          switches: {},
        };

        const res = await TaCommand.execute(context, parsedCommand);
        expect(res.status).toBe(200);
        expect(res.message).toContain('No active tasks');
      });

      it('activates a pending task by writing to active/<slug>/README.md', async () => {
        vi.mocked(apiClient.getRepoContent).mockImplementation(async (_auth, _repo, path) => {
          if (path === 'pending/my-feature/README.md') {
            return {
              status: 200,
              data: {
                content: '# My Feature\n\nImplement this soon.',
                encoding: 'utf-8',
                sha: 'p1',
                size: 35,
              },
            };
          }
          return { status: 404, error: 'Not found' };
        });

        vi.mocked(apiClient.saveRepoFile).mockResolvedValue({
          status: 200,
          data: { content: { sha: 'a1' } },
        });

        const context = createMockContext();
        const parsedCommand: ParsedCommand = {
          command: 'ta',
          args: ['active', 'my-feature'],
          switches: {},
        };

        const res = await TaCommand.execute(context, parsedCommand);
        expect(res.status).toBe(200);
        expect(res.message).toBe("Task 'my-feature' is now active.");

        expect(apiClient.saveRepoFile).toHaveBeenCalledWith(
          context.auth,
          DEFAULT_TASK_REPO,
          'active/my-feature/README.md',
          '# My Feature\n\nImplement this soon.',
          'task: activate my-feature'
        );
      });

      it('informs user if task is already active', async () => {
        vi.mocked(apiClient.getRepoContent).mockImplementation(async (_auth, _repo, path) => {
          if (path === 'active/already-active/README.md') {
            return {
              status: 200,
              data: { content: '# Already Done', encoding: 'utf-8', sha: 'a1', size: 20 },
            };
          }
          return { status: 404, error: 'Not found' };
        });

        const context = createMockContext();
        const parsedCommand: ParsedCommand = {
          command: 'ta',
          args: ['active', 'already-active'],
          switches: {},
        };

        const res = await TaCommand.execute(context, parsedCommand);
        expect(res.status).toBe(200);
        expect(res.message).toContain("already active");
      });

      it('returns 404 if task is not found in pending queue', async () => {
        vi.mocked(apiClient.getRepoContent).mockResolvedValue({
          status: 404,
          error: 'Not found',
        });

        const context = createMockContext();
        const parsedCommand: ParsedCommand = {
          command: 'ta',
          args: ['active', 'non-existent-task'],
          switches: {},
        };

        const res = await TaCommand.execute(context, parsedCommand);
        expect(res.status).toBe(404);
        expect(res.message).toContain("Task 'non-existent-task' not found in pending queue.");
      });
    });
  });
});
