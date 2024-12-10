import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryProvider } from '../providers/QueryProvider';
import { BrowserRouter } from 'react-router-dom';
import { CommandProvider } from '../contexts/CommandProvider';
import { vi } from 'vitest';
import { createLogger } from 'src/utils/Logger';

const logger = createLogger({ prefix: 'test-utils' });

const mockAuth = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  error: null,
  login: vi.fn(),
  logout: vi.fn(),
  signup: vi.fn(),
  refreshToken: vi.fn(),
  getAccessToken: vi.fn(),
  verify: vi.fn(),
  validateAndRefreshToken: vi.fn(),
  isLoggedIn: false,
  isError: false,
  isPending: false
};

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  logger.debug('Setting up test providers');

  const handTermRef = {
    current: {
      writeOutput: vi.fn((output: string) => {
        logger.debug('Mock writeOutput:', output);
      }),
      prompt: vi.fn(() => {
        logger.debug('Mock prompt called');
      }),
      saveCommandResponseHistory: vi.fn().mockReturnValue(''),
      focusTerminal: vi.fn(),
      handleCharacter: vi.fn((char: string) => {
        logger.debug('Mock handleCharacter:', char);
      }),
      refreshComponent: vi.fn(),
      setHeroSummersaultAction: vi.fn(),
      setEditMode: vi.fn(),
      handleEditSave: vi.fn(),
    }
  };

  return (
    <BrowserRouter>
      <QueryProvider>
        <CommandProvider handTermRef={handTermRef} auth={mockAuth}>
          {children}
        </CommandProvider>
      </QueryProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  logger.debug('Rendering component with test providers');
  return render(ui, { wrapper: AllTheProviders, ...options });
};

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };
