---
original file name: Codeium Chat - c0kw1RBCsRYTjY5JBcopU8VBladqdn6Z.md
summary: The user wanted to help users use a TUI by providing introductory text until they demonstrated some skills. They planned to use `localStorage` to track progress and achievements non-linearly, needing a React-oriented approach, possibly with a custom hook. 

I suggested creating a custom hook for tracking achievements, utilizing `localStorage`, and updating achievements. For the TUI, I recommended mapping achievements to tutorial components and rendering tutorials based on achievements. 

Later, the user intended to abstract tutorial components, passing variable values to a common `TutorialComponent`. I proposed adjusting the `HandTerm` component to manage tutorial state based on achievements and render the `TutorialComponent` with the appropriate props.
date: 2024-06-20T21:24
---

# Codeium Chat Conversation

Note: _This is purely the output of the chat conversation and does not contain any raw data, codebase snippets, etc. used to generate the output._

**User** _at 9:24 pm, Jun 20, 2024_

I want to help users use my TUI by giving them some interoductory text until they deomonstrate some skills.

I'd like to use localStorage to register some levels of progress, and then update to local storage with levels of acheivement. The achievments might not be linear, so I can't just save the most recent achievement.

I want to make this in a very React oriented way, so it could involve a custom hook.

How can I organize and implement this?

---

**Codeium** _at 9:25 pm, Jun 20, 2024_

To organize and implement a system that tracks user progress and achievements in a TUI using React and localStorage, you can follow these steps:

1. **Define the Achievements**: Create a list of achievements that users can unlock. Each achievement should have a unique identifier.

2. **Create a Custom Hook**: Make a custom React hook that encapsulates the logic for tracking and updating achievements.

3. **Use Local Storage**: Utilize `localStorage` to persist the user's achievements across sessions.

4. **Update Achievements**: Provide functions within the custom hook to update the achievements based on user actions.

Here's a simple implementation of a custom hook for tracking achievements:

```tsx
import { useState, useEffect } from 'react';

// Define a type for the achievement
type Achievement = {
  id: string;
  name: string;
  unlocked: boolean;
};

// Custom hook to manage achievements
function useAchievements(initialAchievements: Achievement[]) {
  // State to hold the achievements
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Load achievements from localStorage on component mount
  useEffect(() => {
    const storedAchievements = localStorage.getItem('achievements');
    if (storedAchievements) {
      setAchievements(JSON.parse(storedAchievements));
    } else {
      setAchievements(initialAchievements);
    }
  }, []);

  // Save achievements to localStorage when they change
  useEffect(() => {
    localStorage.setItem('achievements', JSON.stringify(achievements));
  }, [achievements]);

  // Function to unlock an achievement
  const unlockAchievement = (id: string) => {
    setAchievements((prevAchievements) =>
      prevAchievements.map((ach) =>
        ach.id === id ? { ...ach, unlocked: true } : ach
      )
    );
  };

  return { achievements, unlockAchievement };
}

export default useAchievements;
```

Then, in your component, you can use this hook like so:

```tsx
import React from 'react';
import useAchievements from './useAchievements';

const initialAchievements = [
  { id: 'first-command', name: 'First Command', unlocked: false },
  { id: 'first-game', name: 'First Game', unlocked: false },
  // ... other achievements
];

const HandTerm = () => {
  const { achievements, unlockAchievement } = useAchievements(initialAchievements);

  // Call `unlockAchievement` whenever the user unlocks a new achievement
  // For example, after a user types their first command:
  // unlockAchievement('first-command');

  // Render the TUI and any achievement-related UI here
  return (
    <div>
      {/* Your TUI and other content */}
    </div>
  );
};

export default HandTerm;
```

This approach encapsulates the achievements logic within a custom hook, making it reusable and keeping your components clean. The achievements are saved to `localStorage`, ensuring they persist across sessions. The `unlockAchievement` function provided by the hook allows you to easily mark achievements as unlocked based on user actions within your application.

---

**User** _at 10:11 am, Jun 21, 2024_

That is a good place to start. 

Now, in the `HandTerm`, how should I provide a veriety of content based on the `achievement`?

For instance, I have an `asdf` achievement, and while that is not unlocked I would like to present an brief `asdf` tutorial component. Then, when that achievement is unlocked but the `jkl;` is not unlocked, I would like to present the `jkl;` tutorial component.

What is the best way to organize that in React to accomidate many more tutorial achievements?

---

**Codeium** _at 10:11 am, Jun 21, 2024_

To organize and manage different tutorial components based on user achievements in React, you can use conditional rendering alongside the custom hook you've created for achievements. Here’s how you can structure your `HandTerm` component to render the appropriate tutorial content:

