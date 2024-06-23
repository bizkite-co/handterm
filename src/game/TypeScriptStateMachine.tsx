/*
In this example, we have a simple state machine for a game with states like Idle, Running, Paused, and Stopped. We define possible actions that cause state transitions, such as Start, Pause, Resume, and Stop. The StateMachine class handles these transitions and changes the current state accordingly.

Of course, this is a basic example. Real-world applications might involve more complex state machines with more states, more actions, and additional logic to handle complex transitions. You can also use libraries like XState to handle complex state machines with hierarchical states, parallel states, and more.
*/

// Define the possible states as an enum
enum State {
  Idle,
  Running,
  Paused,
  Stopped,
}

// Define the possible actions as an enum
enum Action {
  Start,
  Pause,
  Resume,
  Stop,
}

// Define the state machine class
class StateMachine {
  private currentState: State;

  constructor(initialState: State) {
    this.currentState = initialState;
  }

  // Transition function that takes an action and transitions the state accordingly
  transition(action: Action): void {
    switch (this.currentState) {
      case State.Idle:
        if (action === Action.Start) {
          this.currentState = State.Running;
        }
        break;
      case State.Running:
        if (action === Action.Pause) {
          this.currentState = State.Paused;
        } else if (action === Action.Stop) {
          this.currentState = State.Stopped;
        }
        break;
      case State.Paused:
        if (action === Action.Resume) {
          this.currentState = State.Running;
        } else if (action === Action.Stop) {
          this.currentState = State.Stopped;
        }
        break;
      case State.Stopped:
        // No transitions out of Stopped state in this simple example
        break;
    }
  }

  // Getter for the current state
  getState(): State {
    return this.currentState;
  }
}

// Usage
const stateMachine = new StateMachine(State.Idle);
stateMachine.transition(Action.Start); // Transitions to Running state
stateMachine.transition(Action.Pause); // Transitions to Paused state
stateMachine.transition(Action.Resume); // Transitions back to Running state
stateMachine.transition(Action.Stop); // Transitions to Stopped state