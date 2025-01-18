import { type ReactNode } from 'react';
import type React from 'react';

// Existing types from Types.ts that are important for broader context

export type MyResponse<T> = {
  status: 200 | 400 | 401 | 403 | 404 | 500;
  data?: T | undefined;
  message: string | undefined;
  error: string[];
};

export interface ParsedCommand {
  command: string;
  args: readonly string[];
  switches: Readonly<Record<string, boolean | string>>;
}

export interface OutputElement {
  command: ParsedCommand;
  response?: ReactNode;
  status: number;
  wpmAverage?: number;
  commandTime: Date;
  component?: ReactNode;
  sensitive?: boolean;
}

export interface ParsedLocation {
  activityKey: ActivityType;
  contentKey?: string | null;
  groupKey?: string | null;
}

// HandTerm-specific interfaces
export interface IHandTermWrapperMethods {
  writeOutput: (output: string) => void;
  prompt: () => void;
  saveCommandResponseHistory: (command: string, response: string, status: number) => string;
  focusTerminal: () => void;
  handleCharacter: (character: string) => void;
  refreshComponent: () => void;
  setHeroSummersaultAction: () => void;
  setEditMode: (isEditMode: boolean) => void;
  handleEditSave: (content: string) => void;
}

export interface HandTermWrapperProps {
  terminalWidth: number;
  auth: IAuthProps;
  onOutputUpdate: (output: OutputElement) => void;
}

// Authentication-related interfaces
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignUpCredentials extends LoginCredentials {
  email: string;
}

export interface AuthResponse {
  AccessToken: string;
  RefreshToken: string;
  IdToken: string;
  ExpiresAt?: string;
  ExpiresIn: string;
  githubUsername?: string;
}

export interface IAuthProps {
  login: (username: string, password: string) => Promise<MyResponse<AuthResponse>>;
  signup: (credentials: SignUpCredentials) => Promise<MyResponse<unknown>>;
  verify: (username: string, code: string) => Promise<unknown>;
  refreshToken: () => Promise<MyResponse<AuthResponse>>;
  validateAndRefreshToken: () => Promise<MyResponse<AuthResponse>>;
  isLoggedIn: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isPending: boolean;
}

// Command-related interfaces
export interface ICommandContext {
  executeCommand: (command: string) => Promise<void>;
  commandHistory: string[];
  addToCommandHistory: (command: string) => void;
  output: OutputElement[];
  appendToOutput: (output: OutputElement) => void;
  handTermRef: React.RefObject<IHandTermWrapperMethods>;
  auth: IAuthProps;
  updateLocation: (options: ParsedLocation) => void;
}

export interface ICommandResponse {
  status: number;
  message: string;
  body?: string | null;
  sensitive?: boolean;
}

export interface ICommand {
  name: string;
  description: string;
  switches?: Record<string, string>;
  execute: (
    context: ICommandContext,
    parsedCommand: ParsedCommand,
  ) => Promise<ICommandResponse>;
}
