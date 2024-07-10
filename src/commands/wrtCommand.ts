import HandTerm from "src/components/HandTerm";
import { ICommand } from "./ICommand";

export const wrtCommand: ICommand = {
    name: 'wrt',
    description: 'Write a random phrase',
    switches: {
        'all': 'Write all phrases',
        'random': 'Write a random phrase',
        'easy': 'Write only easy phrases',
    },
    execute: (
        _commandName: string,
        args?: string[],
        _switches?: Record<string, boolean | string>,
        _handTerm?: HandTerm
    ) => {
        let response = {status: 500, message: 'Unknown error'}
        if(!_handTerm) return { ...response, message: 'No HandTerm instance provided'};

        if (!args || args.length === 0) {
            (async () => {
                try {
                    const wrtResponse = await _handTerm.props.auth.getLog('wrt');

                    if (wrtResponse.status == 200) {
                        if (!Array.isArray(wrtResponse.data)) {
                            _handTerm.writeOutput("No WRT found.");
                        } else {
                            const text = wrtResponse.data.join('<br/>');
                            _handTerm.writeOutput(text);
                        }
                    }
                } catch (error) {
                    _handTerm.writeOutput("Error getting WRT: " + error);
                }

            })();
            response = {status: 200, message: "Getting WRT"};
            return response;
        } else {
            const content = args.join(' ');
            _handTerm.props.auth.saveLog('wrt/' + new Date().getTime(), content, 'txt');
            return {status: 200, message: "Wrote message to wrt dir"};
        }
    }
}