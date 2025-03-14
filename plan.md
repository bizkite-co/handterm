I found a new library here: https://webcontainers.io/guides/quickstart 

It says it creates a Posix-style container in the browser.

I have created a separate branch on this project to pursue the posibility that we could solve some of our problems by actually creating a terminal environment in the browswer.

This might be to dificult to reasonably speculate about, so I think the fastest way to investigate this possibility might be to try to do it.

So I have created a sparate branch. There is still some possibility of creating conflict because we will be adding a new library, which will create new content in the `node_modules/`, which is not included in the git commits, so we will have to be cognizant of that when switching back to `master`, but hopefully we won't be doing that often.

Can you overwrite the `plan.md` with this current plan, and then use that text to create a new Issue as per '.clinerules' (see below for file content) ?

Then, we will create some subtask Issues and new subtask chats to work on task items we create in this chat.
