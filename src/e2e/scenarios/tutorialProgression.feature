Feature: Tutorial Progression
  New users are presented with a tutorial
  The tutorial presents a set of characters and their key-chord glyphs
  The user types the characters and then plays a shot game involving the characters
  New characters are presented

Rule: New users are presented with a tutorial

  Scenario: Tutorial Progression with Multiple Checks
    Given the user is in the tutorial mode
    When the user presses Enter
    And the user types "fdsa"
    And the user presses Enter
    And the user types "jkl;"
    And the user presses Enter
    Then the game mode should be visible and the tutorial mode should not be visible
    And the user is presented with a Game phrase
    When the user types "all sad lads ask dad; alas fads fall"
    Then the tutorial mode should be visible and the game mode should not be visible
