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

Feature: Tutorial Command Execution
  As a user in tutorial mode
  I want to execute commands
  So that I can learn and interact with the terminal while progressing through the tutorial

  Scenario: Execute basic command during tutorial
    Given I am in tutorial mode
    When I type the command "help"
    Then I should see the help output
    And the tutorial progress should be maintained

  Scenario: Execute special command during tutorial
    Given I am in tutorial mode
    When I type the command "special"
    Then I should see the special command output
    And the tutorial progress should be maintained

  Scenario: Execute invalid command during tutorial
    Given I am in tutorial mode
    When I type an invalid command "invalidcmd"
    Then I should see an error message
    And the tutorial progress should be maintained

