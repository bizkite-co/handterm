export const TEST_CONFIG = {
  baseUrl: 'http://localhost:5173',
  timeout: {
    short: 2000,
    medium: 5000,
    long: 10000,
    transition: 1000
  },
  /**
   * URL patterns for different activities:
   * - terminal/normal (default): baseUrl (no activity parameter)
   * - edit: ?activity=edit
   * - tree: ?activity=tree
   * Note: The terminal/normal mode is the default and doesn't include an activity parameter
   */
  urlPatterns: {
    edit: /activity=edit/,
    game: /activity=game/,
    tutorial: /activity=tutorial/,
    tree: /activity=tree/
  }
} as const;
