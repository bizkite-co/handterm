import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';

import * as appSignals from 'src/signals/appSignals';
import {
  type ICommandContext,
  type ICommandResponse,
  type ParsedCommand,
  type IAuthProps,
  type IHandTermWrapperMethods,
  type MyResponse,
  type AuthResponse
} from 'src/types/HandTerm';

import { LoginCommand } from '../LoginCommand';

// Type-safe mock of signals
type SignalMock = { value: boolean };
type SetSignalFn = (value: boolean) => void;

// Mock the signals
vi.mock('src/signals/appSignals', () => ({
  isInLoginProcessSignal: { value: false } as SignalMock,
  setIsInLoginProcess: vi.fn() as unknown as SetSignalFn,
  setTempUserName: vi.fn(),
  tempUserNameSignal: { value: '' } as { value: string }
}));

describe('LoginCommand', () => {
  // Create a more complete mock of ICommandContext
  const createMockContext = (overrides: Partial<ICommandContext> = {}): ICommandContext => ({
    executeCommand: vi.fn(),
    commandHistory: [],
    addToCommandHistory: vi.fn(),
    output: [],
    appendToOutput: vi.fn(),
    handTermRef: {
      current: {
        writeOutput: vi.fn(),
        prompt: vi.fn(),
        saveCommandResponseHistory: vi.fn(),
        focusTerminal: vi.fn(),
        handleCharacter: vi.fn(),
        refreshComponent: vi.fn(),
        setHeroSummersaultAction: vi.fn(),
        setEditMode: vi.fn(),
        handleEditSave: vi.fn()
      } as IHandTermWrapperMethods
    },
    auth: {
      login: vi.fn(),
      signup: vi.fn(),
      verify: vi.fn(),
      refreshToken: vi.fn(),
      validateAndRefreshToken: vi.fn(),
      isLoggedIn: false,
      isLoading: false,
      isError: false,
      error: null,
      isPending: false
    } as IAuthProps,
    updateLocation: vi.fn(),
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset signal values with type-safe approach
    (appSignals.isInLoginProcessSignal as SignalMock).value = false;
  });

  it('should initiate login process with username', async () => {
    const mockContext = createMockContext();
    const parsedCommand: ParsedCommand = {
      command: 'login',
      args: ['testuser'],
      switches: {}
    };

    const response: ICommandResponse = await LoginCommand.execute(mockContext, parsedCommand);

    expect(appSignals.setIsInLoginProcess).toHaveBeenCalledWith(true);
    expect(appSignals.setTempUserName).toHaveBeenCalledWith('testuser');
    expect(response.status).toBe(200);
    expect(response.message).toBe('Enter password:');
  });

  it('should complete login process successfully', async () => {
    const mockContext = createMockContext();
    // Type-safe mock of login method with full MyResponse structure
    const mockLogin = mockContext.auth.login as MockedFunction<typeof mockContext.auth.login>;
    const successResponse: MyResponse<AuthResponse> = {
      status: 200,
      data: {
        AccessToken: 'mock-access-token',
        RefreshToken: 'mock-refresh-token',
        IdToken: 'mock-id-token',
        ExpiresIn: '3600'
      },
      message: 'Login successful',
      error: []
    };
    mockLogin.mockResolvedValue(successResponse);

    // Simulate being in login process
    (appSignals.isInLoginProcessSignal as SignalMock).value = true;

    const parsedCommand: ParsedCommand = {
      command: 'login',
      args: ['testuser', 'password123'],
      switches: {}
    };

    const response: ICommandResponse = await LoginCommand.execute(mockContext, parsedCommand);

    expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
    expect(appSignals.setIsInLoginProcess).toHaveBeenCalledWith(false);
    expect(response.status).toBe(200);
    expect(response.message).toBe('Login successful!');
    expect(response.sensitive).toBe(true);
  });

  it('should handle login failure', async () => {
    const mockContext = createMockContext();
    // Type-safe mock of login method with error response
    const mockLogin = mockContext.auth.login as MockedFunction<typeof mockContext.auth.login>;
    const errorResponse: MyResponse<AuthResponse> = {
      status: 401,
      message: 'Login error: An unknown error occurred',
      error: ['Authentication failed'],
      data: undefined
    };
    mockLogin.mockRejectedValue(errorResponse);

    // Simulate being in login process
    (appSignals.isInLoginProcessSignal as SignalMock).value = true;

    const parsedCommand: ParsedCommand = {
      command: 'login',
      args: ['testuser', 'wrongpassword'],
      switches: {}
    };

    const response: ICommandResponse = await LoginCommand.execute(mockContext, parsedCommand);

    expect(mockLogin).toHaveBeenCalledWith('testuser', 'wrongpassword');
    expect(appSignals.setIsInLoginProcess).toHaveBeenCalledWith(false);
    expect(response.status).toBe(500);
    expect(response.message).toBe('Login error: An unknown error occurred');
    expect(response.sensitive).toBe(true);
  });

  it('should reject invalid command format', async () => {
    const mockContext = createMockContext();
    const parsedCommand: ParsedCommand = {
      command: 'login',
      args: [],
      switches: {}
    };

    const response: ICommandResponse = await LoginCommand.execute(mockContext, parsedCommand);

    expect(response.status).toBe(400);
    expect(response.message).toBe('Usage: login <username>');
  });
});
