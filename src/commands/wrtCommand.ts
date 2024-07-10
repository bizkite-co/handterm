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
            let limit = 10;
            if(_switches && _switches['limit']){
                let limitSwitch = _switches['limit']
                if(typeof limitSwitch === 'string'){
                    limit = parseInt(limitSwitch)
                }
            }
            (async () => {
                try {
                    const wrtResponse = await _handTerm.props.auth.getLog('wrt', limit);

                    if (wrtResponse.status == 200) {
                        if (!Array.isArray(wrtResponse.data)) {
                            _handTerm.writeOutput("No WRT found.");
                        } else {
                            const text = wrtResponse.data.join('<br/>');
                            _handTerm.writeOutput(text);
                        }
                    } else {
                        _handTerm.writeOutput("Error getting WRT: " + wrtResponse.error.join(', '));
                    }

                } catch (error) {
                    _handTerm.writeOutput("Error getting WRT: " + error);
                }

            })();
            response = {status: 200, message: "Getting WRT"};
            _handTerm.adapterRef.current?.prompt();
            return response;
        } else {
            const content = args.join(' ');
            _handTerm.props.auth.saveLog('wrt/' + new Date().getTime(), content, 'txt');
            _handTerm.adapterRef.current?.prompt();
            return {status: 200, message: "Wrote message to wrt dir"};
        }
    }
}