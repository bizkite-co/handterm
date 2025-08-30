Read the @docs/issues/92-make-the-xterm-into-a-monaco/_index.md and then review this repo. We are having a lot of 
trouble with a small prompt-handling problem in XTerm and I am wondering if, for our use-cases, we should use the  │
Monaco text editor as the terminal, instead of XTerm. We will never be installing a TUI in our XTerm. We are       │
already not using the executed command output part of XTerm. We are putting that in our Output.tsx instead,      │
since this is a React app and we need to include some visual images in our CLI. Our terminal use is tightly        │
constrained to formulating an ASCII text command or prompt and hitting Enter to execute it. I should call out that │
 we are monitoring characters per minute typed, and we are monitoring the current status of the input text to      │
compare it with the target text in our typing game, which tests for completion, and continuously updates the       │
NextChars sequence. I think that using Monaco might actually be a big improvement for that, because we could     │
have multi-line VIM-style operations as targets to be monitored. It would mean that we would have to update        │
several of our modules, though. I am hoping everything is modular enough to make this process slightly eesier, but │
 this will probably not be very simple. I have started using Effect Schema in another project and it was very      │
helpful in reducing the complexity. We should consider incremental introduction of that for specific issues. For   │
instance, we have a difficult state machine implementation and Effect might help us with that. I need you to       │
review the code and develope comprehensive documentation on this proposed change. Put all documents in the same    │
folder as the file above. After you review the codebase and the README.md and any documents you need to review,    │
ask me any questions on anything you need more clarity on or might be worried about making an assumption on. We    │
might be able to reduce our dependency on Signal or Zod or other tools by using Effect, but we don't need to do    │
any refactoring that does not work towards this one, tightly constrained task. We don't even need to introduce     │
Effect if we are not sure it will help.  
