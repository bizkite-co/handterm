Feature: Login persistence and token handling
  Scenario: Login state persists across page refresh
    Given I am on the login page
    When I login with valid credentials
    Then I should see my dashboard
    And my tokens should be stored in localStorage

    When I refresh the page
    Then I should remain logged in
    And my tokens should be refreshed if needed
