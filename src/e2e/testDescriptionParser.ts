import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import type { ReactElement } from 'react';
import type { ComponentType } from 'react';

// Use a type assertion to handle dynamic import
type AppComponentType = ComponentType<{}>;

type TestStep = {
  type: 'given' | 'when' | 'then' | 'and';
  description: string;
  action?: (context: any) => Promise<void>;
};

class E2ETestRunner {
  private scenario: string;
  private steps: TestStep[];
  private context: any = {};
  private renderComponent: () => ReactElement;

  constructor(
    scenario: string,
    renderComponent?: () => ReactElement
  ) {
    this.scenario = scenario;
    this.steps = [];

    // If no renderComponent is provided, dynamically import App
    this.renderComponent = renderComponent || (() => {
      // Use dynamic import with type assertion
      const App = (require('../App') as { default: AppComponentType }).default;
      return React.createElement(App);
    });
  }

  addStep(type: TestStep['type'], description: string, action?: TestStep['action']): this {
    this.steps.push({ type, description, action });
    return this;
  }

  async run() {
    describe(this.scenario, () => {
      it('executes all steps', async () => {
        const { container } = render(this.renderComponent());

        for (const step of this.steps) {
          if (step.action) {
            await step.action(this.context);
          }
        }
      });
    });
  }
}

export function createE2ETest(
  scenario: string,
  renderComponent?: () => ReactElement
) {
  return new E2ETestRunner(scenario, renderComponent);
}

// Example usage in a test file
export async function loginAndStartGameTest() {
  await createE2ETest('User logs in and starts a typing game')
    .addStep('given', 'the user is on the home page')
    .addStep('when', 'the user clicks "Login"', async () => {
      const loginButton = await screen.findByText('Login');
      fireEvent.click(loginButton);
    })
    .addStep('and', 'enters valid GitHub credentials', async () => {
      const usernameInput = await screen.findByLabelText('Username');
      const passwordInput = await screen.findByLabelText('Password');

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'testpassword' } });

      const submitButton = await screen.findByText('Submit');
      fireEvent.click(submitButton);
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
}
