# Sprite Animation Atomic Processing

Work items to improve sprite animation state management in useBaseCharacter:

- [x] Consolidate action type change handling into a single effect
- [x] Remove redundant sprite state updates
- [x] Improve sprite loading and state management flow
- [x] Ensure frame index resets happen atomically with action changes
- [x] Remove unnecessary hero-specific effect
- [x] Add proper cleanup for animation frames
- [x] Fix TypeScript type issues with spritesRef initialization

Changes implemented:
1. Consolidated all sprite/animation state changes into a single effect
2. Properly initialized spritesRef with undefined values for all action types
3. Improved cleanup on unmount
4. Removed redundant state updates and hero-specific logic
5. Ensured atomic processing of frame index resets with action changes
