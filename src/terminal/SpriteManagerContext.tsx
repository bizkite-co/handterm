// SpriteManagerContext.tsx
import React from 'react';
import { SpriteManager } from './game/sprites/SpriteManager';

// Create a context with a default undefined value
const SpriteManagerContext = React.createContext<SpriteManager | undefined>(undefined);

export default SpriteManagerContext;