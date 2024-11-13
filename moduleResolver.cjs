const path = require('path');
const fs = require('fs');

// List of extensions to try
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

function tryExtensions(basePath) {
  // First try exact path
  if (fs.existsSync(basePath)) {
    return basePath;
  }

  // Try with each extension
  for (const ext of extensions) {
    const pathWithExt = basePath + ext;
    if (fs.existsSync(pathWithExt)) {
      return pathWithExt;
    }
  }

  // Try index files
  for (const ext of extensions) {
    const indexPath = path.join(basePath, 'index' + ext);
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  }

  return null;
}

module.exports = (request, options) => {
  // Handle src/ prefix
  if (request.startsWith('src/')) {
    const relativePath = request.substring(4); // Remove 'src/'
    const absolutePath = path.resolve(options.rootDir, 'src', relativePath);
    const resolvedPath = tryExtensions(absolutePath);

    if (resolvedPath) {
      return resolvedPath;
    }
  }

  // Try default resolution
  try {
    return options.defaultResolver(request, {
      ...options,
      packageFilter: pkg => {
        // Force CommonJS resolution
        if (pkg.type === 'module') {
          delete pkg.type;
          if (pkg.exports) {
            pkg.main = pkg.exports.require || pkg.exports.default;
          }
        }
        return pkg;
      }
    });
  } catch (error) {
    // If default resolution fails, try our custom resolution
    const absolutePath = path.resolve(options.basedir || options.rootDir, request);
    const resolvedPath = tryExtensions(absolutePath);

    if (resolvedPath) {
      return resolvedPath;
    }

    throw error;
  }
};
