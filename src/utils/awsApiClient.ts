import type { AxiosError, AxiosInstance } from 'axios';
import axios from 'axios';
import { Schema } from '@effect/schema';

import { type IAuthProps } from '../types/HandTerm';
import ENDPOINTS from '../shared/endpoints.json';
import { createLogger } from './Logger';
import {
    FileContentResponseSchema,
    MessageResponseSchema,
    ListFilesResponseSchema,
} from '@handterm/types';

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
    data?: unknown,
    responseSchema?: Schema.Schema<any, any>
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

            // Validate the response shape against the schema when one is provided.
            // A malformed shape (e.g. a missing `content` field) surfaces as a
            // typed 502 error instead of silently returning undefined data.
            if (responseSchema != null) {
                const either = Schema.decodeUnknownEither(responseSchema)(response.data);
                if (either._tag === 'Left') {
                    const decodeMessage = (either.left as { message?: string })?.message
                        ?? 'response failed schema validation';
                    logger.error(`Response schema validation failed for ${endpoint}: ${decodeMessage}`);
                    return {
                        status: 502,
                        error: `Invalid response shape: ${decodeMessage}`
                    };
                }
                return {
                    status: response.status,
                    data: either.right as T
                };
            }

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
    const [ key = '', extension = '' ] = path.split('.');
    return makeAuthenticatedRequest<FileContentResponse>(
        auth,
        ENDPOINTS.api.GetFile,
        { key, extension },
        'GET',
        undefined,
        FileContentResponseSchema
    );
}

export async function putFile(
    auth: IAuthProps,
    path: string = '_index.md',
    content: string
): Promise<APIResponse<{ message: string }>> {
    const [ key = '', extension = '' ] = path.split('.');
    return makeAuthenticatedRequest<{ message: string }>(
        auth,
        ENDPOINTS.api.PutFile,
        undefined,
        'POST',
        { key, extension, content },
        MessageResponseSchema
    );
}

export async function listFiles(
    auth: IAuthProps
): Promise<APIResponse<{ files: string[] }>> {
    return makeAuthenticatedRequest<{ files: string[] }>(
        auth,
        ENDPOINTS.api.ListFiles,
        undefined,
        'POST',
        {},
        ListFilesResponseSchema
    );
}

export async function deleteFile(
    auth: IAuthProps,
    path: string
): Promise<APIResponse<{ message: string }>> {
    return makeAuthenticatedRequest<{ message: string }>(
        auth,
        ENDPOINTS.api.DeleteFile,
        undefined,
        'POST',
        { path },
        MessageResponseSchema
    );
}