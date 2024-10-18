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
      result.current.setActivityNav(ActivityType.GAME, 'testPhrase', 'testGroup');
    });

    expect(mockNavigate).toHaveBeenCalledWith('/game/testPhrase?group=testGroup');

    act(() => {
      result.current.setActivityNav(ActivityType.TUTORIAL, 'tutorialPhrase', 'tutorialGroup');
    });

    expect(mockNavigate).toHaveBeenCalledWith('/tutorial/tutorialPhrase?group=tutorialGroup');
  });
});
