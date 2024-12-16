import { vi } from 'vitest';

export class App {
  constructor() {
    return {
      getInstallationOctokit: vi.fn().mockResolvedValue({
        auth: vi.fn().mockResolvedValue({
          type: 'token',
          tokenType: 'installation',
          token: 'test-token',
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        }),
        rest: {
          apps: {
            getUserInstallation: vi.fn().mockResolvedValue({
              data: {
                id: 12345,
                account: {
                  login: 'testuser'
                }
              }
            })
          }
        }
      })
    };
  }
}
