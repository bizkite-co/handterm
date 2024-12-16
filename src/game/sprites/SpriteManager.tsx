import { createLogger, LogLevel } from 'src/utils/Logger';

import { SpriteAnimation } from '../types/SpriteTypes';

import { Sprite } from './Sprite';

const logger = createLogger({
  prefix: 'SpriteManager',
  level: LogLevel.ERROR
});

export class SpriteManager {
    private spriteCache = new Map<string, Sprite>();

    public async loadSprite(animationData: SpriteAnimation): Promise<Sprite> {
        if (this.spriteCache.has(animationData.imagePath)) {
            const cachedSprite = this.spriteCache.get(animationData.imagePath);
            if (cachedSprite !== undefined) {
                return cachedSprite;
            }
        }

        const sprite = new Sprite(animationData.imagePath, animationData.frameCount, animationData.frameWidth, animationData.frameHeight, animationData.framePositions);
        await this.waitForManagerImageLoad(sprite.image);

        this.spriteCache.set(animationData.imagePath, sprite);
        return sprite;
    }

    private waitForManagerImageLoad(image: HTMLImageElement): Promise<void> {
        return new Promise((resolve, reject) => {
            const onLoad = () => {
                // Cleanup: Remove both event listeners
                image.removeEventListener('load', onLoad);
                image.removeEventListener('error', onError);
                resolve();
            };

            const onError = () => {
                // Cleanup: Remove both event listeners
                image.removeEventListener('load', onLoad);
                image.removeEventListener('error', onError);
                logger.error('Image failed to load: ' + image.src);
                reject(new Error(`Image failed to load: ${image.src}`)); // Reject the promise on error
            };

            // Attach the event listeners
            image.addEventListener('load', onLoad);
            image.addEventListener('error', onError);
        });
    }
}
