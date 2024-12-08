## VSCode Insiders Cline Extension Storage Discovery

Cline can export a conversation: `src/core/webview/ClineProvider.ts` `getTaskWithId()`


### Configuration Discovery Strategy

#### Executable Location
```bash
# Find VSCode Insiders executable path
VSCODE_INSIDERS_PATH=$(which code-insiders)
```

#### Configuration Discovery Script
```bash
#!/bin/bash

discover_cline_storage() {
    # Executable path
    local vscode_exe=$(which code-insiders)

    # Derive potential base directories
    local base_dir=$(dirname "$(dirname "$vscode_exe")")

    # Potential storage locations
    local storage_paths=(
        "$base_dir/data/User/globalStorage"
        "$HOME/.config/Code - Insiders/User/globalStorage"
        "$HOME/.vscode-server-insiders/data/User/globalStorage"
    )

    # Known Cline extension IDs
    local extensions=("saoudrizwan.claude-dev" "claude-dev.claude")

    echo "=== Cline Extension Storage Discovery ==="

    # Search for extension storage
    for ext in "${extensions[@]}"; do
        for path in "${storage_paths[@]}"; do
            if [ -d "$path/$ext" ]; then
                echo "Found extension storage: $path/$ext"

                # Validate task storage
                if [ -d "$path/$ext/tasks" ]; then
                    echo "Tasks directory exists"
                    echo "Task count: $(find "$path/$ext/tasks" -maxdepth 1 -type d | wc -l)"

                    # Check for conversation history files
                    for task_dir in "$path/$ext/tasks"/*/; do
                        if [ -f "${task_dir}api_conversation_history.json" ] &&
                           [ -f "${task_dir}ui_messages.json" ]; then
                            echo "Conversation history found in: $task_dir"
                            return 0
                        fi
                    done
                fi
            fi
        done
    done

    echo "No Cline extension storage found"
    return 1
}

# Additional Configuration Checks
check_vscode_settings() {
    echo "=== VSCode Settings Investigation ==="

    # Check for custom globalStorage settings
    grep -r "globalStorage" \
        "$HOME/.config/Code - Insiders/User/settings.json" \
        "$HOME/.vscode-server-insiders/data/User/settings.json" 2>/dev/null
}

# Execute discovery
discover_cline_storage
check_vscode_settings
```

### Configuration Discovery Approach
1. Use `code-insiders` executable path
2. Derive potential storage locations
3. Search for known Cline extension IDs
4. Validate conversation history structure
5. Check for custom globalStorage settings

### Potential Storage Locations
- Executable base directory
- User configuration directory
- VSCode server directory

### Validation Criteria
- Extension storage directory exists
- Tasks directory present
- Conversation history files verified

### Recommended Usage
1. Save script as `find_cline_storage.sh`
2. Make executable: `chmod +x find_cline_storage.sh`
3. Run: `./find_cline_storage.sh`

### Limitations
- Relies on standard VSCode Insiders installation paths
- May not detect non-standard configurations
