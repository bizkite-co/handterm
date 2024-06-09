import { ClearCommand } from "./useClearCommand";
import { HelpCommand } from "./HelpCommand";
import { ListPhrasesCommand } from "./ListPhrasesCommand";
import { commandRegistry } from "./commandRegistry";

commandRegistry.register(ClearCommand);
commandRegistry.register(HelpCommand);
commandRegistry.register(ListPhrasesCommand);
commandRegistry.register({
    name: "video",
    description: "Toggle the video camera",
    hook: 'useVideoCommand'
})