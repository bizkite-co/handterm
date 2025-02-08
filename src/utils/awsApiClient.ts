import type { AxiosError, AxiosInstance } from 'axios';
import axios from 'axios';

import { type IAuthProps } from '../types/HandTerm';
import ENDPOINTS from '../shared/endpoints.json';
import { createLogger } from './Logger';

const logger = createLogger();

export interface APIResponse<T> {
    status: number;
    data?: T;
    error?: string | undefined;  // Make error optional to match exactOptionalPropertyTypes
}

export interface FileContentResponse {
    content: string;
    encoding?: string;
    lastModified?: string;
    size?: number;
}

interface ErrorResponse {
    message?: string;
}

function isErrorResponse(obj: unknown): obj is ErrorResponse {
    return typeof obj === 'object' && obj !== null && 'message' in obj;
}

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
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
        if (authResponse == null || authResponse.status !== 200 || authResponse.data == null) {
            return {
                status: 401,
                error: 'Authentication failed'
            };
        }

        // Get access token from auth response
        const accessToken = authResponse.data.AccessToken;
        if (accessToken == null) {
            return {
                status: 401,
                error: 'Access token not found'
            };
        }

        try {
            const response = await api.request<T>({
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
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError<ErrorResponse>;
                // Handle _index.md special case
                if (axiosError.response?.status === 404 && params?.path === '_index.md') {
                    return {
                        status: 200,
                        data: {
                            content: '',
                            encoding: 'utf-8',
                            lastModified: new Date().toISOString(),
                            size: 0
                        } as T
                    };
                }

                if (axiosError.response) {
                    const { status, data } = axiosError.response;
                    const errorMessage = isErrorResponse(data) && data.message ? data.message : `Request failed with status ${status}`;
                    return {
                        status,
                        error: errorMessage
                    };
                }
            }

            // Handle non-axios errors
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            logger.error(`API request failed: ${errorMessage}`);
            return {
                status: 500,
                error: errorMessage
            };
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        logger.error(`Auth request failed: ${errorMessage}`);
        return {
            status: 500,
            error: errorMessage
        };
    }
}

export async function getFile(
    auth: IAuthProps,
    path: string = '_index.md'
): Promise<APIResponse<FileContentResponse>> {
    return makeAuthenticatedRequest<FileContentResponse>(
        auth,
        ENDPOINTS.api.GetFile,
        { path }
    );
}

export async function putFile(
    auth: IAuthProps,
    path: string = '_index.md',
    content: string
): Promise<APIResponse<{ message: string }>> {
    return makeAuthenticatedRequest<{ message: string }>(
        auth,
        ENDPOINTS.api.PutFile,
        { path },
        'POST',
        { content }
    );
}