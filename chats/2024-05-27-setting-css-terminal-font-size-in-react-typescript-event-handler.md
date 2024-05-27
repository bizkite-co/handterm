---
original file name: Codeium Chat - MQzndUfGQO6DZzn1qywiEeb8GrXw5U1m.md
summary: The user is asking how to set the CSS `:root { --terminal-font-size }` property from a TypeScript event handler function. The user shares a code snippet showing a touch event handler in React that resizes the font size. The assistant provides guidance on accessing the root style and setting the custom property `--terminal-font-size` within the `handleTouchMove` function to achieve the desired font resizing behavior.
date: 2024-05-27T11:21
---

# Codeium Chat Conversation

Note: _This is purely the output of the chat conversation and does not contain any raw data, codebase snippets, etc. used to generate the output._

**User** _at 11:21 am, May 27, 2024_

This is also supposed to set the CSS `:root { --terminal-font-size }` 

```tsx
 private handleTouchMove: TouchEventHandler<HTMLDivElement> = (event: React.TouchEvent<HTMLDivElement>) => {
  if (event.touches.length === 2) {
   // event.preventDefault();
   const currentDistance = this.getDistanceBetweenTouches(event.touches);
   if (this.lastTouchDistance) {
    const scaleFactor = currentDistance / this.lastTouchDistance;
    this.currentFontSize *= scaleFactor;
    // TODO: Figure out how to resize fonts now with REact.
    // this.terminalElement.style.fontSize = `${this.currentFontSize}px`;
    this.lastTouchDistance = currentDistance;
    this.terminal.options.fontSize = this.currentFontSize;
    this.terminal.refresh(0, this.terminal.rows - 1); // Refresh the terminal display
   }
  }
 }
```

How can I do that?

---

**Codeium** _at 11:21 am, May 27, 2024_

To set the CSS `:root { --terminal-font-size }` property from your `handleTouchMove` event handler in TypeScript, you'll need to access the root style through the `document.documentElement` and set the `--terminal-font-size` variable. Here’s how you can modify the `handleTouchMove` function:

```tsx
private handleTouchMove: TouchEventHandler<HTMLDivElement> = (event: React.TouchEvent<HTMLDivElement>) => {
  if (event.touches.length === 2) {
    // event.preventDefault();
    const currentDistance = this.getDistanceBetweenTouches(event.touches);
    if (this.lastTouchDistance) {
      const scaleFactor = currentDistance / this.lastTouchDistance;
      this.currentFontSize *= scaleFactor;
      // Update the --terminal-font-size custom property
      document.documentElement.style.setProperty('--terminal-font-size', `${this.currentFontSize}px`);
      this.lastTouchDistance = currentDistance;
      this.terminal.options.fontSize = this.currentFontSize;
      this.terminal.refresh(0, this.terminal.rows - 1); // Refresh the terminal display
    }
  }
}
```

This code updates the `--terminal-font-size` custom property whenever the `handleTouchMove` event is triggered with two touch points, effectively resizing the font based on the touch movement.