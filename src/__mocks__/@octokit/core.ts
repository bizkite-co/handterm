import { vi } from 'vitest';

export class Octokit {
  constructor() {
    return {
      request: vi.fn(),
      graphql: vi.fn(),
      auth: vi.fn().mockResolvedValue({
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
  body?: Record<string, unknown>;
}

export interface GraphQLResponse<T = Record<string, unknown>> {
  data: T;
}

export interface RequestError extends Error {
  status: number;
  response: {
    data: Record<string, unknown>;
    status: number;
    headers: Record<string, string>;
  };
}
