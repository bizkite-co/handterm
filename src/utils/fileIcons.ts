// Map file extensions to appropriate icons
const fileIconMap: Record<string, string> = {
    // Web
    'html': '🌐',
    'css': '🎨',
    'js': '📜',
    'jsx': '⚛️',
    'ts': '📘',
    'tsx': '⚛️',

    // Programming
    'py': '🐍',
    'rb': '💎',
    'java': '☕',
    'cpp': '⚙️',
    'c': '⚙️',
    'go': '🐹',
    'rs': '🦀',
    'php': '🐘',

    // Data
    'json': '📋',
    'yml': '📋',
    'yaml': '📋',
    'xml': '📋',
    'csv': '📊',
    'sql': '🗃️',

    // Documents
    'md': '📝',
    'txt': '📄',
    'pdf': '📕',
    'doc': '📘',
    'docx': '📘',

    // Images
    'png': '🖼️',
    'jpg': '🖼️',
    'jpeg': '🖼️',
    'gif': '🖼️',
    'svg': '🎨',

    // Config
    'env': '⚙️',
    'config': '⚙️',
    'toml': '⚙️',
    'ini': '⚙️',

    // Shell
    'sh': '💻',
    'bash': '💻',
    'zsh': '💻',
    'fish': '💻',

    // Git
    'gitignore': '🔒',
    'gitmodules': '🔗',

    // Package managers
    'package.json': '📦',
    'Cargo.toml': '📦',
    'Gemfile': '📦',
    'requirements.txt': '📦',

    // Build
    'Makefile': '🔨',
    'Dockerfile': '🐋',
    'docker-compose.yml': '🐋',
};

// Special filenames that should use specific icons
const specialFiles: Record<string, string> = {
    'LICENSE': '📜',
    'README': '📖',
    'README.md': '📖',
    'CHANGELOG': '📋',
    'CHANGELOG.md': '📋',
    'package.json': '📦',
    'package-lock.json': '📦',
    'yarn.lock': '📦',
    'Cargo.toml': '📦',
    'Gemfile': '📦',
    'requirements.txt': '📦',
    'Dockerfile': '🐋',
    'docker-compose.yml': '🐋',
    'Makefile': '🔨',
};

export function getFileIcon(path: string): string {
    // Check for special filenames first
    const filename = path.split('/').pop() ?? '';
    if (filename in specialFiles) {
        return specialFiles[filename] ?? '';
    }

    // Get file extension
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    return fileIconMap[ext] ?? '📄';
}

export function getFolderIcon(isExpanded: boolean): string {
    return isExpanded ? '📂' : '📁';
}
