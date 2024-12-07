import { describe, it, expect, vi } from 'vitest';
import { LoginCommand } from '../LoginCommand';
import {
  ICommandContext,
  ICommandResponse,
  ParsedCommand,
  IAuthProps,
  IHandTermWrapperMethods
} from 'src/types/HandTerm';
import * as appSignals from 'src/signals/appSignals';

// Mock the signals
vi.mock('src/signals/appSignals', () => ({
  isInLoginProcessSignal: { value: false },
  setIsInLoginProcess: vi.fn(),
  setTempUserName: vi.fn(),
  tempUserNameSignal: { value: '' }
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
    // Reset signal values
    (appSignals.isInLoginProcessSignal as any).value = false;
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
    // Mock login method to resolve successfully
    (mockContext.auth.login as jest.Mock).mockResolvedValue({
      status: 200,
      message: 'Login successful'
    });

    // Simulate being in login process
    (appSignals.isInLoginProcessSignal as any).value = true;

    const parsedCommand: ParsedCommand = {
      command: 'login',
      args: ['testuser', 'password123'],
      switches: {}
    };

    const response: ICommandResponse = await LoginCommand.execute(mockContext, parsedCommand);

    expect(mockContext.auth.login).toHaveBeenCalledWith('testuser', 'password123');
    expect(appSignals.setIsInLoginProcess).toHaveBeenCalledWith(false);
    expect(response.status).toBe(200);
    expect(response.message).toBe('Login successful!');
    expect(response.sensitive).toBe(true);
  });

  it('should handle login failure', async () => {
    const mockContext = createMockContext();
    // Mock login method to reject
    (mockContext.auth.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

    // Simulate being in login process
    (appSignals.isInLoginProcessSignal as any).value = true;

    const parsedCommand: ParsedCommand = {
      command: 'login',
      args: ['testuser', 'wrongpassword'],
      switches: {}
    };

    const response: ICommandResponse = await LoginCommand.execute(mockContext, parsedCommand);

    expect(mockContext.auth.login).toHaveBeenCalledWith('testuser', 'wrongpassword');
    expect(appSignals.setIsInLoginProcess).toHaveBeenCalledWith(false);
    expect(response.status).toBe(500);
    expect(response.message).toContain('Login error: Invalid credentials');
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
