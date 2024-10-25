interface ImportMeta {
  glob:<T>(patter: string, options?: { eager?: boolean }) => Record<string, T>;
  readonly env: Record<string, string>;
}
