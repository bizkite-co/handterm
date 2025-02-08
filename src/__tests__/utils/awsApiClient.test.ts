import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFile } from '../../utils/awsApiClient';
import type { IAuthProps } from '../../types/HandTerm';

describe('AWS API Client', () => {
    let mockAuth: IAuthProps;
    let mockRequest: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();

        // Create mock request function
        mockRequest = vi.fn();

        // Mock axios
        vi.mock('axios', () => ({
            default: {
                create: () => ({
                    request: mockRequest,
                    defaults: {
                        headers: {
                            common: {}
                        }
                    }
                })
            }
        }));

        // Create mock auth object with successful token validation
        mockAuth = {
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
        };
    });

    describe('getFile', () => {
        it('should validate auth token before making request', async () => {
            // Setup successful response
            mockRequest.mockResolvedValueOnce({
                status: 200,
                data: { content: 'test' }
            });

            await getFile(mockAuth, 'test.md');

            expect(mockAuth.validateAndRefreshToken).toHaveBeenCalled();
        });
    });
});
