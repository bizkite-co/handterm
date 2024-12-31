import { vi } from 'vitest';
import type { Mock } from 'vitest';

export function createOctokit(): {
  request: Mock<[string, Record<string, unknown>?], Promise<unknown>>;
  graphql: Mock<[string, Record<string, unknown>?], Promise<unknown>>;
  auth: Mock<[], Promise<{
    type: string;
    tokenType: string;
    token: string;
    expiresAt: string;
  }>>;
} {
  return {
    request: vi.fn(),
    graphql: vi.fn(),
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
