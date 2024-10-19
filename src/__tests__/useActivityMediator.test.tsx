import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { useActivityMediator } from '../hooks/useActivityMediator';
import { ActivityType } from '../types/Types';

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('useActivityMediator', () => {
  it('should navigate to the correct URL when activity changes', () => {
    const mockNavigate = jest.fn();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/']}>
        {children}
      </MemoryRouter>
    );

    const { result } = renderHook(() => useActivityMediator({}), { wrapper });

    act(() => {
      result.current.setActivityNav({ activity: ActivityType.GAME, phraseKey: 'testPhrase', groupKey: 'testGroup' });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/game/testPhrase?group=testGroup');

    act(() => {
      result.current.setActivityNav({ activity: ActivityType.TUTORIAL, phraseKey: 'tutorialPhrase', groupKey: 'tutorialGroup' });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/tutorial/tutorialPhrase?group=tutorialGroup');

    // Test updating only phraseKey
    act(() => {
      result.current.setActivityNav({ phraseKey: 'newPhrase' });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/tutorial/newPhrase?group=tutorialGroup');

    // Test updating only groupKey
    act(() => {
      result.current.setActivityNav({ groupKey: 'newGroup' });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/tutorial/newPhrase?group=newGroup');
  });
});
