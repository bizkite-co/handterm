import axios from 'axios';

import { IAuthProps } from '../hooks/useAuth';
import ENDPOINTS from '../shared/endpoints.json';

import { Logger } from './Logger';

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

export interface DeviceCodeResponse {
    device_code: string;
    user_code: string;
    verification_uri: string;
    expires_in: number;
    interval: number;
}

export interface DevicePollResponse {
    status: 'pending' | 'complete' | 'error';
    access_token?: string;
    token_type?: string;
    scope?: string;
    message?: string;
    error?: string;
    error_description?: string;
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
    data?: unknown
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
    } catch (error: unknown) {
        Logger.error('API request failed:', error);

        if (axios.isAxiosError(error) && error.response) {
            return {
                status: error.response.status,
                error: error.response.data?.message || 'Request failed with status ' + error.response.status
            };
        } else if (error instanceof Error) {
            return {
                status: 500,
                error: error.message || 'Request failed'
            };
        } else {
            return {
                status: 500,
                error: 'An unknown error occurred'
            };
        }
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

export async function saveRepoFile(
    auth: IAuthProps,
    repo: string,
    path: string,
    content: string,
    message: string
) {
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

export async function unlinkGitHub(auth: IAuthProps) {
    return makeAuthenticatedRequest<{ message: string }>(
        auth,
        ENDPOINTS.api.UnlinkGitHub,
        undefined,
        'POST'
    );
}

export async function getGitHubDeviceCode(
    auth: IAuthProps
): Promise<APIResponse<DeviceCodeResponse>> {
    return makeAuthenticatedRequest<DeviceCodeResponse>(
        auth,
        ENDPOINTS.api.GitHubDeviceCode,
        undefined,
        'POST'
    );
}

export async function pollGitHubDeviceAuth(
    auth: IAuthProps,
    deviceCode: string
): Promise<APIResponse<DevicePollResponse>> {
    return makeAuthenticatedRequest<DevicePollResponse>(
        auth,
        ENDPOINTS.api.GitHubDevicePoll,
        undefined,
        'POST',
        { device_code: deviceCode }
    );
}
