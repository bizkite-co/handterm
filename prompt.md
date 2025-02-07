You and I solved some significant problems with what you're doing here with `localStorage`: `src/e2e/tests/localStorage-presence.spec.ts`

That test was designed to be tightly focused to only test the exact issue we were having trouble with, and then we created a few related baby-step tests to connect to our application tests.

Now, I would like to focus on a test that is based on this feature file: `src/e2e/scenarios/edit-command.feature`

The test is partially implemented here: `src/e2e/edit-command.spec.ts`

I want to follow the same principles of separation of concerns and testing the smallest baby-steps we can in each test and make the `edit-command.spec.ts` just test that a string of text can be read from the `localStorage` and then displayed in the terminal UI, which shold be able to be access through the `src/e2e/page-objects/TerminalPage.ts`. We should then be able to add a test that we can type a string into the terminal and save it.