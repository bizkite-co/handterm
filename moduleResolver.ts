import fs from 'fs';
import path from 'path';

// List of extensions to try
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

/**
 * Attempts to resolve a file path by trying different extensions and index files.
 * @param {string} basePath - The base path to resolve.
 * @returns {string | null} The resolved path, or null if not found.
 */
function tryExtensions(basePath: string): string | null {
  // First try exact path
  if (fs.existsSync(basePath)) {
    return basePath;
  }

  // Try with each extension
  for (const ext of extensions) {
    const pathWithExt: string = basePath + ext;
    if (fs.existsSync(pathWithExt)) {
      return pathWithExt;
    }
  }

  // Try index files
  for (const ext of extensions) {
    const indexPath: string = path.join(basePath, 'index' + ext);
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  }

  return null;
}

interface PackageJson {
  type?: string;
  exports?:
    | string
    | {
        require?: string;
        default?: string;
      }
    | undefined
    | null;
  main?: string;
}

interface ResolverOptions {
  basedir?: string | undefined | null;
  rootDir: string;
  packageFilter?: (pkg: PackageJson) => PackageJson;
  defaultResolver: (request: string, options: ResolverOptions) => string;
}

/**
 * Checks if a string is not null, undefined, or empty.
 * @param {string | undefined | null} str - The string to check.
 * @returns {boolean} True if the string is not null, undefined, or empty, false otherwise.
 */
function isNonEmptyString(str: string | undefined | null): str is string {
  return typeof str === 'string' && str.length > 0;
}

/**
 * Checks if the exports field in package.json is a valid object.
 * @param {unknown} exports - The exports field to check.
 * @returns {boolean} True if the exports field is a valid object, false otherwise.
 */
function isValidExports(
  exports: unknown
): exports is { require?: string; default?: string } {
  return (
    typeof exports === 'object' &&
    exports !== null &&
    !Array.isArray(exports)
  );
}

/**
 * Resolves a module path based on a given base directory.
 * @param {string} request - The module request string.
 * @param {string} baseDir - The base directory to resolve from.
 * @returns {string | null} The resolved module path, or null if not found.
 */
function resolveWithBaseDir(
  request: string,
  baseDir: string
): string | null {
  const absolutePath: string = path.resolve(baseDir, request);
  return tryExtensions(absolutePath);
}

/**
 * Resolves a module request, handling 'src/' prefix and custom resolution logic.
 * @param {string} request - The module request string.
 * @param {ResolverOptions} options - Resolution options.
 * @returns {string} The resolved module path.
 * @throws {Error} If the module cannot be resolved.
 */
const moduleResolver = (
  request: string,
  options: ResolverOptions
): string => {
  // Handle src/ prefix
  if (request.startsWith('src/')) {
    const relativePath: string = request.substring(4); // Remove 'src/'
    const absolutePath: string = path.resolve(
      options.rootDir,
      'src',
      relativePath
    );
    const resolvedPath: string | null = tryExtensions(absolutePath);

    if (resolvedPath) {
      return resolvedPath;
    }
  }

  // Try default resolution
  try {
    if (options.defaultResolver) {
      return options.defaultResolver(request, {
        ...options,
        packageFilter: (pkg: PackageJson): PackageJson => {
          // Force CommonJS resolution
          if (pkg.type === 'module') {
            const newPkg: PackageJson = { ...pkg };
            delete newPkg.type;

            if (isValidExports(newPkg.exports)) {
              if (isNonEmptyString(newPkg.exports.require)) {
                newPkg.main = newPkg.exports.require;
              } else if (isNonEmptyString(newPkg.exports.default)) {
                newPkg.main = newPkg.exports.default;
              }
            } else {
              newPkg.exports = undefined;
            }
            return newPkg;
          }
          return pkg;
        },
      });
    }
  } catch (error) {
    // If default resolution fails, try our custom resolution
    if (
      options.basedir !== undefined &&
      options.basedir !== null &&
      isNonEmptyString(options.basedir)
    ) {
      const resolvedPath: string | null = resolveWithBaseDir(
        request,
        options.basedir
      );
      if (resolvedPath) {
        return resolvedPath;
      }
    }

    if (
      options.rootDir !== undefined &&
      options.rootDir !== null &&
      isNonEmptyString(options.rootDir)
    ) {
      const resolvedPath: string | null = resolveWithBaseDir(
        request,
        options.rootDir
      );
      if (resolvedPath) {
        return resolvedPath;
      }
    }

    throw error;
  }
  throw new Error('Could not resolve module');
};

export { moduleResolver };
