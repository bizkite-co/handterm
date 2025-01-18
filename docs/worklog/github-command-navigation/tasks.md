The GitHubCommand `github -t` loads one level of the github tree of a repo into the `localStorage`

It then is supposed to use `navigationUtils.ts` to navigate to a url with `activity=tree` in the querystring parameters.

That is not working. The `navigate` command does not seem to be working.

The `src/e2e/scenarios/monaco-tree-view.feature` describes the user story for this feature.

There is a `e2e/monaco-tree-view.spec.ts` that is supposed to test this feature.

It is not detecting the `activity=tree` in the querystring parameters.