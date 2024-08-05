# Product Specification

A TUI interface for learning to use a specialized keyboard through typing practice and games.

## Tech Stack

Vite, TypeScript, React, `@xterm/xterm`, HTML 5 canvas. Windows, VS Code, PowerShell.

## Priorities

* Robust, expert-level React implementation. 
* Prefer functional components and other modern React best practices.
* Vim integration for file editing.

## Prompt Instructions

* Include background on why each React best practice is chosen and why it might be important.

## Game Play

* [ ] If players test high WPM on the basics, they progress past basic training.
    * [ ] If they test successfully on a random word on the "asdfjkl;" row, for instance, they don't have to do home row training.
    * [ ] This should work as a game logic simplifier, not complexifier. Only do it if there's an easy way.
    * [ ] This might reduce the need for logins and complex progress tracking. Just use fast-basics testing to retest everyone on the basics anyway.
* [ ] Tutorial mode could start with `asdf` and SVGs, maybe.
    * [ ] "Press the Handex thumb-tip for a tutorial"
    * [ ] Show "f" and "backspace" SVGs and explain that the thumb-tip is "Enter" and the thumb-grasp is "Spacebar".
    * [ ] Give a short display of the SVG hand syntax.
    * [ ] Show the `fdsa` SVGs.
    * [ ] Show the `jkl;` SVGs.

## Needed Tests

* Typing ASCII shows up in the terminal when it is in focus.
* Typing in the terminal causes the Hero to run.
* The zombie walks to the right and attacks the hero when he gets close.
* Typing `ls phrases` displays a list of phrases that the typist can be tested against.
* `ChordImageHolder` displays a valid hand-chord SVG when the user types the wrong character.

## Current Issues

* [ ] Can't resize canvas.
* [X] ~~*Doesn't scroll to bottom.*~~ [2024-08-05]