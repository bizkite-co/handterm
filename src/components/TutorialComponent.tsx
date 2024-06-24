import { ChordDisplay } from "./ChordDisplay";
import { Chord } from "../types/Types";
import { Achievement } from "../lib/useAchievements";
import { Phrase } from "../utils/Phrase";

export interface ITutorialComponentProps {
    achievement: Achievement;
    includeReturn: boolean;
}

export function TutorialComponent(props: any) {
    if(!Array.isArray(props.achievement.phrase)) 
        throw new Error('achievement is undefined');
    const characters: Chord[] = new Phrase(props.achievement.phrase).chords;
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
                    characters.map((character: Chord, index: number) => {
                        return <ChordDisplay
                            key={index}
                            displayChar={[character.key]}
                        />
                    })
                }
            </div>
        </div>
    );
}
