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
        await this.waitForImageLoad(sprite.image);

        this.spriteCache.set(animationData.imagePath, sprite);
        return sprite;
    }

    private waitForImageLoad(image: HTMLImageElement): Promise<void> {
        return new Promise((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error(`Image failed to load: ${image.src}`));
        });
    }
}


