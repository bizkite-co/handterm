

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
