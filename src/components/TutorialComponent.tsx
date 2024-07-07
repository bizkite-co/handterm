import { ChordDisplay } from "./ChordDisplay";
import { Achievement } from "../types/Types";

export interface ITutorialComponentProps {
    achievement: Achievement;
    includeReturn: boolean;
}

export function TutorialComponent(props: any) {
    if(!Array.isArray(props.achievement.phrase)) 
        throw new Error('achievement is undefined');
    const characters: string[] = props.achievement.phrase;
    if(characters.length === 0) 
        throw new Error('achievement is undefined');
    return (
        <div
            className="tutorial-component"
            hidden={!props.isInTutorial}
        >
            <pre className="tutorial-prompt">{props.achievement.prompt}</pre>
            <div className="chord-display-container">
                {
                    characters.map((character: string, index: number) => {
                        return <ChordDisplay
                            key={index}
                            displayChar={[character]}
                        />
                    })
                }
            </div>
        </div>
    );
}
