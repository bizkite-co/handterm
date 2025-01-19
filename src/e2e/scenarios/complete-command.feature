Feature: Complete Command
    As a user
    I want to use the `complete` command to set the tutorial state to complete and exit the tutorial

    Scenario: Complete the tutorial
        Given I am on the tutorial page
        When I enter the `complete` command
        Then I should see the tutorial complete message
        And I should be on the home page without any Tutorial or Game showing.
