# Product Specification

A TUI interface for learning to use a specialized keyboard through typing practice and games.

## Tech Stack

Vite, TypeScript, React, `@xterm/xterm`, HTML 5 canvas. Windows, VS Code, PowerShell.

## Priorities

Robust, expert-level React implementation. Prefer functional components and other modern React best practices.

## Prompt Instructions

* Include background on why each React best practice is chosen and why it might be important.

## Needed Tests

* Typing ASCII shows up in the terminal when it is in focus.
* Typing in the terminal causes the Hero to run.
* The zombie walks to the right and attacks the hero when he gets close.
* Typing `ls phrases` displays a list of phrases that the typist can be tested against.
* `ChordImageHolder` displays a valid hand-chord SVG when the user types the wrong character.