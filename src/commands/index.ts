import { useClearCommand } from "./clearCommand";
import { HelpCommand } from "./HelpCommand";
import { ListPhrasesCommand } from "./ListPhrasesCommand";
import { commandRegistry } from "./commandRegistry";

commandRegistry.register(useClearCommand);
commandRegistry.register(HelpCommand);
commandRegistry.register(ListPhrasesCommand);
commandRegistry.register({
    name: "video",
    description: "Toggle the video camera",
    hook: 'useVideoCommand'
})