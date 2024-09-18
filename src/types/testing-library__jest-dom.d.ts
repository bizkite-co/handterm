declare module '@testing-library/jest-dom';
import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string | RegExp): R;
      // Add other custom matchers as needed
    }
  }
}
