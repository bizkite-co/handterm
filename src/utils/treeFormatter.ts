interface TreeItem {
    path: string;
    type: string;
}

interface TreeState {
    expandedFolders: Set<string>;
}

export function formatTreeContent(items: TreeItem[], treeState: TreeState): string {
    const sortedItems = [...items].sort((a, b) => {
        // Directories come first
        if (a.type === 'tree' && b.type !== 'tree') return -1;
        if (a.type !== 'tree' && b.type === 'tree') return 1;
        return a.path.localeCompare(b.path);
    });

    const lines: string[] = ['Repository Files', ''];
    const pathParts = new Map<string, number>();

    // First pass: collect all directories
    const directories = new Set<string>();
    sortedItems.forEach(item => {
        const parts = item.path.split('/');
        parts.pop(); // Remove the last part (file/dir name)
        let currentPath = '';
        parts.forEach(part => {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            directories.add(currentPath);
        });
    });

    // Convert directories to array and sort
    const sortedDirs = Array.from(directories).sort();

    // Helper to check if path should be visible based on parent expansion state
    const isVisible = (path: string): boolean => {
        if (!path.includes('/')) return true;
        const parentPath = path.split('/').slice(0, -1).join('/');
        return treeState.expandedFolders.has(parentPath) &&
               (parentPath.includes('/') ? isVisible(parentPath) : true);
    };

    // Build tree structure
    sortedDirs.forEach(dir => {
        if (isVisible(dir)) {
            const depth = dir.split('/').length;
            const indent = '  '.repeat(depth - 1);
            const name = dir.split('/').pop() || '';
            const isExpanded = treeState.expandedFolders.has(dir);
            const arrow = isExpanded ? '▼' : '▶';
            lines.push(`${indent}${arrow} 📁 ${name}/`);
        }
    });

    // Add files under their directories
    sortedItems.forEach(item => {
        if (item.type !== 'tree' && isVisible(item.path)) {
            const parts = item.path.split('/');
            const fileName = parts.pop() || '';
            const depth = parts.length;
            const indent = '  '.repeat(depth);
            const prefix = parts.length > 0 ? '  ' : '';
            const icon = getFileIcon(fileName);
            lines.push(`${indent}${prefix}${icon} ${fileName}`);
        }
    });

    // Add navigation help
    lines.push('');
    lines.push('Navigation:');
    lines.push('j: move down');
    lines.push('k: move up');
    lines.push('Enter: open file or toggle folder');
    lines.push('e: close tree view');
    lines.push('');

    return lines.join('\n');
}

// Helper function to get the item at a specific line
export function getItemAtLine(
    items: TreeItem[],
    treeState: TreeState,
    lineNumber: number
): { path: string; type: string; isDirectory: boolean } | null {
    const content = formatTreeContent(items, treeState);
    const lines = content.split('\n');
    const line = lines[lineNumber - 1];

    if (!line || !line.match(/[▼▶]?\s*[📁📄]/u)) {
        return null;
    }

    // Extract path from the line
    const match = line.match(/[▼▶]?\s*[^\s]+\s+(.+?)\/?\s*$/u);
    if (!match) return null;

    const name = match[1];
    const indent = line.match(/^\s*/)?.[0].length || 0;
    const depth = Math.floor(indent / 2);

    // Reconstruct full path based on previous directory lines
    const pathParts: string[] = [];
    let currentDepth = 0;

    for (let i = lineNumber - 2; i >= 0 && currentDepth < depth; i--) {
        const prevLine = lines[i];
        const prevMatch = prevLine.match(/[▼▶]?\s*[^\s]+\s+(.+?)\/\s*$/u);
        if (prevMatch) {
            const prevIndent = prevLine.match(/^\s*/)?.[0].length || 0;
            const prevDepth = Math.floor(prevIndent / 2);
            if (prevDepth === currentDepth) {
                pathParts.unshift(prevMatch[1]);
                currentDepth++;
            }
        }
    }

    pathParts.push(name);
    const fullPath = pathParts.join('/');

    const isDirectory = line.includes('📁');
    return {
        path: fullPath,
        type: isDirectory ? 'tree' : 'blob',
        isDirectory
    };
}

// Helper function to get file icon based on extension
function getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'js':
        case 'jsx':
            return '📜';
        case 'ts':
        case 'tsx':
            return '📘';
        case 'json':
            return '📋';
        case 'md':
            return '📝';
        case 'html':
            return '🌐';
        case 'css':
        case 'scss':
        case 'sass':
            return '🎨';
        case 'py':
            return '🐍';
        case 'rb':
            return '💎';
        case 'java':
            return '☕';
        case 'go':
            return '🐹';
        case 'rs':
            return '🦀';
        case 'php':
            return '🐘';
        case 'sh':
        case 'bash':
            return '💻';
        case 'yml':
        case 'yaml':
            return '⚙️';
        case 'svg':
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
            return '🖼️';
        default:
            return '📄';
    }
}
