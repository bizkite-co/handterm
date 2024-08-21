import React from 'react';
import { Chord } from '../components/Chord';
import ReactDOMServer from 'react-dom/server';

interface HelpCommandProps {
    command: string;
}

const HelpCommand: React.FC<HelpCommandProps> = ({ command }) => {
    if (command === 'help' || command === '411') {
        const commandChords = [
            'DELETE (Backspace)', 
            'Return (ENTER)', 
            'UpArrow', 
            'LeftArrow', 
            'DownArrow', 
            'RightArrow',
            'ESCAPE',
        ].map(c => {
            return <Chord key={c} displayChar={c} />;
        });
        const commandChordsHtml = commandChords.map(element => {
            return ReactDOMServer.renderToStaticMarkup(element);
        }).join('');
        const response = "<div class='chord-display-container'>" + commandChordsHtml + "</div>";
        return <div dangerouslySetInnerHTML={{ __html: response }} />;
    }
    return null;
};

export default HelpCommand;
