import { loadFeature } from "@amiceli/vitest-cucumber";
import { render, RenderResult, fireEvent } from '@testing-library/react';
import { expect, test } from "vitest";
import React, { ReactElement } from 'react';
import App from '../../App';
import { Scenario, Step } from "@amiceli/vitest-cucumber/dist/src/parser/models";


const feature = await loadFeature('src/e2e/scenarios/tutorialProgression.feature');

const scenario = feature.getScenarioByName('Initial Tutorial Steps') as Scenario;
if (!scenario) {
  throw new Error('Scenario not found');
}

test('Initial Tutorial Steps', () => {
  let renderResult: RenderResult;

  const AppWrapper = (): ReactElement => {
    return React.createElement(
      React.StrictMode,
      null,
      React.createElement(App, null)
    );
  };

  // Setup
  renderResult = render(AppWrapper());

  // Steps
  const steps = scenario.steps as Readonly<Step[]>;
  for (const step of steps) {
    switch (step.title) {
      case 'the user is in the tutorial mode':
        // Additional setup for tutorial mode if needed
        break;
      case 'the user types "Enter"':
        const enterInput = renderResult.getByTestId('terminal-input');
        fireEvent.change(enterInput, { target: { value: 'Enter' } });
        fireEvent.keyDown(enterInput, { key: 'Enter', code: 'Enter' });
        break;
      case 'the user types "fdsa"':
        const fdsaInput = renderResult.getByTestId('terminal-input');
        fireEvent.change(fdsaInput, { target: { value: 'fdsa' } });
        fireEvent.keyDown(fdsaInput, { key: 'Enter', code: 'Enter' });
        break;
      case 'the user types "jkl;"':
        const jklInput = renderResult.getByTestId('terminal-input');
        fireEvent.change(jklInput, { target: { value: 'jkl;' } });
        fireEvent.keyDown(jklInput, { key: 'Enter', code: 'Enter' });
        break;
      case 'the tutorial should progress successfully':
        const tutorialProgressElement = renderResult.getByTestId('tutorial-progress');
        expect(tutorialProgressElement).toBeTruthy();
        break;
    }
  }
});
