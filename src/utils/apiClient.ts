import axios from 'axios';

import { type IAuthProps } from '../hooks/useAuth';
import ENDPOINTS from '../shared/endpoints.json';

import { createLogger } from './Logger';

const logger = createLogger();

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

interface ErrorResponse {
    message?: string;
}

function isErrorResponse(obj: unknown): obj is ErrorResponse {
    return typeof obj === 'object' && obj !== null && 'message' in obj;
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
        const accessToken = authResponse.data.accessToken;
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
            data: response.data as T
        };
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error(`API request failed: ${error.message}`);
        }

        if (axios.isAxiosError<ErrorResponse>(error)) {
            if (error.response) {
                const responseData = error.response.data;
                const message = isErrorResponse(responseData) && typeof responseData.message === 'string'
                    ? responseData.message
                    : `Request failed with status ${error.response.status}`;
                return {
                    status: error.response.status,
                    error: message
                };
            }
            return {
                status: 500,
                error: typeof error.message === 'string' ? error.message : 'Request failed'
            };
        }

        return {
            status: 500,
            error: 'An unknown error occurred'
        };
    }
}

export async function getRepoTree(auth: IAuthProps, repo: string, path?: string, sha?: string): Promise<APIResponse<TreeItemResponse[]>> {
    return makeAuthenticatedRequest<TreeItemResponse[]>(auth, ENDPOINTS.api.GetRepoTree, {
        repo,
        ...(path && { path }),
        ...(sha && { sha })
    });
}

export async function getFileContent(auth: IAuthProps, repo: string, path: string): Promise<APIResponse<FileContentResponse>> {
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
): Promise<APIResponse<SaveRepoFileResponse>> {
    return makeAuthenticatedRequest<SaveRepoFileResponse>(
        auth,
        ENDPOINTS.api.SaveRepoFile,
        { repo, path, message },
        'POST',
        content
    );
}

export async function listRecentRepos(auth: IAuthProps): Promise<APIResponse<RepoResponse[]>> {
    return makeAuthenticatedRequest<RepoResponse[]>(auth, ENDPOINTS.api.ListRecentRepos);
}

export async function unlinkGitHub(auth: IAuthProps): Promise<APIResponse<{ message: string }>> {
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
