import type React from 'react';

type CharWPM = {
    character: string;
    wpm: number;
    durationMilliseconds: number;
};

interface SlowestCharactersDisplayProps {
    charWpms: CharWPM[];
}

const averageWpmByCharacter = (charWpms: CharWPM[]) => {
    const charGroups: Record<string, { totalWpm: number, count: number }> = {};

    // Sum WPMs for each character and count occurrences
    charWpms.forEach(({ character, wpm }) => {
        if (!charGroups[character]) {
            charGroups[character] = { totalWpm: 0, count: 0 };
        }
        (charGroups[character] ??= { totalWpm: 0, count: 0 }).totalWpm += wpm;
        (charGroups[character] ??= { totalWpm: 0, count: 0 }).count++;
    });

    // Calculate average WPM for each character
    return Object.entries(charGroups).map(([character, { totalWpm, count }]) => ({
        character,
        wpm: totalWpm / count,
        durationMilliseconds: 0, // You may want to handle duration aggregation differently
    }));
}

export const SlowestCharactersDisplay: React.FC<SlowestCharactersDisplayProps> = ({ charWpms }) => {
    // that calculates the average WPM for each character.
    const characterAverages = averageWpmByCharacter(charWpms.filter(wpm => wpm.durationMilliseconds > 1));
    const slowestCharacters = characterAverages
        .sort((a, b) => a.wpm - b.wpm)
        .slice(0, 3);

    return (
        <div className="slow-chars">
            {slowestCharacters.map((char, index) => (
                <div key={index}>
                    <span>Character: {char.character}</span>
                    <span>WPM: {char.wpm.toFixed(2)}</span>
                </div>
            ))}
        </div>
    );
};

// If you need to use ReactDOMServer.renderToStaticMarkup in the functional component context,
// you would typically do it outside the component, wherever you're intending to use the HTML string.
// For example:
// const slowestCharactersHtml = ReactDOMServer.renderToStaticMarkup(<SlowestCharactersDisplay charWpms={charWpms} />);