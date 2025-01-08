export const TokenKeys = {
  AccessToken: 'AccessToken',
  RefreshToken: 'RefreshToken',
  IdToken: 'IdToken',
  ExpiresAt: 'expiresAt',
  ExpiresIn: 'ExpiresIn',
  GithubUsername: 'githubUsername'
} as const;

export type TokenKey = keyof typeof TokenKeys;

export interface AuthResponse {
    AccessToken: string;
    ExpiresIn: number;
    IdToken: string;
    RefreshToken: string;
    TokenType: string;
    githubUsername: string;
    cookies: string[];
    status: number;
    message?: string;
}