1. **Define Tutorial Components**: Create a separate React component for each tutorial that you want to present to the user.

2. **Map Achievements to Tutorials**: Create a mapping of achievement IDs to their corresponding tutorial components.

3. **Render Based on Achievements**: Use the achievements from the custom hook to determine which tutorial component to render.

Here's what this might look like in practice:

```tsx
import React from 'react';
import useAchievements from './useAchievements';
import AsdfTutorial from './tutorials/AsdfTutorial';
import JklTutorial from './tutorials/JklTutorial';

const initialAchievements = [
  { id: 'asdf', name: 'ASDF Tutorial', unlocked: false },
  { id: 'jkl;', name: 'JKL; Tutorial', unlocked: false },
  // ... other achievements
];

const tutorials = {
  'asdf': AsdfTutorial,
  'jkl;': JklTutorial,
  // ... other tutorial components
};

const HandTerm = () => {
  const { achievements, unlockAchievement } = useAchievements(initialAchievements);

  // Determine which tutorial to show based on achievements
  const currentTutorialId = Object.keys(tutorials).find(
    (tutorialId) => !achievements.find((ach) => ach.id === tutorialId && ach.unlocked)
  );
  const TutorialComponent = tutorials[currentTutorialId];

  return (
    <div>
      {TutorialComponent && <TutorialComponent unlockAchievement={unlockAchievement} />}
      {/* Rest of your TUI */}
    </div>
  );
};

export default HandTerm;
```

In this setup, you:

- Define a `tutorials` object that maps achievement IDs to their corresponding tutorial components.
- Determine the current tutorial by finding the first tutorial whose corresponding achievement has not been unlocked.
- Conditionally render the `TutorialComponent` if it exists, passing `unlockAchievement` as a prop so the tutorial can unlock the achievement when completed.

This approach provides a clear separation between the tutorial content and the logic for tracking achievements. It also scales well as you can simply add new tutorial components and their corresponding achievements to the `tutorials` object and `initialAchievements` array as needed.

---

**User** _at 11:50 am, Jun 21, 2024_

My `HandTerm` is till a class component. I haven't been able to convert it to a functional component yet.

---

**Codeium** _at 11:50 am, Jun 21, 2024_

Given that `HandTerm` is a class component, you can adapt the previous solution accordingly. Since hooks can't be used directly in class components, you'll need to manage the state and lifecycle methods manually. Here's how you can implement the behavior for showing tutorials based on achievements:

1. Define tutorial components as before.
2. Create a method in `HandTerm` to check achievements and determine which tutorial to show.
3. Use the component's state to track which tutorial is currently active.
4. Update the achievement state in `localStorage` and the component's state when an achievement is unlocked.

Here's an example of how you could implement this in `HandTerm`:

```tsx
import React from 'react';
import AsdfTutorial from './tutorials/AsdfTutorial';
import JklTutorial from './tutorials/JklTutorial';

// Define a mapping from achievement IDs to tutorial components
const tutorialComponents = {
  asdf: AsdfTutorial,
  'jkl;': JklTutorial,
  // ... other mappings
};

class HandTerm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      achievements: this.loadAchievements(),
      currentTutorialId: null,
    };
  }

  componentDidMount() {
    this.setState({
      currentTutorialId: this.determineCurrentTutorial(),
    });
  }

  loadAchievements() {
    const storedAchievements = localStorage.getItem('achievements');
    return storedAchievements ? JSON.parse(storedAchievements) : [];
  }

  saveAchievements(achievements) {
    localStorage.setItem('achievements', JSON.stringify(achievements));
  }

  determineCurrentTutorial() {
    const { achievements } = this.state;
    for (const [id, Component] of Object.entries(tutorialComponents)) {
      const achievement = achievements.find((ach) => ach.id === id);
      if (!achievement || !achievement.unlocked) {
        return id;
      }
    }
    return null; // No more tutorials to show
  }

  unlockAchievement = (id) => {
    this.setState((prevState) => {
      const updatedAchievements = prevState.achievements.map((ach) =>
        ach.id === id ? { ...ach, unlocked: true } : ach
      );
      // Save the updated achievements to localStorage
      this.saveAchievements(updatedAchievements);
      return {
        achievements: updatedAchievements,
        currentTutorialId: this.determineCurrentTutorial(),
      };
    });
  };

  renderTutorial() {
    const TutorialComponent = tutorialComponents[this.state.currentTutorialId];
    if (TutorialComponent) {
      return <TutorialComponent unlockAchievement={this.unlockAchievement} />;
    }
    return null;
  }

  render() {
    return (
      <div>
        {this.renderTutorial()}
        {/* Rest of your TUI */}
      </div>
    );
  }
}

export default HandTerm;
```

