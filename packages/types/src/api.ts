import { Schema } from '@effect/schema';

// ---- Response schemas (client validates API responses against these) ----

/** Response shape for getFile: { content, encoding?, lastModified?, size? } */
export const FileContentResponseSchema = Schema.Struct({
  content: Schema.String,
  encoding: Schema.optional(Schema.String),
  lastModified: Schema.optional(Schema.String),
  size: Schema.optional(Schema.Number),
});

/** Response shape for putFile / deleteFile: { message } */
export const MessageResponseSchema = Schema.Struct({
  message: Schema.String,
});

/** Response shape for listFiles: { files: string[] } */
export const ListFilesResponseSchema = Schema.Struct({
  files: Schema.Array(Schema.String),
});

// ---- Request payload schemas (Lambda validates incoming bodies against these) ----

/** Body for putFile: { key, extension?, content } */
export const PutFileRequestSchema = Schema.Struct({
  key: Schema.String,
  extension: Schema.optional(Schema.String),
  content: Schema.String,
});

/** Body for deleteFile: { path } */
export const DeleteFileRequestSchema = Schema.Struct({
  path: Schema.String,
});

/** Body for listFiles: {} (no required fields) */
export const ListFilesRequestSchema = Schema.Struct({});

/** Query params for getFile: { key, extension } */
export const GetFileRequestSchema = Schema.Struct({
  key: Schema.String,
  extension: Schema.String,
});
