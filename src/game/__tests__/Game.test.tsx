import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import Game from '../Game';
import { setupCanvasMock } from '../../test-utils/canvasMock';
import { CanvasMock } from '../../test-utils/canvasMock';

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
    const { container } = render(<Game {...defaultProps} />);

    expect(container).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((canvasMock as any).mockGetContext).toHaveBeenCalledWith('2d');
  });

  it('initializes canvas with correct dimensions', () => {
    const { container } = render(<Game {...defaultProps} />);

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
    expect(canvas?.getAttribute('width')).toBe('800');
    expect(canvas?.getAttribute('height')).toBe('600');
  });
});
