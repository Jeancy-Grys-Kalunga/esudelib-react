#!/bin/bash

# Test Execution Script for esudelib Application
# This script runs all tests and generates coverage reports

set -e

echo "========================================="
echo "esudelib Testing Suite"
echo "Target: 90% Code Coverage"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create results directory
mkdir -p tests/coverage
mkdir -p tests/results

echo -e "${YELLOW}Step 1: Clearing caches...${NC}"
php artisan config:clear
php artisan cache:clear
echo -e "${GREEN}✓ Caches cleared${NC}"
echo ""

echo -e "${YELLOW}Step 2: Running Unit Tests...${NC}"
php artisan test --testsuite=Unit --stop-on-failure
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Unit tests passed${NC}"
else
    echo -e "${RED}✗ Unit tests failed${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 3: Running Integration Tests...${NC}"
php artisan test --testsuite=Feature --stop-on-failure
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Integration tests passed${NC}"
else
    echo -e "${RED}✗ Integration tests failed${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 4: Generating Code Coverage Report...${NC}"
php artisan test \
    --coverage \
    --coverage-html tests/coverage \
    --coverage-clover tests/coverage/clover.xml \
    --coverage-text \
    --min=90

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Code coverage meets 90% requirement${NC}"
else
    echo -e "${RED}✗ Code coverage below 90%${NC}"
    echo -e "${YELLOW}Please review coverage report: tests/coverage/index.html${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 5: Generating Test Documentation...${NC}"
php artisan test --coverage-html tests/coverage --testdox-html tests/results/testdox.html
echo -e "${GREEN}✓ Test documentation generated${NC}"
echo ""

echo "========================================="
echo -e "${GREEN}All Tests Passed Successfully!${NC}"
echo "========================================="
echo ""
echo "Coverage Report: tests/coverage/index.html"
echo "Test Documentation: tests/results/testdox.html"
echo ""
echo "To view coverage report:"
echo "  open tests/coverage/index.html"
echo ""
