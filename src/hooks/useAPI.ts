import { useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import ENDPOINTS from '../shared/endpoints.json';
import { IAuthProps } from './useAuth';

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

export function useAPI(auth: IAuthProps) {
    const makeAuthenticatedRequest = useCallback(async <T>(
        endpoint: string,
        params?: Record<string, string>,
        method: 'GET' | 'POST' = 'GET'
    ): Promise<APIResponse<T>> => {
        try {
            const authResponse = await auth.validateAndRefreshToken();
            if (!authResponse || authResponse.status !== 200 || !authResponse.data) {
                return {
                    status: 401,
                    error: 'Authentication failed'
                };
            }

            const response = await axios({
                method,
                url: `${ENDPOINTS.api.BaseUrl}${endpoint}`,
                headers: {
                    'Authorization': `Bearer ${authResponse.data.AccessToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                params
            });

            return {
                status: response.status,
                data: response.data
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
    }, [auth]);

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
