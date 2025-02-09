import { describe, it, expect, vi } from 'vitest';
import EditCommand from '../../commands/editCommand';
import { ActivityType, StorageKeys, allTutorialKeys } from '@handterm/types';

describe('EditCommand Activity Switching', () => {
  it('should set activity to EDIT when file is found and tutorials are complete', async () => {
    // Mock getFile to return a successful response
    const mockGetFile = vi.fn().mockResolvedValue({ status: 200, data: { content: '# Test Content' } });
    vi.mock('../../utils/awsApiClient', () => ({
      getFile: mockGetFile,
    }));

    // Mock window.setActivity
    const mockSetActivity = vi.fn();
    window.setActivity = mockSetActivity;

    // Mock context and parsedCommand
    const mockContext = {
      auth: {},
      updateLocation: vi.fn(),
    };
    const mockParsedCommand = { command: 'edit', args: ['_index.md'] };

    // Set completed tutorials in localStorage
    localStorage.setItem(StorageKeys.completedTutorials, JSON.stringify(allTutorialKeys));

    // Execute the command
    const response = await EditCommand.execute(mockContext as any, mockParsedCommand as any);

    // Assertions
    expect(response.status).toBe(200);
    expect(mockSetActivity).toHaveBeenCalledWith(ActivityType.EDIT);
    expect(mockContext.updateLocation).toHaveBeenCalledWith({
      activityKey: ActivityType.EDIT,
      contentKey: '_index.md',
      groupKey: null,
    });
  });
});