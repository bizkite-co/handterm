import { vi } from 'vitest';
import type { Mock } from 'vitest';

export function createOctokit(): {
  rest: {
    repos: {
      listForAuthenticatedUser: Mock<[], Promise<{
        data: Array<{
          id: number;
          name: string;
          owner: { login: string };
          full_name: string;
          description: string;
          html_url: string;
          updated_at: string;
          url: string;
          trees_url: string;
        }>;
      }>>;
    };
    git: {
      getTree: Mock<[], Promise<{
        data: {
          tree: Array<{
            path: string;
            type: string;
            sha: string;
          }>;
        };
      }>>;
      getBlob: Mock<[], Promise<{
        data: {
          content: string;
          encoding: string;
          sha: string;
          size: number;
        };
      }>>;
    };
  };
  auth: Mock<[], Promise<{
    type: string;
    tokenType: string;
    token: string;
    expiresAt: string;
  }>>;
} {
  return {
      rest: {
        repos: {
          listForAuthenticatedUser: vi.fn<[], Promise<{
            data: Array<{
              id: number;
              name: string;
              owner: { login: string };
              full_name: string;
              description: string;
              html_url: string;
              updated_at: string;
              url: string;
              trees_url: string;
            }>;
          }>>().mockResolvedValue({
            data: [
              {
                id: 1,
                name: 'test-repo',
                owner: { login: 'testuser' },
                full_name: 'testuser/test-repo',
                description: 'A test repository',
                html_url: 'https://github.com/testuser/test-repo',
                updated_at: '2023-01-01T00:00:00Z',
                url: 'https://api.github.com/repos/testuser/test-repo',
                trees_url: 'https://api.github.com/repos/testuser/test-repo/git/trees{/sha}'
              }
            ]
          })
        },
        git: {
          getTree: vi.fn<[], Promise<{
            data: {
              tree: Array<{
                path: string;
                type: string;
                sha: string;
              }>;
            };
          }>>().mockResolvedValue({
            data: {
              tree: [
                {
                  path: 'README.md',
                  type: 'blob',
                  sha: 'abcd1234'
                },
                {
                  path: 'src',
                  type: 'tree',
                  sha: 'efgh5678'
                }
              ]
            }
          }),
          getBlob: vi.fn<[], Promise<{
            data: {
              content: string;
              encoding: string;
              sha: string;
              size: number;
            };
          }>>().mockResolvedValue({
            data: {
              content: Buffer.from('Hello, World!').toString('base64'),
              encoding: 'base64',
              sha: 'abcd1234',
              size: 13
            }
          })
        }
      },
      auth: vi.fn<[], Promise<{
        type: string;
        tokenType: string;
        token: string;
        expiresAt: string;
      }>>().mockResolvedValue({
        type: 'token',
        tokenType: 'installation',
        token: 'test-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      })
  };
}
