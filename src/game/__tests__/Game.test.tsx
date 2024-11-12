// Explicitly import Jest globals
import {
  describe,
  it,
  expect,
  jest
} from '@jest/globals';

// Import testing library for additional matchers
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import React from 'react';

// Import the component to test
import Game, { IGameProps } from '../Game';

// Mock any dependencies
jest.mock('../../hooks/useActivityMediator', () => ({
  useActivityMediator: () => ({
    isInGameMode: true,
    isInTutorial: false,
    heroAction: 'Idle',
    zombie4Action: 'Walk'
  })
}));

// Mock canvas context and other dependencies
jest.mock('canvas-confetti', () => jest.fn());

// Mock signals
jest.mock('src/signals/commandLineSignals', () => {
  const mockModule = {
    commandLineSignal: { value: '' },
    setPromptInfo: jest.fn()
  };
  return mockModule;
});

jest.mock('src/signals/gameSignals', () => ({
  isInGameModeSignal: { value: true }
}));

const mockGameProps: IGameProps = {
  canvasHeight: 600,
  canvasWidth: 800
};

describe('Game Component', () => {
  it('renders without crashing', () => {
    const { container } = render(<Game {...mockGameProps} />);
    expect(container.firstChild).toBeTruthy();
  });
});
