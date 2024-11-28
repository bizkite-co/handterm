import axios from 'axios';
import ENDPOINTS from '../shared/endpoints.json';
import { IAuthProps } from '../hooks/useAuth';

export interface APIResponse<T> {
    status: number;
    data?: T;
    error?: string;
}

export interface FileContentResponse {
    content: string;
    encoding?: string;
    sha?: string;
    size?: number;
}

export interface TreeItemResponse {
    path: string;
    type: string;
    sha?: string;
    size?: number;
}

export interface RepoResponse {
    name: string;
    description?: string;
    private: boolean;
    default_branch: string;
}

export interface SaveRepoFileResponse {
    commit: {
        sha: string;
        url: string;
    };
    content: {
        sha: string;
    };
}

// Create axios instance with base configuration
const api = axios.create({
    baseURL: ENDPOINTS.api.BaseUrl,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

export async function makeAuthenticatedRequest<T>(
    auth: IAuthProps,
    endpoint: string,
    params?: Record<string, string>,
    method: 'GET' | 'POST' = 'GET',
    data?: any
): Promise<APIResponse<T>> {
    try {
        const authResponse = await auth.validateAndRefreshToken();
        if (!authResponse || authResponse.status !== 200 || !authResponse.data) {
            return {
                status: 401,
                error: 'Authentication failed'
            };
        }

        // Get access token from auth response
        const accessToken = authResponse.data.AccessToken;
        if (!accessToken) {
            return {
                status: 401,
                error: 'Access token not found'
            };
        }

        const response = await api({
            method,
            url: endpoint,
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            params,
            data
        });

        return {
            status: response.status,
            data: response.data
        };
    } catch (error: any) {
        console.error('API request failed:', error);
        if (error.response) {
            return {
                status: error.response.status,
                error: error.response.data?.message || 'Request failed with status ' + error.response.status
            };
        }
        return {
            status: 500,
            error: error.message || 'Request failed'
        };
    }
}

export async function getRepoTree(auth: IAuthProps, repo: string, path?: string, sha?: string) {
    return makeAuthenticatedRequest<TreeItemResponse[]>(auth, ENDPOINTS.api.GetRepoTree, {
        repo,
        ...(path && { path }),
        ...(sha && { sha })
    });
}

export async function getFileContent(auth: IAuthProps, repo: string, path: string) {
    // Use the same getRepoTree endpoint - it handles both tree and file content
    return makeAuthenticatedRequest<FileContentResponse>(auth, ENDPOINTS.api.GetRepoTree, {
        repo,
        path
    });
}

export async function saveRepoFile(auth: IAuthProps, repo: string, path: string, content: string, message: string) {
    return makeAuthenticatedRequest<SaveRepoFileResponse>(
        auth,
        ENDPOINTS.api.SaveRepoFile,
        { repo, path, message },
        'POST',
        content
    );
}

export async function listRecentRepos(auth: IAuthProps) {
    return makeAuthenticatedRequest<RepoResponse[]>(auth, ENDPOINTS.api.ListRecentRepos);
}
