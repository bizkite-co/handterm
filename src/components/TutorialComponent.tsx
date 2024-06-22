import { ChordDisplay } from "./ChordDisplay";
import { Chord } from "../types/Types";
import { Achievement } from "../lib/useAchievements";
import { Phrase } from "../utils/Phrase";

export interface ITutorialComponentProps {
    achievement: Achievement;
    includeReturn: boolean;
}

export function TutorialComponent(props: any) {
    
    const characters: Chord[] = new Phrase(props.achievement.phrase).chords;

    return (
        <div
            className="tutorial-component"
            hidden={!props.isInTutorial}
        >
            <pre>{props.achievement.prompt}</pre>
            <div className="chord-display-container">
                {
                    characters.map((character: Chord, index: number) => {
                        return <ChordDisplay
                            key={index}
                            displayChar={character.key}
                            displayCharCode={character.chordCode}
                        />
                    })
                }
                {props.includeReturn &&
                    <ChordDisplay displayChar="\r" displayCharCode="0" />
                }
            </div>
        </div>
    );
}
