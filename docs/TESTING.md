# Testing Documentation

## Overview
This document provides comprehensive guidance on running unit tests, integration tests, and generating code coverage reports for the esudelib application.

## Test Structure

```
tests/
├── Unit/                    # Unit tests (isolated component testing)
│   ├── Services/           # Service layer tests
│   ├── Controllers/        # Controller tests
│   └── Modules/            # Module-specific tests
├── Feature/                # Integration tests (end-to-end workflows)
│   ├── Auth/              # Authentication flows
│   ├── Payment/           # Payment processing
│   ├── Student/           # Student workflows
│   ├── Teacher/           # Teacher workflows
│   └── Jury/              # Jury workflows
├── Performance/           # JMeter load tests
└── coverage/              # Code coverage reports (generated)
```

## Running Tests

### All Tests
```bash
# Run all tests
php artisan test

# Run with verbose output
php artisan test --verbose

# Run with parallel execution (faster)
php artisan test --parallel
```

### Unit Tests Only
```bash
php artisan test --testsuite=Unit

# Specific test file
php artisan test tests/Unit/Services/NotificationServiceTest.php

# Specific test method
php artisan test --filter test_student_notifications_with_pending_appeals
```

### Integration Tests Only
```bash
php artisan test --testsuite=Feature

# Specific feature test
php artisan test tests/Feature/Auth/AuthenticationFlowTest.php
```

### By Group/Tag
```bash
# Run tests with specific group
php artisan test --group=payment

# Exclude specific group
php artisan test --exclude-group=slow
```

## Code Coverage

### Generate Coverage Report
```bash
# Generate coverage with 90% minimum requirement
php artisan test --coverage --min=90

# Generate HTML coverage report
php artisan test --coverage-html tests/coverage

# Generate multiple formats
php artisan test \
  --coverage-text \
  --coverage-html tests/coverage \
  --coverage-clover coverage.xml \
  --min=90
```

### View Coverage Report
```bash
# Open HTML report in browser
open tests/coverage/index.html

# Or on Windows
start tests/coverage/index.html

# Or on Linux
xdg-open tests/coverage/index.html
```

### Coverage Targets
- **Overall**: 90% minimum
- **Services**: 95%+ (critical business logic)
- **Controllers**: 85%+
- **Models**: 80%+

## Writing Tests

### Unit Test Example
```php
<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\YourService;

class YourServiceTest extends TestCase
{
    /**
     * Test description following clean code principles
     *
     * @return void
     */
    public function test_method_does_something_correctly(): void
    {
        // Arrange: Set up test data and dependencies
        $service = new YourService();
        $input = 'test data';

        // Act: Execute the method being tested
        $result = $service->yourMethod($input);

        // Assert: Verify the expected outcome
        $this->assertEquals('expected result', $result);
    }
}
```

### Integration Test Example
```php
<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;

class YourFeatureTest extends TestCase
{
    /**
     * Test complete workflow
     *
     * @return void
     */
    public function test_user_can_complete_workflow(): void
    {
        // Arrange
        $user = $this->authenticateAsStudent();

        // Act
        $response = $this->post('/api/endpoint', [
            'data' => 'value'
        ]);

        // Assert
        $response->assertStatus(200);
        $this->assertDatabaseHas('table', [
            'field' => 'value'
        ]);
    }
}
```

## Test Helpers

### Authentication Helpers
```php
// Authenticate as specific role
$user = $this->authenticateAs('Super Admin');
$user = $this->authenticateAsStudent();
$user = $this->authenticateAsTeacher();
$user = $this->authenticateAsAdmin();
```

### HTTP Mocking
```php
// Mock external HTTP service
$this->mockHttpService(
    'https://api.example.com/endpoint',
    ['success' => true, 'data' => []],
    200
);
```

### File Upload Testing
```php
// Create test file
$file = $this->createTestFile('document.pdf', 'application/pdf');

$response = $this->post('/api/upload', [
    'file' => $file
]);
```

