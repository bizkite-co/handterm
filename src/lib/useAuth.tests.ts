import { renderHook, act } from '@testing-library/react-hooks';
import {useAuth} from './useAuth'; // Adjust the import path according to your project structure
import test from 'node:test';

test('should allow a user to log in', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useAuth());

  act(() => {
    console.log(result.current);
    // result.current.login({ username: 'test', password: 'password' });
  });

  await waitForNextUpdate();

  // expect(result.current.isLoggedIn).toBe(true);
});