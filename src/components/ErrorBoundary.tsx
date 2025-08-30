import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { createLogger } from '../utils/Logger';

const logger = createLogger({ prefix: 'ErrorBoundary' });

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  // Add @override decorator back to state as per linter error
  public override state: State = {
    hasError: false
  };

  // Remove @override decorator from static method as per previous linter error
  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  // Keep @override decorator
  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error("Uncaught error caught by ErrorBoundary:", { error, errorInfo });
    // You could also log error messages to an error reporting service here
  }

  // Keep @override decorator
  public override render(): ReactNode {
    if (this.state.hasError) {
      // Improved error message
      return (
        <h1>Oops! Something went wrong.</h1>
        // You could add more details or a suggestion here, e.g.:
        // <p>Please try refreshing the page or contact support if the issue persists.</p>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;