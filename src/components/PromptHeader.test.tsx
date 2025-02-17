import { render } from '@testing-library/react';
import { PromptHeader } from './PromptHeader';
import { TerminalCssClasses } from '@handterm/types';

describe('Prompt', () => {
  const defaultProps = {
    username: 'guest',
    domain: 'handterm.com',
    githubUsername: null,
    timestamp: '12:00:00'
  };

  test('renders single prompt', () => {
    const { container } = render(<PromptHeader {...defaultProps} />);
    const promptElements = container.querySelectorAll(TerminalCssClasses.promptHeader);
    expect(promptElements.length).toBe(1);
  });

  test('maintains single prompt on prop updates', () => {
    const { container, rerender } = render(<PromptHeader {...defaultProps} />);

    // Update props
    rerender(<PromptHeader {...defaultProps} timestamp="12:00:01" />);

    const promptElements = container.querySelectorAll(TerminalCssClasses.promptHeader);
    expect(promptElements.length).toBe(1);
  });
});