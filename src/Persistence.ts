// Persistence.ts
export interface IPersistence {
  saveCommandHistory(command: string): void;
  loadCommandHistory(): string[];
  setItem(key: string, value: string): void;
  // Other persistence-related methods
}

export class LocalStoragePersistence implements IPersistence {
  saveCommandHistory(): void {
    // Use localStorage to save the command history
  }

  setItem(key: string, value: string): void {
    // Use localStorage to save the item
    localStorage.setItem(key, value);
  }

  loadCommandHistory(): string[] {
    // Use localStorage to load the command history
    return [];
  }
  // Additional methods using localStorage
}