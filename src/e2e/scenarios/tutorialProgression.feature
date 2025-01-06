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

  Scenario: Command execution updates tutorial state
    Given I am in tutorial mode
    When I successfully execute a command
    Then the tutorial state should be updated
    And the command history should include the executed command

  Scenario: Command output formatting during tutorial
    Given I am in tutorial mode
    When I execute any valid command
    Then the output should be formatted according to tutorial guidelines
    And the output should include tutorial-specific context

  Scenario: Command execution timing during tutorial
    Given I am in tutorial mode
    When I execute a command
    Then the command execution time should be recorded
    And the timing should be displayed in the tutorial output

  Scenario: Command execution with empty input
    Given I am in tutorial mode
    When I press enter without typing a command
    Then I should see a prompt for input
    And the tutorial progress should not change

  Scenario: Command execution with whitespace input
    Given I am in tutorial mode
    When I type only whitespace characters
    Then I should see a prompt for valid input
    And the tutorial progress should not change

  Scenario: Command execution with partial match
    Given I am in tutorial mode
    When I type a partial command match
    Then I should see suggestions for matching commands
    And the tutorial progress should be maintained
