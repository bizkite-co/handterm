Feature: Tutorial Progression

Scenario: Initial Tutorial Steps
  Given the user is in the tutorial mode
  When the user types "Enter"
  And the user types "fdsa"
  And the user types "jkl;"
  Then the tutorial should progress successfully
