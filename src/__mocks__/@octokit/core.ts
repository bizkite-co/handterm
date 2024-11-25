export class Octokit {
  constructor(options?: { auth?: string }) {
    return {
      request: jest.fn(),
      graphql: jest.fn(),
      auth: jest.fn().mockResolvedValue({
        type: 'token',
        tokenType: 'installation',
        token: 'test-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      })
    };
  }
}

export interface OctokitOptions {
  auth?: string;
  baseUrl?: string;
  userAgent?: string;
}

export interface RequestParameters {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: any;
}

export interface GraphQLResponse<T = any> {
  data: T;
}

export interface RequestError extends Error {
  status: number;
  response: {
    data: any;
    status: number;
    headers: Record<string, string>;
  };
}
