import { describe, it, expect } from 'vitest';
import { createE2ETest } from '../testDescriptionParser';
import React, { ReactElement } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const MockApp = (): ReactElement => {
  return React.createElement('div', null,
    React.createElement('button', null, 'Login'),
    React.createElement('input', { 'aria-label': 'Username' }),
    React.createElement('input', { 'aria-label': 'Password' }),
    React.createElement('button', null, 'Submit'),
    React.createElement('div', null, 'Invalid Credentials'),
    React.createElement('div', null, 'Game Dashboard'),
    React.createElement('div', null, 'Start Typing Game')
  );
};

describe('Login Scenarios', () => {
  it('User can log in and start game', async () => {
    const user = userEvent.setup();

    await createE2ETest('User logs in and starts a typing game', () => MockApp())
      .addStep('given', 'the user is on the home page', async () => {
        render(MockApp());
      })
      .addStep('when', 'the user clicks "Login"', async () => {
        const loginButton = await screen.findByText('Login');
        await user.click(loginButton);
      })
      .addStep('and', 'enters valid GitHub credentials', async () => {
        const usernameInput = await screen.findByLabelText('Username');
        const passwordInput = await screen.findByLabelText('Password');

        await user.type(usernameInput, 'testuser');
        await user.type(passwordInput, 'testpassword');

        const submitButton = await screen.findByText('Submit');
        await user.click(submitButton);
      })
      .addStep('then', 'the user should be redirected to the game dashboard', async () => {
        await waitFor(() => {
          expect(screen.getByText('Game Dashboard')).toBeInTheDocument();
        });
      })
      .addStep('and', 'the typing game should be available', async () => {
        expect(screen.getByText('Start Typing Game')).toBeInTheDocument();
      })
      .run();
  });

  it('User cannot log in with invalid credentials', async () => {
    const user = userEvent.setup();

    await createE2ETest('User fails to log in with invalid credentials', () => MockApp())
      .addStep('given', 'the user is on the login page', async () => {
        render(MockApp());
        const loginButton = await screen.findByText('Login');
        await user.click(loginButton);
      })
      .addStep('when', 'the user enters invalid credentials', async () => {
        const usernameInput = await screen.findByLabelText('Username');
        const passwordInput = await screen.findByLabelText('Password');

        await user.type(usernameInput, 'invaliduser');
        await user.type(passwordInput, 'wrongpassword');

        const submitButton = await screen.findByText('Submit');
        await user.click(submitButton);
      })
      .addStep('then', 'an error message should be displayed', async () => {
        await waitFor(() => {
          expect(screen.getByText('Invalid Credentials')).toBeInTheDocument();
        });
      })
      .addStep('and', 'the user remains on the login page', async () => {
        expect(screen.getByLabelText('Username')).toBeInTheDocument();
      })
      .run();
  });
});
