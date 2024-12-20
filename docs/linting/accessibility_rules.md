## Accessibility Rules

Accessibility (a11y) is crucial for creating web applications that are usable by everyone, including people with disabilities. These rules help ensure that your React components meet web accessibility standards.

### Overview

Accessibility rules enforce best practices for creating inclusive web interfaces. They help developers:
- Provide alternative text for images
- Ensure keyboard navigability
- Create semantic HTML
- Improve screen reader compatibility

### `jsx-a11y/anchor-is-valid`

-   **Current Setting:** `'error'`
-   **Rationale:** Ensures that `<a>` (anchor) elements are used correctly and have valid `href` attributes or appropriate interactive roles.
-   **Why This Matters:**
    - Prevents creating non-functional or misleading links
    - Ensures proper keyboard navigation
    - Improves screen reader compatibility
-   **AirBNB:** Also enabled.
-   **Recommendation:** Keep this rule as is.
-   **Examples:**

```jsx
// BAD: Anchor without href
function BadLink() {
  return <a onClick={handleClick}>Click me</a>; // ❌ No href or role
}

// GOOD: Anchor with href
function GoodLink() {
  return <a href="/page">Go to page</a>; // ✅ Valid href
}

// GOOD: Anchor with role for custom interactions
function CustomLink() {
  return (
    <a
      href="#"
      role="button"
      onClick={handleClick}
    >
      Custom Action
    </a>
  ); // ✅ Explicit role and href
}
```

### `jsx-a11y/media-has-caption`

-   **Current Setting:** `'error'`
-   **Rationale:** Requires `<video>` and `<audio>` elements to have `<track>` elements with captions.
-   **Why This Matters:**
    - Provides text alternatives for audio/video content
    - Helps deaf or hard-of-hearing users understand media
    - Improves overall content accessibility
-   **AirBNB:** Also enabled.
-   **Recommendation:** Keep this rule as is.
-   **Examples:**

```jsx
// BAD: Video without captions
function BadVideo() {
  return <video src="video.mp4" />; // ❌ No captions
}

// GOOD: Video with captions
function GoodVideo() {
  return (
    <video src="video.mp4">
      <track
        kind="captions"
        src="captions.vtt"
        srcLang="en"
        label="English"
      />
    </video>
  ); // ✅ Captions provided
}
```

### `jsx-a11y/click-events-have-key-events`

-   **Current Setting:** `'error'`
-   **Rationale:** Ensures that elements with click events also have corresponding keyboard events.
-   **Why This Matters:**
    - Allows keyboard-only users to interact with elements
    - Improves navigation for users who can't use a mouse
    - Ensures all interactive elements are fully accessible
-   **AirBNB:** Also enabled.
-   **Recommendation:** Keep this rule as is.
-   **Examples:**

```jsx
// BAD: Clickable div without keyboard events
function BadInteractiveDiv() {
  return (
    <div
      onClick={handleClick}
      role="button"
    >
      Click me
    </div>
  ); // ❌ No onKeyDown or onKeyPress
}

// GOOD: Div with click and keyboard events
function GoodInteractiveDiv() {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyPress}
      role="button"
      tabIndex={0}
    >
      Click me
    </div>
  ); // ✅ Keyboard and click events
}
```

### `jsx-a11y/no-noninteractive-element-interactions`

-   **Current Setting:** `'error'`
-   **Rationale:** Prevents adding interactive event handlers to non-interactive HTML elements.
-   **Why This Matters:**
    - Maintains semantic HTML structure
    - Prevents unexpected behavior for assistive technologies
    - Encourages using appropriate interactive elements
-   **AirBNB:** Also enabled.
-   **Recommendation:** Keep this rule as is.
-   **Examples:**

```jsx
// BAD: Adding click to non-interactive paragraph
function BadParagraph() {
  return (
    <p
      onClick={handleClick}
      role="button"
    >
      Clickable text
    </p>
  ); // ❌ Paragraph used as a button
}

// GOOD: Using semantic interactive element
function GoodButton() {
  return (
    <button onClick={handleClick}>
      Click me
    </button>
  ); // ✅ Proper interactive element
}

// GOOD: If you must use a non-interactive element
function ComplexInteraction() {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleClick();
      }}
    >
      Complex interaction
    </div>
  ); // ✅ Explicitly defined interactive behavior
}
```

### Best Practices and Recommendations

1. **Use Semantic HTML**
   - Choose the right HTML elements for their intended purpose
   - `<button>` for buttons, `<a>` for links, etc.

2. **Provide Alternative Text**
   - Always include `alt` text for images
   - Use `aria-label` or `aria-labelledby` for complex components

3. **Keyboard Navigation**
   - Ensure all interactive elements are keyboard-accessible
   - Use `tabIndex` appropriately
   - Implement keyboard event handlers

4. **Test with Assistive Technologies**
   - Use screen readers to verify accessibility
   - Consider automated accessibility testing tools

### Conclusion

Accessibility rules are not just about compliance, but about creating inclusive web experiences. By following these guidelines, you ensure that your application is usable by the widest possible range of users, regardless of their abilities or the devices they use.
