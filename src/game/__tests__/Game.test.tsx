import { render } from '@testing-library/react';
import Game from '../Game';
import * as matchers from '@testing-library/jest-dom/matchers'
import React from 'react';

expect.extend(matchers)
describe('Game', () => {
  const defaultProps = {
    canvasHeight: 500,
    canvasWidth: 800,
    isInGameMode: true,
    heroActionType: 'Idle' as const,
    zombie4ActionType: 'Walk' as const,
    zombie4StartPosition: { leftX: 0, topY: 0 },
    onSetHeroAction: () => {},
    onSetZombie4Action: () => {},
    tutorialGroupPhrases: []
  };

  it('should render when isInGameMode is true', () => {
    const { container } = render(<Game {...defaultProps} />);
    expect(container.querySelector('#terminal-game')).toBeDefined();
  });

  it('should not render when isInGameMode is false', () => {
    const { container } = render(<Game {...defaultProps} isInGameMode={false} />);
    expect(container.querySelector('#terminal-game')).toBe(null);
  });
});
