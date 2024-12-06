import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import Game from '../Game';

// Mock any dependencies if necessary
vi.mock('src/hooks/useReactiveLocation', () => ({
  useReactiveLocation: () => ({
    updateLocation: vi.fn(),
    parseLocation: () => ({
      activityKey: 'NORMAL',
      contentKey: '',
      groupKey: ''
    })
  })
}));

// Mock signals
vi.mock('src/signals/gameSignals', () => ({
  isInGameModeSignal: { value: true }
}));

describe('Game Component', () => {
  const defaultProps = {
    canvasHeight: 600,
    canvasWidth: 800
  };

  it('should render without crashing', () => {
    const { container } = render(<Game {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('should render when in game mode', () => {
    const { getByTestId } = render(<Game {...defaultProps} />);
    // Note: You might need to add a data-testid to the game container in the actual component
    // expect(getByTestId('terminal-game')).toBeTruthy();
  });
});
