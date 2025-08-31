import * as S from '@effect/schema/Schema';

const RefObjectSchema = S.Struct({
  current: S.Union(S.instanceOf(HTMLDivElement), S.Null),
});

// Define the schema for the ITerminalAdapter
export const ITerminalAdapterSchema = S.Struct({
  /**
   * A React ref object pointing to the terminal's container element.
   */
  ref: S.propertySignature(RefObjectSchema),

  /**
   * Writes data to the terminal.
   * @param data The string data to write.
   */
  write: S.propertySignature(S.Any),

  /**
   * Resets the terminal prompt to its initial state.
   */
  resetPrompt: S.propertySignature(S.Any),

  /**
   * Focuses the terminal input.
   */
  focus: S.propertySignature(S.Any),

  /**
   * Registers a callback for when data is received from the terminal.
   * @param callback The function to execute with the data.
   * @returns An object with a `dispose` method to unsubscribe.
   */
  onData: S.propertySignature(S.Any),
});

// Infer the TypeScript type from the schema
export type ITerminalAdapter = S.Schema.Type<typeof ITerminalAdapterSchema>;
