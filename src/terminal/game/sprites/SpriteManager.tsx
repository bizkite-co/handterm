import { Sprite } from './Sprite';
import { SpriteAnimation } from './SpriteTypes';

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
        return new Promise((resolve) => {
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
                console.log('Image failed to load: ' + image.src);
                // reject(new Error(`Image failed to load: ${image.src}`));
            };

            // Attach the event listeners
            image.addEventListener('load', onLoad);
            image.addEventListener('error', onError);
        });
    }
}


