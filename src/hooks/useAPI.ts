import { useCallback } from 'react';
import axios, { type AxiosError } from 'axios';

import ENDPOINTS from '../shared/endpoints.json';
import { type IAuthProps } from './useAuth';

interface APIResponse<T> {
    status: number;
    data?: T;
    error?: string;
}

interface FileContentResponse {
    content: string;
    encoding?: string;
    sha?: string;
}

interface TreeItemResponse {
    path: string;
    type: string;
    sha?: string;
    size?: number;
}

interface RepoResponse {
    name: string;
    description?: string;
    private: boolean;
    default_branch: string;
}

interface APIError {
    status: number;
    message: string;
}

export function useAPI(auth: IAuthProps): {
    getRepoTree: (repo: string, path?: string, sha?: string) => Promise<APIResponse<TreeItemResponse[]>>,
    getFileContent: (repo: string, path: string) => Promise<APIResponse<FileContentResponse>>,
    listRecentRepos: () => Promise<APIResponse<RepoResponse[]>>
} {
    const makeAuthenticatedRequest = useCallback(async <T,>(
        endpoint: string,
        params?: Record<string, string>,
        method: 'GET' | 'POST' = 'GET'
    ): Promise<APIResponse<T>> => {
        try {
            const authResponse = await auth.validateAndRefreshToken();
            if (authResponse == null || authResponse.status !== 200 || authResponse.data == null) {
                return {
                    status: 401,
                    error: 'Authentication failed'
                };
            }

            const response = await axios({
                method,
                url: `${ENDPOINTS.api.BaseUrl}${endpoint}`,
                headers: {
                    'Authorization': `Bearer ${authResponse.data.accessToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                params
            });

            return {
                status: response.status,
                data: response.data as T
            };
        } catch (error) {
            const apiError = error as AxiosError<APIError>;

            // Log error without using console.error
            const errorMessage = apiError.response?.data?.message ||
                                 apiError.message ||
                                 'Request failed';

            if (typeof window !== 'undefined' && window.console && window.console.error) {
                window.console.error('API request failed:', errorMessage);
            }

            return {
                status: apiError.response?.status || 500,
                error: errorMessage
            };
        }
    }, [auth.validateAndRefreshToken]);

    const getRepoTree = useCallback(async (repo: string, path?: string, sha?: string) => {
        return makeAuthenticatedRequest<TreeItemResponse[]>(ENDPOINTS.api.GetRepoTree, {
            repo,
            ...(path && { path }),
            ...(sha && { sha })
        });
    }, [makeAuthenticatedRequest]);

    const getFileContent = useCallback(async (repo: string, path: string) => {
        return makeAuthenticatedRequest<FileContentResponse>('/github/file', {
            repo,
            path
        });
    }, [makeAuthenticatedRequest]);

    const listRecentRepos = useCallback(async () => {
        return makeAuthenticatedRequest<RepoResponse[]>(ENDPOINTS.api.ListRecentRepos);
    }, [makeAuthenticatedRequest]);

    return {
        getRepoTree,
        getFileContent,
        listRecentRepos
    };
}
