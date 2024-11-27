interface TreeItem {
    path: string;
    type: string;
}

export function formatTreeContent(items: TreeItem[]): string {
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

    // Build tree structure
    sortedDirs.forEach(dir => {
        const depth = dir.split('/').length;
        const indent = '  '.repeat(depth - 1);
        const name = dir.split('/').pop() || '';
        lines.push(`${indent}├─ 📁 ${name}/`);
    });

    // Add files under their directories
    sortedItems.forEach(item => {
        if (item.type !== 'tree') {
            const parts = item.path.split('/');
            const fileName = parts.pop() || '';
            const depth = parts.length;
            const indent = '  '.repeat(depth);
            lines.push(`${indent}${parts.length > 0 ? '├─' : ''} 📄 ${fileName}`);
        }
    });

    // Add navigation help
    lines.push('');
    lines.push('Navigation:');
    lines.push('j: move down');
    lines.push('k: move up');
    lines.push('Enter: open file');
    lines.push('e: close tree view');
    lines.push('');

    return lines.join('\n');
}
