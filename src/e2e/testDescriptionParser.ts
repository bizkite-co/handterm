import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import type { ReactElement } from 'react';

type TestStepAction = () => Promise<void>;

type TestStep = {
  type: 'given' | 'when' | 'then' | 'and';
  description: string;
  action?: TestStepAction;
};

class E2ETestRunner {
  private scenario: string;
  private steps: TestStep[];
  private renderComponent: () => ReactElement;

  constructor(
    scenario: string,
    renderComponent?: () => ReactElement
  ) {
    this.scenario = scenario;
    this.steps = [];

    // Default to a minimal component if no render component is provided
    this.renderComponent = renderComponent || (() =>
      React.createElement('div', null, 'Test Component')
    );
  }

  addStep(type: TestStep['type'], description: string, action?: TestStepAction): this {
    this.steps.push({
      type,
      description,
      action: action || (async () => { })
    });
    return this;
  }

  async run(): Promise<void> {
    const renderResult = render(this.renderComponent());

    try {
      for (const step of this.steps) {
        if (step.action) {
          await step.action();
        }
      }
    } finally {
      renderResult.unmount();
    }
  }
}

export function createE2ETest(
  scenario: string,
  renderComponent?: () => ReactElement
) {
  return new E2ETestRunner(scenario, renderComponent);
}
