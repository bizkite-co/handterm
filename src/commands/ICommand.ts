
export interface ICommand {
    name: string;
    description: string;
    hook: string;
    switches?: Record<string, string>; // Switches with their descriptions
}