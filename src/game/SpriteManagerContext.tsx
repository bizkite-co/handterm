// SpriteManagerContext.tsx
import { createContext } from 'react';

import { type SpriteManager } from './sprites/SpriteManager';

// Create a context with a default undefined value
const SpriteManagerContext = createContext<SpriteManager | undefined>(undefined);

export default SpriteManagerContext;