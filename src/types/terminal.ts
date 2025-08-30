import * as S from '@effect/schema/Schema';
import type { RefObject } from 'react';

// Define a schema for the disposable object returned by onData
const DisposableSchema = S.Struct({
  dispose: S.Function(S.Tuple(), S.Void),
});

// Define the schema for the ITerminalAdapter
export const ITerminalAdapterSchema = S.Struct({
  /**
   * A React ref object pointing to the terminal's container element.
   */
  ref: S.PropertySignature(S.Any as S.Schema<RefObject<HTMLDivElement>>),

  /**
   * Writes data to the terminal.
   * @param data The string data to write.
   */
  write: S.PropertySignature(S.Function(S.Tuple(S.String), S.Void)),

  /**
   * Resets the terminal prompt to its initial state.
   */
  resetPrompt: S.PropertySignature(S.Function(S.Tuple(), S.Void)),

  /**
   * Focuses the terminal input.
   */
  focus: S.PropertySignature(S.Function(S.Tuple(), S.Void)),

  /**
   * Registers a callback for when data is received from the terminal.
   * @param callback The function to execute with the data.
   * @returns An object with a `dispose` method to unsubscribe.
   */
  onData: S.PropertySignature(
    S.Function(
      S.Tuple(S.Function(S.Tuple(S.String), S.Void)),
      DisposableSchema
    )
  ),
});

// Infer the TypeScript type from the schema
export type ITerminalAdapter = S.Schema.Type<typeof ITerminalAdapterSchema>;
