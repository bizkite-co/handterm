---
original file name: Codeium Chat - nis4RSWp6bkGGavNfslRfkErL5tnEzCH.md
summary: The user is rendering character sprites on a `<canvas>` element and wants to trigger a confetti cannon effect to indicate game level success. I provided guidance on integrating the `canvas-confetti` library into their component, including steps to install the package, import it, create a method to trigger the confetti effect, and call the method when the game level is successfully completed.
date: 2024-06-15T22:24
---

# Codeium Chat Conversation

Note: _This is purely the output of the chat conversation and does not contain any raw data, codebase snippets, etc. used to generate the output._

**User** _at 10:24 pm, Jun 15, 2024_

I have a `<canvas>` which I am rendering two character sprites onto.

```tsx
 render() {
  return (
   <>
    <div
     id={TerminalCssClasses.TerminalGame}
     style={{ position: "relative", height: this.props.canvasHeight }}>
     <div
      className="parallax-background">

      {this.state.isTextScrolling && (
       <ScrollingTextLayer
        text={this.state.textToScroll}
        canvasHeight={this.props.canvasHeight} />
      )}
      {this.state.layers.map((layer, index) => (
       <ParallaxLayer
        key={index}
        layer={layer}
        offset={this.state.backgroundOffsetX}
        canvasHeight={this.props.canvasHeight}
       />
      ))}
     </div>
     <canvas
      style={{ position: "absolute", top: 0, left: 0, zIndex: 2 }}
      ref={this.canvasRef}
      width={this.props.canvasWidth}
      height={this.props.canvasHeight}>
     </canvas>
     <Hero
      ref={this.heroRef}
      currentActionType={this.props.heroActionType}
      scale={1.95}
     />
     <Zombie4
      ref={this.zombie4Ref}
      currentActionType={this.props.zombie4ActionType}
      scale={1.90}
     />
    </div>
   </>
  );
 }
```

I want to indicate a game level success by having a confetti cannon go off.

How can I do that?

---

**Codeium** _at 10:25 pm, Jun 15, 2024_

To add a confetti effect on game level success, you can use a third-party library like `canvas-confetti`. Here's a succinct guide on how to integrate it into your existing component:

1. Install the `canvas-confetti` package using npm or yarn:
   ```bash
   npm install canvas-confetti
   # or
   yarn add canvas-confetti
   ```

2. Import `canvas-confetti` at the top of your `TerminalGame.tsx` file:
   ```tsx
   import confetti from 'canvas-confetti';
   ```

3. Create a method in your `TerminalGame` class to trigger the confetti:
   ```tsx
   triggerConfettiCannon() {
     // The confetti function accepts various options to customize the confetti effect
     confetti({
       zIndex: 3, // Ensure it renders above the canvas
       angle: 90,
       spread: 45,
       startVelocity: 45,
       particleCount: 150,
       origin: { y: 0.6 } // Adjust to make it seem like the confetti is coming from the bottom
     });
   }
   ```

4. Call `this.triggerConfettiCannon()` wherever you determine the game level is successfully completed. This might be within an event handler or lifecycle method where you check for level completion conditions.

Here's a simplified example of how you might call it when a level is completed:
```tsx
handleLevelComplete = () => {
  // ...other level complete logic
  this.triggerConfettiCannon();
}
```

Please ensure you've installed `canvas-confetti` and imported it correctly in your `TerminalGame.tsx` file. Adjust the confetti options as needed for the desired visual effect.