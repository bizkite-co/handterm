
import { renderHook, act } from '@testing-library/react-hooks';
import { useActivityMediator } from '../../hooks/useActivityMediator';
import { setCompletedGamePhrase } from '../../signals/gameSignals';

// Mock the gameSignals module
jest.mock('../../signals/gameSignals', () => ({
  setCompletedGamePhrase: jest.fn(),
}));

describe('useActivityMediator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('checkGameProgress marks game phrase as completed', () => {
    const { result } = renderHook(() => useActivityMediator({}));

    const gamePhrase = { key: 'testPhrase', value: 'Test Phrase', tutorialGroup: 'group1' };

    act(() => {
      result.current.checkGameProgress(gamePhrase);
    });

    expect(setCompletedGamePhrase).toHaveBeenCalledWith('testPhrase');
  });
});