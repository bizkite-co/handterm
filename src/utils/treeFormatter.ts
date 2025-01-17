interface TreeItem {
    path: string;
    type: 'file' | 'directory' | 'blob' | 'tree';
}

export function formatTreeContent(items: TreeItem[]): string {
    const sortedItems = [...items].sort((a, b) => {
        // Directories come first
        const aIsDir = a.type === 'tree' || a.type === 'directory';
        const bIsDir = b.type === 'tree' || b.type === 'directory';
        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.path.localeCompare(b.path);
    });

    const lines: string[] = ['Repository Files', ''];

    // Add items at current level
    sortedItems.forEach(item => {
        const name = item.path.split('/').pop() ?? '';
        if (item.type === 'tree' || item.type === 'directory') {
            lines.push(`${name}/`);
        } else {
            lines.push(name);
        }
    });

    // Add navigation help
    lines.push('');
    lines.push('Navigation:');
    lines.push('  j: move down');
    lines.push('  k: move up');
    lines.push('  Enter: navigate into directory');
    lines.push('  e: close tree view');
    lines.push('');

    return lines.join('\n');
}

export function getItemAtLine(
    items: TreeItem[],
    lineNumber: number
): { path: string; type: string; isDirectory: boolean } | null {
    const content = formatTreeContent(items);
    const lines = content.split('\n');
    const line = lines[lineNumber - 1];

    if (!line) return null;

    // Get the item name (remove trailing slash for directories)
    const name = line.replace(/\/$/, '');
    const isDirectory = line.endsWith('/');

    // Find matching item
    const item = items.find(i => {
        const itemName = i.path.split('/').pop() ?? '';
        return itemName === name &&
            (isDirectory ? (i.type === 'tree' || i.type === 'directory') : true);
    });

    return item ? {
        path: item.path,
        type: item.type,
        isDirectory: isDirectory
    } : null;
}
