Feature: Monaco Editor Tree View
  As a user
  I want to navigate files using a terminal-style interface
  So that I can efficiently work with my codebase

  Background:
    Given I have a file tree in localStorage
    And the editor is configured to show only one level at a time

  Scenario: Viewing initial tree structure
    When I open the editor
    Then I should see only root files and folders
    And I should not see any nested children
    And the display should have no indentation

  Scenario: Navigating the tree
    Given I am viewing the current level
    When I press 'j'
    Then the cursor should move down
    When I press 'k'
    Then the cursor should move up

  Scenario: Expanding a folder
    Given I am viewing the current level
    When I navigate to a folder and press Enter
    Then I should see only the folder's direct contents
    And the previous level should be hidden

  Scenario: Opening a file
    Given I am viewing the current level
    When I navigate to a file and press Enter
    Then the file should open in the editor
    And the tree view should remain at the current level
