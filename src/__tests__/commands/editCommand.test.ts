import { describe, it, expect, vi, beforeEach } from 'vitest';
import EditCommand from '../../commands/editCommand';
import type { ICommandContext } from '../../contexts/CommandContext';
import type { ParsedCommand } from '@handterm/types';
import { ActivityType } from '@handterm/types';
import * as awsApiClient from '../../utils/awsApiClient';

// Mock the AWS API client
vi.mock('../../utils/awsApiClient', () => ({
    getFile: vi.fn()
}));

// Mock window.setActivity
const mockSetActivity = vi.fn();
(window as any).setActivity = mockSetActivity;

describe('Edit Command', () => {
    let mockContext: ICommandContext;

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup mock context
        mockContext = {
            executeCommand: vi.fn(),
            commandHistory: [],
            addToCommandHistory: vi.fn(),
            output: [],
            appendToOutput: vi.fn(),
            handTermRef: { current: null },
            auth: {
                validateAndRefreshToken: vi.fn(),
                login: vi.fn(),
                signup: vi.fn(),
                verify: vi.fn(),
                refreshToken: vi.fn(),
                isLoggedIn: true,
                isLoading: false,
                isError: false,
                error: null,
                isPending: false
            },
            updateLocation: vi.fn()
        };
    });

    it('should handle edit command with default filename', async () => {
        const mockParsedCommand: ParsedCommand = {
            command: 'edit',
            args: [],
            switches: {}
        };

        // Mock successful file retrieval
        (awsApiClient.getFile as jest.Mock).mockResolvedValueOnce({
            status: 200,
            data: {
                content: '# Test Content',
                encoding: 'utf-8'
            }
        });

        const result = await EditCommand.execute(mockContext, mockParsedCommand);

        expect(awsApiClient.getFile).toHaveBeenCalledWith(mockContext.auth, '_index.md');
        expect(result.status).toBe(200);
        expect(result.message).toBe('Editing file content');
        expect(mockSetActivity).toHaveBeenCalledWith(ActivityType.EDIT);
        expect(mockContext.updateLocation).toHaveBeenCalledWith({
            activityKey: ActivityType.EDIT,
            contentKey: '_index.md',
            groupKey: null
        });
    });

    it('should handle edit command with specific filename', async () => {
        const mockParsedCommand: ParsedCommand = {
            command: 'edit',
            args: ['test.md'],
            switches: {}
        };

        // Mock successful file retrieval
        (awsApiClient.getFile as jest.Mock).mockResolvedValueOnce({
            status: 200,
            data: {
                content: '# Test Content',
                encoding: 'utf-8'
            }
        });

        const result = await EditCommand.execute(mockContext, mockParsedCommand);

        expect(awsApiClient.getFile).toHaveBeenCalledWith(mockContext.auth, 'test.md');
        expect(result.status).toBe(200);
        expect(result.message).toBe('Editing file content');
        expect(mockSetActivity).toHaveBeenCalledWith(ActivityType.EDIT);
        expect(mockContext.updateLocation).toHaveBeenCalledWith({
            activityKey: ActivityType.EDIT,
            contentKey: 'test.md',
            groupKey: null
        });
    });

    it('should handle file not found', async () => {
        const mockParsedCommand: ParsedCommand = {
            command: 'edit',
            args: [],
            switches: {}
        };

        // Mock file not found response
        (awsApiClient.getFile as jest.Mock).mockResolvedValueOnce({
            status: 404,
            error: 'File not found'
        });

        const result = await EditCommand.execute(mockContext, mockParsedCommand);

        expect(result.status).toBe(404);
        expect(result.message).toBe('File not found');
        expect(mockSetActivity).not.toHaveBeenCalled();
        expect(mockContext.updateLocation).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
        const mockParsedCommand: ParsedCommand = {
            command: 'edit',
            args: [],
            switches: {}
        };

        // Mock API error
        (awsApiClient.getFile as jest.Mock).mockRejectedValueOnce(new Error('API error'));

        const result = await EditCommand.execute(mockContext, mockParsedCommand);

        expect(result.status).toBe(500);
        expect(result.message).toBe('API error');
        expect(mockSetActivity).not.toHaveBeenCalled();
        expect(mockContext.updateLocation).not.toHaveBeenCalled();
    });

    it('should handle invalid command', async () => {
        const mockParsedCommand: ParsedCommand = {
            command: 'editt',
            args: [],
            switches: {}
        };

        const result = await EditCommand.execute(mockContext, mockParsedCommand);

        expect(result.status).toBe(404);
        expect(result.message).toBe('Edit command not recognized');
        expect(mockSetActivity).not.toHaveBeenCalled();
        expect(mockContext.updateLocation).not.toHaveBeenCalled();
    });
});