Feature: Edit Command
    As a user
    I want to use the `edit` command to open files for editing
    So I can modify file contents

    Background:
        Given that I have completed the tutorial
        Or that I have run the `complete` command

    Scenario: Edit default file
        When I run `edit`
        Then I should be navigated to edit activity with contentKey "_index.md"

    Scenario: Edit specific file
        When I run `edit myfile.md`
        Then I should be navigated to edit activity with contentKey "myfile.md"

    Scenario: Invalid edit command
        When I run `editt`
        Then I should receive an error message "Edit command not recognized"
