Feature: WebContainer Mode Switching

  Scenario: Switching to WebContainer mode and back to normal mode
    Given I am on the Handterm page
    When I enter the command "wc-init"
    Then the URL should contain "?activity=webcontainer"
    And the WebContainer should be initialized
    When I enter the command "wc-exit"
    Then the URL should contain "?activity=normal"
    And the WebContainer should be torn down

  Scenario: Existing commands work in both modes
    Given I am on the Handterm page
    When I enter the command "ls"
    Then I should see the output of the "ls" command
    When I enter the command "wc-init"
    And I enter the command "ls"
    Then I should see the output of the "ls" command
    When I enter the command "wc-exit"
    And I enter the command "ls"
    Then I should see the output of the "ls" command