import { vi } from 'vitest';

// Suppress console warnings by mocking console methods
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
