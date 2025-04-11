# CafeThu6 End-to-End Tests

This directory contains end-to-end tests for the CafeThu6 application. These tests simulate real user flows and interactions with the application to verify that critical features work correctly.

## Test Structure

The tests are organized by feature area:

- `expense-flow-test.js` - Tests for expense management functionality
- `group-fund-flow-test.js` - Tests for group fund management
- `member-flow-test.js` - Tests for member management
- `test-helpers.js` - Helper functions for interacting with the application

## Running the Tests

To run the end-to-end tests:

1. Start your local web server (using Python or any other method)
2. Open the E2E test runner in your browser:
   ```
   http://localhost:8000/e2e-tests/index.html
   ```
3. Click the "Run All Tests" button or select a specific test category from the dropdown
4. Check "Show application during tests" if you want to see the application as the tests run

## How the Tests Work

These tests use a browser-based testing approach:

1. The application is loaded in an iframe
2. Test code interacts with the application through the iframe
3. Tests validate application behavior by checking DOM elements, content, and state

Each test starts with a clean application state, adding test data as needed.

## Adding New Tests

When extending the application with new features, add corresponding end-to-end tests:

1. Create a new test file or extend an existing one
2. Import the helper functions from `test-helpers.js`
3. Use the helper functions to interact with the application
4. Write assertions to verify expected behavior

## Critical Flows Tested

The tests cover the following critical user flows:

1. **Expense Management:**
   - Adding a new expense with equal split
   - Adding an expense with custom split amounts
   - Editing an existing expense
   - Deleting an expense
   - Validating expense settlement calculations

2. **Group Fund Management:**
   - Adding deposits to the group fund
   - Using the group fund to pay for expenses
   - Tracking fund transactions and balances
   - Visualizing fund distribution

3. **Member Management:**
   - Adding new members
   - Editing member information
   - Removing members
   - Validating member data

## Test Implementation Details

- Tests use Mocha as the test framework and Chai for assertions
- The application interacts with the iframe using standard DOM APIs
- Asynchronous operations use `async/await` for better readability 