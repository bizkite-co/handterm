const commandTextToHTML = (text: string): string => {
  return text.replace(/\n/g, '<br/>');
};

const parseAndExecuteCommand = (input: string): string => {
  const [commandName, ...args] = input.split(/\s+/);
  const [parameters, switches] = parseSwitches(args);
  const command = commandRegistry.getCommand(commandName);
  
  if (command) {
    return command.execute(parameters, switches);
  }
  return `Command not found: ${commandName}`;
};

const parseSwitches = (args: string[]): [string[], Record<string, boolean | string>] => {
  const switches: Record<string, boolean | string> = {};
  const parameters: string[] = [];

  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [switchName, switchValue] = arg.slice(2).split('=');
      switches[switchName] = switchValue || true;
    } else if (arg.startsWith('-')) {
      const switchName = arg.slice(1);
      switches[switchName] = true;
    } else {
      parameters.push(arg);
    }
  });

  return [parameters, switches];
};
