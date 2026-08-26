import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IAuthProps } from '../../types/HandTerm';
import { getFile, putFile, listFiles, deleteFile } from '../../utils/awsApiClient';

// Hoist the mock request fn so the axios mock factory can reference it.
const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }));

vi.mock('axios', () => ({
    default: {
        create: () => ({ request: mockRequest }),
        isAxiosError: (e: unknown) => (e as { isAxiosError?: boolean })?.isAxiosError === true,
    },
    isAxiosError: (e: unknown) => (e as { isAxiosError?: boolean })?.isAxiosError === true,
}));

function makeMockAuth(): IAuthProps {
    return {
        validateAndRefreshToken: vi.fn().mockResolvedValue({
            status: 200,
            data: {
                AccessToken: 'mock-access-token',
                RefreshToken: 'mock-refresh-token',
                IdToken: 'mock-id-token',
                ExpiresIn: 3600,
            },
        }),
        login: vi.fn(),
        signup: vi.fn(),
        verify: vi.fn(),
        refreshToken: vi.fn(),
        isLoggedIn: true,
        isLoading: false,
        isError: false,
        error: null,
        isPending: false,
    };
}

describe('awsApiClient schema validation', () => {
    let auth: IAuthProps;

    beforeEach(() => {
        vi.clearAllMocks();
        auth = makeMockAuth();
    });

    describe('getFile', () => {
        it('returns the content on a well-formed response', async () => {
            mockRequest.mockResolvedValueOnce({
                status: 200,
                data: { content: '# hello', encoding: 'utf-8', size: 7 },
            });

            const res = await getFile(auth, '_index.md');

            expect(res.status).toBe(200);
            expect(res.data?.content).toBe('# hello');
        });

        it('returns a 502 typed error when content is missing', async () => {
            mockRequest.mockResolvedValueOnce({ status: 200, data: { size: 0 } });

            const res = await getFile(auth, '_index.md');

            expect(res.status).toBe(502);
            expect(res.data).toBeUndefined();
            expect(res.error).toMatch(/Invalid response shape/);
        });
    });

    describe('putFile', () => {
        it('returns the message on a well-formed response', async () => {
            mockRequest.mockResolvedValueOnce({ status: 200, data: { message: 'File saved' } });

            const res = await putFile(auth, '_index.md', 'body');

            expect(res.status).toBe(200);
            expect(res.data?.message).toBe('File saved');
        });

        it('returns a 502 typed error when message is missing', async () => {
            mockRequest.mockResolvedValueOnce({ status: 200, data: { saved: true } });

            const res = await putFile(auth, '_index.md', 'body');

            expect(res.status).toBe(502);
            expect(res.data).toBeUndefined();
            expect(res.error).toMatch(/Invalid response shape/);
        });
    });

    describe('listFiles', () => {
        it('returns the files array on a well-formed response', async () => {
            mockRequest.mockResolvedValueOnce({ status: 200, data: { files: ['a.md', 'b.md'] } });

            const res = await listFiles(auth);

            expect(res.status).toBe(200);
            expect(res.data?.files).toEqual(['a.md', 'b.md']);
        });

        it('returns a 502 typed error when files is missing', async () => {
            mockRequest.mockResolvedValueOnce({ status: 200, data: {} });

            const res = await listFiles(auth);

            expect(res.status).toBe(502);
            expect(res.data).toBeUndefined();
            expect(res.error).toMatch(/Invalid response shape/);
        });

        it('returns a 502 typed error when files is not an array', async () => {
            mockRequest.mockResolvedValueOnce({ status: 200, data: { files: 'not-an-array' } });

            const res = await listFiles(auth);

            expect(res.status).toBe(502);
            expect(res.error).toMatch(/Invalid response shape/);
        });
    });

    describe('deleteFile', () => {
        it('returns the message on a well-formed response', async () => {
            mockRequest.mockResolvedValueOnce({ status: 200, data: { message: 'File deleted' } });

            const res = await deleteFile(auth, 'note.md');

            expect(res.status).toBe(200);
            expect(res.data?.message).toBe('File deleted');
        });

        it('returns a 502 typed error when message is missing', async () => {
            mockRequest.mockResolvedValueOnce({ status: 200, data: { ok: true } });

            const res = await deleteFile(auth, 'note.md');

            expect(res.status).toBe(502);
            expect(res.data).toBeUndefined();
            expect(res.error).toMatch(/Invalid response shape/);
        });
    });
});