In this `HandTerm` class component:

- We load the achievements from `localStorage` in the `loadAchievements` method and initialize the state with them in the constructor.
- We determine the current tutorial based on the achievements in `determineCurrentTutorial`.
- We unlock an achievement and update both the local state and `localStorage` in `unlockAchievement`.
- We conditionally render the current tutorial in the `renderTutorial` method.

This approach allows you to manage the tutorial state within the `HandTerm` class component while still keeping the tutorial logic separate from the main TUI logic.

---

**User** _at 11:58 am, Jun 21, 2024_

Instead of having a different component for eacy Tutorial, I was intending to have this abstraction which I can pass in the variable values:

```tsx
// TutorialComponent.tsx
import { ChordDisplay } from "./ChordDisplay";
import { Chord } from "../types/Types";

export interface ITutorialComponentProps {
  unlockAchievement: (id: string) => {};
  characters: Chord[];
  prompt: string;
  isInTutorial: boolean;
}

export function TutorialComponent(props: any) {
  return (
    <div
      className="tutorial-component"
      hidden={!props.isInTutorial}
    >
      <pre>{props.prompt}</pre>
      <div className="chord-display-container">
        {
          props.characters.map((character: Chord, index: number) => {
            return <ChordDisplay
              key={index}
              displayChar={character.key}
              displayCharCode={character.chordCode}
            />
          })
        }
      </div>
    </div>
  );
}
```

---

**Codeium** _at 11:58 am, Jun 21, 2024_

Given that you have a common `TutorialComponent` that you'd like to use for different tutorials by passing variable values, you'll want to adjust the `HandTerm` class component to manage the state of which tutorial to show based on the current achievement, and then render the `TutorialComponent` with the appropriate props.

Here's how you could update the `HandTerm` component to work with this approach:

```tsx
import React from 'react';
import { TutorialComponent } from './TutorialComponent';
import { Chord } from '../types/Types';

// Define your tutorials as data
const tutorials = [
  {
    id: 'asdf',
    prompt: 'Type `asdf` to unlock',
    characters: [/*...Chord objects for asdf...*/],
    unlocked: false,
  },
  {
    id: 'jkl;',
    prompt: 'Type `jkl;` to unlock',
    characters: [/*...Chord objects for jkl;...*/],
    unlocked: false,
  },
  // ... other tutorials
];

class HandTerm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      achievements: this.loadAchievements(),
      currentTutorial: null,
    };
  }

  componentDidMount() {
    this.setState({
      currentTutorial: this.determineCurrentTutorial(),
    });
  }

  loadAchievements() {
    const storedAchievements = localStorage.getItem('achievements');
    return storedAchievements ? JSON.parse(storedAchievements) : tutorials;
  }

  saveAchievements(achievements) {
    localStorage.setItem('achievements', JSON.stringify(achievements));
  }

  determineCurrentTutorial() {
    const { achievements } = this.state;
    return achievements.find((tutorial) => !tutorial.unlocked) || null;
  }

  unlockAchievement = (id) => {
    this.setState((prevState) => {
      const updatedAchievements = prevState.achievements.map((tutorial) =>
        tutorial.id === id ? { ...tutorial, unlocked: true } : tutorial
      );
      this.saveAchievements(updatedAchievements);
      return {
        achievements: updatedAchievements,
        currentTutorial: this.determineCurrentTutorial(),
      };
    });
  };

  render() {
    const { currentTutorial } = this.state;
    
    return (
      <div>
        {currentTutorial && (
          <TutorialComponent
            unlockAchievement={this.unlockAchievement}
            characters={currentTutorial.characters}
            prompt={currentTutorial.prompt}
            isInTutorial={true}
          />
        )}
        {/* Rest of your TUI */}
      </div>
    );
  }
}

export default HandTerm;
```

In this updated `HandTerm` component:

- Tutorials are defined as an array of objects with `id`, `prompt`, `characters`, and `unlocked` properties.
- The `loadAchievements` method initializes the achievements state with the tutorials data if it's not found in `localStorage`.
- The `determineCurrentTutorial` method finds the first tutorial that has not been unlocked.
- The `unlockAchievement` method is updated to modify the tutorial's `unlocked` state and the current tutorial.
- The `render` method conditionally includes `TutorialComponent` with the props from the current tutorial, if there is one to show.

This approach allows you to manage multiple tutorials with a single component, using the state to track which tutorial's data to pass to `TutorialComponent`.