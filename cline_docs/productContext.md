# Product Context

## Why This Project Exists

Handterm is a web-based TUI (Text User Interface) that exists to provide a training interface to new users of the Handex one-handed walkable keyboard replacement. It provides a tutorial, a text-typing game, and some file editing features to help users learn the Handex.

## Problems It Solves

The problem of using a new keyboard that doesn't look anything like a keyboard, and so has a bit of a steep learning curve, but that can be used anywhere, including mobile devices.

## How It Should Work

The user is put into tutorial mode when they first visit the site, but they can also type `login <username>` even in the tutorial, and then they will be asked for their password. There is also a hidden `bypass` command.

User WPM is stored to `localStorage` at all times, and the can print the report to the terminal.

The tutorial and gameplay swap every few phrases to allow the user to learn characters.
