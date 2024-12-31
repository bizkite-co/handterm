import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { setupCanvasMock, type CanvasMock } from '../../test-utils/canvasMock';
import { Game } from '../Game';

// Mock dependencies
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

vi.mock('src/signals/gameSignals', () => ({
  isInGameModeSignal: { value: true }
}));

/**
 * Test suite for the Game component
 */
describe('Game Component', () => {
  let canvasMock: CanvasMock;

  /**
   * Setup canvas mock before each test
   */
  beforeEach(() => {
    canvasMock = setupCanvasMock();
  });

  /**
   * Clean up canvas mock after each test
   */
  afterEach(() => {
    canvasMock.restoreOriginalGetContext();
    vi.restoreAllMocks();
  });

  const defaultProps: { canvasHeight: number; canvasWidth: number } = {
    canvasHeight: 600,
    canvasWidth: 800
  };

  /**
   * Tests that the Game component renders without canvas context errors
   */
  it('renders without canvas context errors', () => {
    render(<Game {...defaultProps} />);

    expect(screen.getByTestId('game-canvas')).toBeTruthy();
    expect(canvasMock.mockGetContext).toHaveBeenCalledWith('2d');
  });

  /**
   * Tests that the Game component initializes canvas with correct dimensions
   */
  it('initializes canvas with correct dimensions', () => {
    render(<Game {...defaultProps} />);

    const canvas = screen.getByTestId('game-canvas');
    expect(canvas).toBeTruthy();
    expect(canvas).toHaveAttribute('width', '800');
    expect(canvas).toHaveAttribute('height', '600');
  });
});
