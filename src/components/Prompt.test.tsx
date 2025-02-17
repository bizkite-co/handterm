import { render } from '@testing-library/react';
import { Prompt } from './Prompt';

describe('Prompt', () => {
  const defaultProps = {
    username: 'guest',
    domain: 'handterm.com',
    githubUsername: null,
    timestamp: '12:00:00'
  };

  test('renders single prompt', () => {
    const { container } = render(<Prompt {...defaultProps} />);
    const promptElements = container.querySelectorAll('.prompt');
    expect(promptElements.length).toBe(1);
  });

  test('maintains single prompt on prop updates', () => {
    const { container, rerender } = render(<Prompt {...defaultProps} />);
    
    // Update props
    rerender(<Prompt {...defaultProps} timestamp="12:00:01" />);
    
    const promptElements = container.querySelectorAll('.prompt');
    expect(promptElements.length).toBe(1);
  });
});