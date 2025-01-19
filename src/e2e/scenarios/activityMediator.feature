Feature: Activity Mediator
    The mediator should guid the user to the proper activity depending on `localStorage` state.

Rule: New users are presented with a tutorial

Scenario: A new user is presented with the tutorial mode
    Given the user is new
    Then the user is presented with the tutorial mode

Scenario: An existing user has only completed part of the tutorial
    Given the user has completed part of the tutorial
    Then the user is presented with the the first incomplete tutorial


Rule: Users who have completed the tutorial are presented with normal mode

Scenario: A user executes the `complete` command to complete the tutorial
    Given the user is in the tutorial mode
    When the user executes the `complete` command
    Then the user is presented with the normal mode

Scenario: A user completes the tutorial
    Given the user is in the tutorial mode
    When the user completes the tutorial
    Then the user is presented with the normal mode


Rule: A user can enter Game mode

Scenario: A user executes the `play` command to enter Game mode
    Given the user is in the normal mode
    When the user executes the `play` command
    Then the user is presented with the Game mode