import { TerminalCssClasses } from "src/types/TerminalTypes"


export const Prompt = (domain: string, username: string, timestamp: string, githubUsername: string) => {

    return (
        <pre id={TerminalCssClasses.Prompt}>
            <span className="domain">domain</span> <span className="user">~</span>
        </pre>
    )
}