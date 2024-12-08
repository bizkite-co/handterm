export class Octokit {
  constructor(_options?: { auth?: string }) {
    return {
      rest: {
        repos: {
          listForAuthenticatedUser: jest.fn().mockResolvedValue({
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
          getTree: jest.fn().mockResolvedValue({
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
          getBlob: jest.fn().mockResolvedValue({
            data: {
              content: Buffer.from('Hello, World!').toString('base64'),
              encoding: 'base64',
              sha: 'abcd1234',
              size: 13
            }
          })
        }
      },
      auth: jest.fn().mockResolvedValue({
        type: 'token',
        tokenType: 'installation',
        token: 'test-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      })
    };
  }
}
