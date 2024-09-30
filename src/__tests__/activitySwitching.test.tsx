/// <reference types="@testing-library/jest-dom" />
import { render, act, waitFor } from '@testing-library/react';
import { IActivityMediatorProps, useActivityMediator } from '../hooks/useActivityMediator';
import { getNextTutorial } from '../utils/tutorialUtils';
import GamePhrases, { GamePhrase } from '../utils/GamePhrases';
import { jest, expect, describe, it, beforeEach } from '@jest/globals';
import { Tutorial, ActivityType } from '../types/Types';
import React from 'react';

// Mock the modules
jest.mock('../utils/achievementUtils');
jest.mock('../utils/Phrases');

// Create mock implementations
const mockGetNextTutorial = jest.fn<() => Tutorial | null>();
const mockGetNthGamePhraseNotAchieved = jest.fn<() => GamePhrase>();

// Mock the getNextTutorial function
jest.mock('../utils/achievementUtils', () => ({
    getNextTutorial: jest.fn()
}));

// Mock the Phrases class
jest.spyOn(GamePhrases, 'getNthGamePhraseNotAchieved').mockImplementation(mockGetNthGamePhraseNotAchieved);

// Create a test component that uses the useActivityMediator hook                            
const TestComponent = () => {
    const activityMediatorProps:IActivityMediatorProps = {
        resetTutorial: function (): void {
            throw new Error('Function not implemented.');
        }
    }
    const activityMediator = useActivityMediator(activityMediatorProps);

    return (
        <div>
            <div data-testid="current-activity">{activityMediator.currentActivity}</div>
            <button onClick={() => activityMediator.checkTutorialProgress('test')}>
                Progress Tutorial
            </button>
        </div>
    );
};

describe('Activity Switching', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should start in NORMAL mode', () => {
        // TODO: Should start in NORMAL unless unlocked tutorials exist.
        mockGetNextTutorial.mockReturnValue({
            phrase: ['Test phrase'],
            prompt: 'Test prompt',
            unlocked: false
        });

        const { getByTestId } = render(<TestComponent />);
        expect(getByTestId('current-activity').textContent).toBe(ActivityType.NORMAL.toString());
    });

    it('should switch to GAME mode when tutorial is completed', async () => {
        // Set up a series of mock returns, ending with null                                     
        mockGetNextTutorial
            .mockReturnValueOnce({ phrase: ['First'], prompt: 'First', unlocked: false })
            .mockReturnValueOnce({ phrase: ['Second'], prompt: 'Second', unlocked: false })
            .mockReturnValueOnce(null);

        const { getByTestId, getByText } = render(<TestComponent />);

        // Initially, it should be in TUTORIAL mode                                              
        expect(getByTestId('current-activity').textContent).toBe(ActivityType.NORMAL.toString());

        // Progress through tutorials                                                            
        act(() => {
            getByText('Progress Tutorial').click();
        });
        act(() => {
            getByText('Progress Tutorial').click();
        });

        // After progressing through all tutorials, it should switch to GAME mode                
        await waitFor(() => {
            expect(getByTestId('current-activity').textContent).toBe(ActivityType.GAME.toString());
        });
    });

    it.skip('should switch back to TUTORIAL mode when game level is completed', () => {
        // TODO: Make this test an appropriate flip-back.
        mockGetNextTutorial.mockReturnValue({
            phrase: ['Next tutorial phrase'],
            prompt: 'Next prompt',
            unlocked: false
        });
        mockGetNthGamePhraseNotAchieved.mockReturnValue({
            key: 'test',
            value: 'Test phrase',
            tutorialGroup: 'fdsajkl;'
        });

        const { getByTestId, getByText } = render(<TestComponent />);

        act(() => {
            getByText('Progress Tutorial').click();
        });

        expect(getByTestId('current-activity').textContent).toBe(ActivityType.TUTORIAL.toString());
    });
});