### Custom Assertions
```php
// Assert successful JSON response
$this->assertSuccessfulJsonResponse($response, 200);

// Assert error JSON response
$this->assertErrorJsonResponse($response, 400);

// Assert JSON structure matches
$this->assertJsonStructureMatches($response->json(), ['id', 'name', 'email']);
```

## Best Practices

### 1. Test Naming
```php
// ✅ Good: Descriptive, follows pattern
public function test_student_can_view_their_grades(): void

// ❌ Bad: Vague, unclear intent
public function test_grades(): void
```

### 2. Arrange-Act-Assert Pattern
```php
public function test_payment_processing(): void
{
    // Arrange: Setup
    $student = Student::factory()->create();
    $amount = 1000;

    // Act: Execute
    $result = $this->paymentService->process($student, $amount);

    // Assert: Verify
    $this->assertTrue($result['success']);
    $this->assertDatabaseHas('payments', [
        'student_id' => $student->id,
        'amount' => $amount
    ]);
}
```

### 3. One Assertion Per Test (when possible)
```php
// ✅ Good: Focused test
public function test_creates_student_with_correct_name(): void
{
    $student = Student::factory()->create(['name' => 'John Doe']);
    $this->assertEquals('John Doe', $student->name);
}

public function test_creates_student_with_correct_email(): void
{
    $student = Student::factory()->create(['email' => 'john@example.com']);
    $this->assertEquals('john@example.com', $student->email);
}
```

### 4. Use Factories
```php
// ✅ Good: Use factories for test data
$student = Student::factory()->create();
$students = Student::factory()->count(10)->create();

// ❌ Bad: Manual data creation
$student = new Student();
$student->name = 'Test';
$student->email = 'test@example.com';
$student->save();
```

### 5. Test Edge Cases
```php
public function test_handles_empty_input(): void
public function test_handles_null_value(): void
public function test_handles_invalid_data(): void
public function test_handles_large_dataset(): void
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          coverage: pcov
      
      - name: Install Dependencies
        run: composer install
      
      - name: Run Tests
        run: php artisan test --coverage --min=90
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v2
        with:
          files: ./coverage.xml
```

## Debugging Tests

### Run Single Test with Debug
```bash
# With verbose output
php artisan test --filter test_name --verbose

# With debug information
php artisan test --filter test_name --debug
```

### Using dd() and dump()
```php
public function test_something(): void
{
    $result = $this->service->method();
    
    // Debug output
    dd($result); // Die and dump
    dump($result); // Dump and continue
}
```

### Database Inspection
```php
public function test_creates_record(): void
{
    $this->service->create(['name' => 'Test']);
    
    // Inspect database
    $this->assertDatabaseCount('table', 1);
    $this->assertDatabaseHas('table', ['name' => 'Test']);
    $this->assertDatabaseMissing('table', ['name' => 'Other']);
}
```

## Performance Testing

See [Performance Testing Guide](../Performance/README.md) for JMeter load testing documentation.

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```bash
# Ensure test database is configured
php artisan config:clear
php artisan test
```

#### 2. Memory Limit Exceeded
```bash
# Increase PHP memory limit
php -d memory_limit=512M artisan test
```

#### 3. Slow Tests
```bash
# Run tests in parallel
php artisan test --parallel

# Profile slow tests
php artisan test --profile
```

#### 4. Coverage Not Generated
```bash
# Install pcov extension
pecl install pcov

# Or use xdebug
pecl install xdebug
```

## Code Quality Metrics

### PHPStan (Static Analysis)
```bash
vendor/bin/phpstan analyse app tests --level=5
```

### PHP CS Fixer (Code Style)
```bash
vendor/bin/php-cs-fixer fix app
vendor/bin/php-cs-fixer fix tests
```

### Complexity Analysis
```bash
vendor/bin/phpmetrics --report-html=metrics app
```

## Resources

- [PHPUnit Documentation](https://phpunit.de/documentation.html)
- [Laravel Testing](https://laravel.com/docs/testing)
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
- [Clean Code Testing Principles](https://clean-code-developer.com/)

## Support

For testing questions or issues:
1. Check this documentation
2. Review existing test examples in the codebase
3. Consult the team's testing guidelines
4. Contact the QA team
