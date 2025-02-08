import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAWSAPI } from '../../hooks/useAWSAPI';
import * as awsApiClient from '../../utils/awsApiClient';

// Mock the AWS API client
vi.mock('../../utils/awsApiClient', () => ({
    getFile: vi.fn(),
    putFile: vi.fn()
}));

// Mock the auth hook
vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({
        validateAndRefreshToken: vi.fn().mockResolvedValue({
            status: 200,
            data: {
                AccessToken: 'mock-access-token',
                RefreshToken: 'mock-refresh-token',
                IdToken: 'mock-id-token',
                ExpiresIn: '3600'
            }
        }),
        login: vi.fn(),
        signup: vi.fn(),
        verify: vi.fn(),
        refreshToken: vi.fn(),
        isLoggedIn: true,
        isLoading: false,
        isError: false,
        error: null,
        isPending: false
    })
}));

describe('useAWSAPI Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getFileContent', () => {
        it('should successfully get file content', async () => {
            const mockResponse = {
                status: 200,
                data: {
                    content: 'file content',
                    encoding: 'utf-8',
                    lastModified: '2025-02-07T00:00:00Z',
                    size: 123
                }
            };

            (awsApiClient.getFile as any).mockResolvedValueOnce(mockResponse);

            const { result } = renderHook(() => useAWSAPI());
            const response = await result.current.getFileContent('test.md');

            expect(response.status).toBe(200);
            expect(response.data).toEqual(mockResponse.data);
            expect(awsApiClient.getFile).toHaveBeenCalledWith(expect.any(Object), 'test.md');
        });

        it('should handle errors', async () => {
            const mockError = {
                status: 404,
                error: 'File not found'
            };

            (awsApiClient.getFile as any).mockResolvedValueOnce(mockError);

            const { result } = renderHook(() => useAWSAPI());
            const response = await result.current.getFileContent('test.md');

            expect(response.status).toBe(404);
            expect(response.error).toBe('File not found');
        });
    });

    describe('saveFileContent', () => {
        it('should successfully save file content', async () => {
            const mockResponse = {
                status: 200,
                data: {
                    message: 'File saved successfully'
                }
            };

            (awsApiClient.putFile as any).mockResolvedValueOnce(mockResponse);

            const { result } = renderHook(() => useAWSAPI());
            const response = await result.current.saveFileContent('test.md', 'new content');

            expect(response.status).toBe(200);
            expect(response.data).toEqual(mockResponse.data);
            expect(awsApiClient.putFile).toHaveBeenCalledWith(expect.any(Object), 'test.md', 'new content');
        });

        it('should handle errors', async () => {
            const mockError = {
                status: 500,
                error: 'Server error'
            };

            (awsApiClient.putFile as any).mockResolvedValueOnce(mockError);

            const { result } = renderHook(() => useAWSAPI());
            const response = await result.current.saveFileContent('test.md', 'content');

            expect(response.status).toBe(500);
            expect(response.error).toBe('Server error');
        });
    });
});