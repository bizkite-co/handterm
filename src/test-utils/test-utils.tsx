import { render, type RenderOptions } from '@testing-library/react';
import { type ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { createLogger } from 'src/utils/Logger';

import { CommandProvider } from '../contexts/CommandProvider';
import { QueryProvider } from '../providers/QueryProvider';

const logger = createLogger({ prefix: 'test-utils' });

import type { IAuthProps } from '../hooks/useAuth';
import type { MyResponse } from '../types/Types';
import type { IHandTermWrapperMethods } from '../components/HandTermWrapper';

interface MockAuth extends IAuthProps {
  isAuthenticated: boolean;
  user: null;
  error: null;
}

interface HandTermRef {
  current: IHandTermWrapperMethods;
}

const mockAuth: MockAuth = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  error: null,
  login: vi.fn().mockResolvedValue({} as MyResponse<unknown>),
  signup: vi.fn().mockResolvedValue({} as MyResponse<unknown>),
  refreshToken: vi.fn().mockResolvedValue({} as MyResponse<unknown>),
  verify: vi.fn().mockResolvedValue({} as MyResponse<unknown>),
  validateAndRefreshToken: vi.fn().mockResolvedValue({} as MyResponse<unknown>),
  isLoggedIn: false,
  isError: false,
  isPending: false
};

const AllTheProviders = ({ children }: { children: React.ReactNode }): JSX.Element => {
  logger.debug('Setting up test providers');

  const handTermRef: HandTermRef = {
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
): ReturnType<typeof render> => {
  logger.debug('Rendering component with test providers');
  return render(ui, { wrapper: AllTheProviders, ...options });
};

export { customRender as render };
