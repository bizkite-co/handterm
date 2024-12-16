import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { setupCanvasMock , CanvasMock } from '../../test-utils/canvasMock';
import Game from '../Game';

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

describe('Game Component', () => {
  // Explicitly type canvasMock and use type assertion
  let canvasMock: CanvasMock;

  beforeEach(() => {
    // Setup canvas mock before each test using the centralized utility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    canvasMock = setupCanvasMock() as any;
  });

  afterEach(() => {
    // Clean up canvas mock after each test
    canvasMock.restoreOriginalGetContext();
    vi.restoreAllMocks();
  });

  const defaultProps = {
    canvasHeight: 600,
    canvasWidth: 800
  };

  it('renders without canvas context errors', () => {
    render(<Game {...defaultProps} />);

    expect(screen.getByRole('presentation')).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((canvasMock as any).mockGetContext).toHaveBeenCalledWith('2d');
  });

  it('initializes canvas with correct dimensions', () => {
    render(<Game {...defaultProps} />);

    const canvas = screen.getByRole('presentation');
    expect(canvas).toBeTruthy();
    expect(canvas).toHaveAttribute('width', '800');
    expect(canvas).toHaveAttribute('height', '600');
  });
});
