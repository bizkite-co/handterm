import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { getFile, putFile, type APIResponse, type FileContentResponse } from '../utils/awsApiClient';
import type { IAuthProps } from '../types/HandTerm';

export interface AWSAPIHook {
    getFileContent: (path: string) => Promise<APIResponse<FileContentResponse>>;
    saveFileContent: (path: string, content: string) => Promise<APIResponse<{ message: string }>>;
}

export function useAWSAPI(): AWSAPIHook {
    const auth = useAuth() as IAuthProps;

    const getFileContent = useCallback(async (path: string): Promise<APIResponse<FileContentResponse>> => {
        const response = await getFile(auth, path);
        return response;
    }, [auth]);

    const saveFileContent = useCallback(async (path: string, content: string): Promise<APIResponse<{ message: string }>> => {
        const response = await putFile(auth, path, content);
        return response;
    }, [auth]);

    return {
        getFileContent,
        saveFileContent
    };
}