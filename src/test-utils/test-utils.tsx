import { ReactElement, useRef } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryProvider } from '../providers/QueryProvider';
import { BrowserRouter } from 'react-router-dom';
import { CommandProvider } from '../contexts/CommandProvider';
import { IHandTermWrapperMethods } from '../components/HandTermWrapper';
import { vi } from 'vitest';

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
  const handTermRef = useRef<IHandTermWrapperMethods>({
    writeOutput: vi.fn(),
    prompt: vi.fn(),
    saveCommandResponseHistory: vi.fn().mockReturnValue(''),
    focusTerminal: vi.fn(),
    handleCharacter: vi.fn(),
    refreshComponent: vi.fn(),
    setHeroSummersaultAction: vi.fn(),
    setEditMode: vi.fn(),
    handleEditSave: vi.fn(),
  });

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
) => render(ui, { wrapper: AllTheProviders, ...options });

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };
