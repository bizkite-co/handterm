import { vi } from 'vitest';

interface OctokitInstance {
  auth: () => Promise<{
    type: string;
    tokenType: string;
    token: string;
    expiresAt: string;
  }>;
  rest: {
    apps: {
      getUserInstallation: () => Promise<{
        data: {
          id: number;
          account: {
            login: string;
          };
        };
      }>;
    };
  };
}

export class App {
  getInstallationOctokit(): Promise<OctokitInstance> {
    return Promise.resolve({
      auth: vi.fn().mockResolvedValue({
        type: 'token',
        tokenType: 'installation',
        token: 'test-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      }),
      rest: {
        apps: {
          getUserInstallation: vi.fn().mockResolvedValue({
            data: {
              id: 12345,
              account: {
                login: 'testuser',
              },
            },
          }),
        },
      },
    });
  }
}
