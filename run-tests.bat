@echo off
REM Test Execution Script for esudelib Application (Windows)
REM This script runs all tests and generates coverage reports

echo =========================================
echo esudelib Testing Suite
echo Target: 90%% Code Coverage
echo =========================================
echo.

echo Step 1: Clearing caches...
php artisan config:clear
php artisan cache:clear
echo [OK] Caches cleared
echo.

echo Step 2: Running Unit Tests...
php artisan test --testsuite=Unit --stop-on-failure
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Unit tests failed
    exit /b 1
)
echo [OK] Unit tests passed
echo.

echo Step 3: Running Integration Tests...
php artisan test --testsuite=Feature --stop-on-failure
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Integration tests failed
    exit /b 1
)
echo [OK] Integration tests passed
echo.

echo Step 4: Generating Code Coverage Report...
php artisan test --coverage --coverage-html tests/coverage --coverage-clover tests/coverage/clover.xml --coverage-text --min=90
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Code coverage below 90%%
    echo Please review coverage report: tests\coverage\index.html
    exit /b 1
)
echo [OK] Code coverage meets 90%% requirement
echo.

echo Step 5: Generating Test Documentation...
php artisan test --coverage-html tests/coverage --testdox-html tests/results/testdox.html
echo [OK] Test documentation generated
echo.

echo =========================================
echo All Tests Passed Successfully!
echo =========================================
echo.
echo Coverage Report: tests\coverage\index.html
echo Test Documentation: tests\results\testdox.html
echo.
echo To view coverage report:
echo   start tests\coverage\index.html
echo.

pause
