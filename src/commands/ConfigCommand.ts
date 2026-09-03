import { type ICommand, type ICommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { type ParsedCommand } from '../types/Types';
import { chordGlyphScaleSignal, setChordGlyphScale } from '../signals/appSignals';

export const ConfigCommand: ICommand = {
    name: 'config',
    description: 'View or set config options (e.g. config chord-glyph-size 1.5)',
    execute: (
        _context: ICommandContext,
        parsedCommand: ParsedCommand,
    ): Promise<ICommandResponse> => {
        const key = parsedCommand.args[0];
        const value = parsedCommand.args[1];

        if (!key) {
            const currentScale = chordGlyphScaleSignal.value;
            const message = `
              <div class="command-list">
                <span class="cmd-name">chord-glyph-size    </span>  <span class="cmd-desc">${currentScale} (scale factor for chord glyphs)</span>
                <br><br>
                <span class="cmd-desc">Usage: config &lt;key&gt; &lt;value&gt;</span>
              </div>
            `;
            return Promise.resolve<ICommandResponse>({ status: 200, message });
        }

        if (key === 'chord-glyph-size') {
            if (!value) {
                return Promise.resolve<ICommandResponse>({
                    status: 200,
                    message: `chord-glyph-size: ${chordGlyphScaleSignal.value}`,
                });
            }
            const scale = parseFloat(value);
            if (Number.isNaN(scale) || scale <= 0) {
                return Promise.resolve<ICommandResponse>({
                    status: 400,
                    message: `Invalid value "${value}". Must be a positive number (e.g. 1.0, 1.5, 0.75).`,
                });
            }
            setChordGlyphScale(scale);
            return Promise.resolve<ICommandResponse>({
                status: 200,
                message: `chord-glyph-size set to ${scale}`,
            });
        }

        return Promise.resolve<ICommandResponse>({
            status: 404,
            message: `Unknown config key: "${key}". Available: chord-glyph-size`,
        });
    }
};

export default ConfigCommand;
