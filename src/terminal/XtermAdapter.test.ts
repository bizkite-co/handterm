import { XtermAdapter } from './XtermAdapter';

// jsdom doesn't support matchMedia so we have to mock it
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('XtermAdapter', () => {
  let xtermAdapter: XtermAdapter;
  let mockElement: HTMLDivElement;
  let mockHandexTerm: any;

  beforeEach(() => {
    mockElement = document.createElement('div');
    mockHandexTerm = {
      getCommandHistory: jest.fn(() => []),
      handleCommand: jest.fn((input: string) => {
        const commandElement = document.createElement('div');
        commandElement.textContent = input;
        return commandElement;
      }),
      handleCharacter: jest.fn((data: string) => 0)
    };
    
    xtermAdapter = new XtermAdapter(mockHandexTerm, mockElement);
  });

  it('should add command element to commandHistory when user enters a command', () => {
    // The command the user types
    const command = 'ls -al';

    // Simulate the user typing the command and hitting Enter
    // This is a simplified example; your actual implementation may differ
    xtermAdapter.onDataHandler(`${command}\r`); // Assuming '\r' is the Enter key signal

    // Check that handleCommand was called with the correct command
    expect(mockHandexTerm.handleCommand).toHaveBeenCalledWith(command);

    // Check the commandHistory to see if the command element was added
    expect(xtermAdapter.getCommandHistory().length).toBe(1);
    expect(xtermAdapter.getCommandHistory()[0].textContent).toBe(command);
  });
});