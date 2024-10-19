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

// Mock the useReactiveLocation hook
jest.mock('../hooks/useReactiveLocation', () => ({
  useReactiveLocation: () => ({
    reactiveLocation: {
      activity: 'normal',
      phraseKey: '',
      groupKey: '',
      getPath: jest.fn(),
    },
  }),
}));

describe('useActivityMediator', () => {
  it('should update reactiveLocation when activity changes', () => {
    const mockNavigate = jest.fn();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/']}>
        {children}
      </MemoryRouter>
    );

    const { result } = renderHook(() => useActivityMediator({}), { wrapper });

    act(() => {
      result.current.handleCommandExecuted({ command: 'play', args: [], switches: {} });
    });

    expect(result.current.isInGameMode).toBe(true);

    act(() => {
      result.current.handleCommandExecuted({ command: 'tut', args: [], switches: {} });
    });

    expect(result.current.isInTutorial).toBe(true);

    act(() => {
      result.current.handleCommandExecuted({ command: 'edit', args: ['testFile'], switches: {} });
    });

    expect(result.current.isInEdit).toBe(true);
  });
});
