import React, { forwardRef } from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { setupCanvasMock, type CanvasMock } from '../../test-utils/canvasMock';
import { HeroAnimations } from '../characters/hero/HeroAnimations';
import { HeroActions } from '../types/ActionTypes';
import type { IGameHandle } from '../Game';

const heroPropsList: any[] = [];

vi.mock('../Hero', () => ({
  Hero: forwardRef((props: any, ref: any) => {
    heroPropsList.push({ ...props });
    if (ref) {
      ref.current = {
        draw: vi.fn(),
        hitbox: props.hitbox ?? { left: 29, width: 43 }
      };
    }
    return null;
  })
}));

vi.mock('src/signals/gameSignals', () => {
  const { signal } = require('@preact/signals-react');
  return {
    isInGameModeSignal: signal(true),
    gamePhraseSignal: signal({ value: 'hello world' }),
    gameLevelSignal: signal(1),
    setGameLevel: vi.fn()
  };
});

describe('Hero Combat and Sprite Configuration', () => {
  let canvasMock: CanvasMock;

  beforeEach(() => {
    heroPropsList.length = 0;
    canvasMock = setupCanvasMock();
  });

  afterEach(() => {
    canvasMock.restoreOriginalGetContext();
    vi.restoreAllMocks();
  });

  const defaultProps = {
    canvasHeight: 600,
    canvasWidth: 800
  };

  it('uses Adventurer spritesheet (HeroAnimations) for all hero actions', () => {
    expect(HeroActions.Run.animation).toBe(HeroAnimations.Run);
    expect(HeroActions.Idle.animation).toBe(HeroAnimations.Idle);
    expect(HeroActions.Attack.animation).toBe(HeroAnimations.Attack);
    expect(HeroActions.Hurt.animation).toBe(HeroAnimations.Hurt);
    expect(HeroActions.Death.animation).toBe(HeroAnimations.Death);
    expect(HeroActions.Run.animation.imagePath).toContain('Adventurer');
  });

  it('renders Hero with scale 1.95 and Adventurer hitbox', async () => {
    const { Game } = await import('../Game');
    render(<Game {...defaultProps} />);

    expect(heroPropsList.length).toBeGreaterThan(0);
    const initialProps = heroPropsList[0];
    expect(initialProps.scale).toBe(1.95);
    expect(initialProps.hitbox).toEqual({ left: 29, width: 43 });
  });

  it('sets hero to Run facing right when user types, even after being attacked/hurt', async () => {
    const { commandLineSignal } = await import('../../signals/commandLineSignals');
    const { Game } = await import('../Game');
    const gameRef = { current: null as IGameHandle | null };

    commandLineSignal.value = '';
    render(<Game {...defaultProps} ref={gameRef} />);

    // Simulate zombie hitting the hero (hero is attacked / hurt)
    act(() => {
      gameRef.current?.handleHeroHit();
    });

    const lastPropsAfterHit = heroPropsList[heroPropsList.length - 1];
    expect(lastPropsAfterHit.currentActionType).toBe('Hurt');

    // Player types the first correct character 'h'
    act(() => {
      commandLineSignal.value = 'h';
    });

    const lastPropsAfterTyping = heroPropsList[heroPropsList.length - 1];
    expect(lastPropsAfterTyping.currentActionType).toBe('Run');
    expect(lastPropsAfterTyping.flip).toBe(false);

    // Player types the second correct character 'he'
    act(() => {
      commandLineSignal.value = 'he';
    });

    const lastPropsAfterSecondChar = heroPropsList[heroPropsList.length - 1];
    expect(lastPropsAfterSecondChar.currentActionType).toBe('Run');
    expect(lastPropsAfterSecondChar.flip).toBe(false);
  });
});
