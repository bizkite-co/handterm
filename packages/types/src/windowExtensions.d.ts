// This file centralizes global type augmentations for the Window interface.
// TODO: If additional global augmentations from src/types/WindowExtensions.d.ts are needed,
// merge them here and ensure no duplicate declarations exist across the project.

declare global {
  interface Window {
    // For example, if you have a global "monaco" variable, declare it here:
    // monaco?: typeof Monaco;

    // Add other global augmentations as needed.
  }
}

// This export ensures the file is treated as a module.
export {};
