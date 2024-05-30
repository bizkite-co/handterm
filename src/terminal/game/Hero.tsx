import { BaseCharacter } from "./BaseCharacter";
import { HeroActions } from "./ActionTypes";



export class Hero extends BaseCharacter {
    constructor(context: CanvasRenderingContext2D) {
        super(context);
        this.loadActions(HeroActions);
        this.currentAnimation = 'Run';
    }

    public animate(timestamp: number) {
        super.animate(timestamp);
        // Override with specific logic for Hero
        if (this.currentAnimation === 'Run') {
            this.position.leftX 
                = this.position.leftX < this.context.canvas.width 
                ? this.position.leftX + this.velocity.dx 
                : 0;
        }
    }
}