Feature: GitHub Command Navigation
    As a user
    I want to usete `github -t` command to navigate to the tree-view of a GitHub repo.

    Scenario: Navigate to the tree-view of a GitHub repo
        When I run `github -t <repo>`
        Then I should be navigated to the querystring `activity=edit$contentKey={repo}`