Feature: Monaco Editor Tree View
  As a user
  I want to navigate files using a terminal-style interface
  So that I can efficiently work with my codebase

  Scenario: Viewing initial tree structure
    Given I have a file tree in localStorage
    When I open the editor
    Then I should see only root files and folders

  Scenario: Navigating the tree
    Given I have a file tree in localStorage
    And I am viewing the tree structure
    When I press 'j'
    Then the cursor should move down
    When I press 'k'
    Then the cursor should move up

 Scenario: Expanding a folder
    Given I have a file tree in localStorage
    And I am viewing the root files and folders
    When I navigate to a folder and press Enter
    Then I should see the folder's contents

  Scenario: Opening a file
    Given I have a file tree in localStorage
    And I am viewing the root files and folders
    When I navigate to a file and press Enter
    Then the file should open in the editor
