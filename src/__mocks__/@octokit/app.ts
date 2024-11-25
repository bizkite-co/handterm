export class App {
  constructor(options: { appId: string; privateKey: string }) {
    return {
      getInstallationOctokit: jest.fn().mockResolvedValue({
        auth: jest.fn().mockResolvedValue({
          type: 'token',
          tokenType: 'installation',
          token: 'test-token',
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        }),
        rest: {
          apps: {
            getUserInstallation: jest.fn().mockResolvedValue({
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
