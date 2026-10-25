import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { setupCanvasMock, type CanvasMock } from '../../test-utils/canvasMock';
import { Game, type IGameHandle } from '../Game';

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
  isInGameModeSignal: { value: true },
  gamePhraseSignal: { value: null },
  gameLevelSignal: { value: null },
  setGameLevel: vi.fn()
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

  it('does not render fail count badge initially', () => {
    render(<Game {...defaultProps} />);
    expect(screen.queryByTestId('game-fail-count')).toBeNull();
  });

  it('respawns hero, triggers onHeroDeath, and increments failure badge on death', () => {
    vi.useFakeTimers();
    const onHeroDeath = vi.fn();
    const gameRef = { current: null as IGameHandle | null };
    render(<Game {...defaultProps} ref={gameRef} onHeroDeath={onHeroDeath} />);

    expect(screen.queryByTestId('game-fail-count')).toBeNull();

    // 3 hits to kill hero
    act(() => {
      gameRef.current?.handleHeroHit();
      gameRef.current?.handleHeroHit();
      gameRef.current?.handleHeroHit();
    });

    // Fail badge should now be visible with 1 failure
    expect(screen.getByTestId('game-fail-count')).toBeInTheDocument();
    expect(screen.getByTestId('game-fail-count')).toHaveTextContent('💀');
    expect(screen.getByTestId('game-fail-count')).toHaveTextContent('1');

    // Before respawn timeout, onHeroDeath not yet called
    expect(onHeroDeath).not.toHaveBeenCalled();

    // Advance timer through heroRespawnMs (1500ms)
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(onHeroDeath).toHaveBeenCalledTimes(1);

    // Another death increments the failure counter to 2
    act(() => {
      gameRef.current?.handleHeroHit();
      gameRef.current?.handleHeroHit();
      gameRef.current?.handleHeroHit();
    });
    expect(screen.getByTestId('game-fail-count')).toHaveTextContent('2');

    // levelUp resets the failure counter
    act(() => {
      gameRef.current?.levelUp(2);
    });
    expect(screen.queryByTestId('game-fail-count')).toBeNull();

    vi.useRealTimers();
  });

  it('clears failure count when resetGame is called', () => {
    const gameRef = { current: null as IGameHandle | null };
    render(<Game {...defaultProps} ref={gameRef} />);

    act(() => {
      gameRef.current?.handleHeroHit();
      gameRef.current?.handleHeroHit();
      gameRef.current?.handleHeroHit();
    });
    expect(screen.getByTestId('game-fail-count')).toBeInTheDocument();

    act(() => {
      gameRef.current?.resetGame();
    });
    expect(screen.queryByTestId('game-fail-count')).toBeNull();
  });
});
