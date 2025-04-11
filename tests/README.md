# CafeThu6 Tests

This directory contains automated tests for the CafeThu6 application using the Jasmine testing framework.

## Test Structure

The tests are organized to match the structure of the main application:

- `tests/models/` - Tests for data models (Expense, FundTransaction)
- `tests/controllers/` - Tests for controllers (ExpenseManager, etc.)
- `tests/utils/` - Tests for utility functions

## Running the Tests

To run the tests:

1. Start your local web server (using Python or any other method)
2. Open the test runner in your browser:
   ```
   http://localhost:8000/tests/SpecRunner.html
   ```

## Adding New Tests

When adding new features to the application, create corresponding tests:

1. Add test files in the appropriate directory (models, controllers, utils)
2. Import the modules you need to test
3. Add your test specs using Jasmine's `describe()` and `it()` syntax
4. Include the new test file in `SpecRunner.html`

## Testing Approach

- **Unit Tests**: Each component is tested in isolation
- **Mocks**: External dependencies are mocked to ensure tests are isolated
- **State Management**: The test environment is reset between tests

## Test Coverage

Current test coverage includes:

- Models
  - Expense
  - FundTransaction
- Controllers
  - ExpenseManager
- Utils
  - Helper functions

Future improvements should include more controller tests and integration tests. 