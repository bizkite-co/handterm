import { render } from '@testing-library/react';
import HandTerm from '../HandTerm';
import { useActivityMediator } from '../../hooks/useActivityMediator';
import { jest } from '@jest/globals';

jest.mock('../../hooks/useActivityMediator', () => ({
  __esModule: true,
  useActivityMediator: jest.fn(),
}));

describe('HandTerm', () => {
  beforeEach(() => {
    (useActivityMediator as jest.Mock).mockReturnValue({
      isInGameMode: false,
      handleCommand: jest.fn(),
      setNextAchievement: jest.fn(),
      achievement: { phrase: [], prompt: '', unlocked: false },
    });
  });

  it('should handle "play" command correctly', () => {
    const mockHandleCommand = jest.fn().mockReturnValue(true);
    (useActivityMediator as jest.Mock).mockReturnValue({
      isInGameMode: true,
      handleCommand: mockHandleCommand,
      setNextAchievement: jest.fn(),
      achievement: { phrase: [], prompt: '', unlocked: false },
    });

    const { getByTestId } = render(<HandTerm auth={{} as any} terminalWidth={800} />);
    const input = getByTestId('xterm-adapter');

    // Simulate input and Enter key press
    (input as HTMLInputElement).value = 'play';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter' }));

    expect(mockHandleCommand).toHaveBeenCalledWith('play');
  });

  it('should render NextCharsDisplay when in game mode', () => {
    (useActivityMediator as jest.Mock).mockReturnValue({
      isInGameMode: true,
      handleCommand: jest.fn(),
      setNextAchievement: jest.fn(),
      achievement: { phrase: [], prompt: '', unlocked: false },
    });

    const { getByTestId } = render(<HandTerm auth={{} as any} terminalWidth={800} />);

    expect(getByTestId('next-chars-display')).toBeTruthy();
  });
});