#!/bin/bash

# JMeter Load Testing Script
# Runs priority endpoint tests with 1000+ concurrent users

set -e

BASE_URL="${1:-http://localhost:8000}"
JMETER_HOME="${JMETER_HOME:-/usr/local/apache-jmeter}"
RESULTS_DIR="tests/Performance/jmeter/results"

echo "========================================="
echo "JMeter Load Testing - Priority Endpoints"
echo "Base URL: $BASE_URL"
echo "========================================="
echo ""

# Check if JMeter is installed
if [ ! -d "$JMETER_HOME" ]; then
    echo "ERROR: JMeter not found at $JMETER_HOME"
    echo "Please install JMeter or set JMETER_HOME environment variable"
    exit 1
fi

# Create results directory
mkdir -p $RESULTS_DIR

cd tests/Performance/jmeter

echo "Test 1: Student Operations (1000 users)"
echo "----------------------------------------"
$JMETER_HOME/bin/jmeter -n \
    -t student_operations.jmx \
    -Jbase_url=$BASE_URL \
    -l $RESULTS_DIR/student_results.jtl \
    -e -o $RESULTS_DIR/student_report
echo "✓ Student operations test completed"
echo "  Report: $RESULTS_DIR/student_report/index.html"
echo ""

echo "Test 2: Teacher Operations (1000 users)"
echo "----------------------------------------"
$JMETER_HOME/bin/jmeter -n \
    -t teacher_operations.jmx \
    -Jbase_url=$BASE_URL \
    -l $RESULTS_DIR/teacher_results.jtl \
    -e -o $RESULTS_DIR/teacher_report
echo "✓ Teacher operations test completed"
echo "  Report: $RESULTS_DIR/teacher_report/index.html"
echo ""

echo "Test 3: Jury Operations (750 users)"
echo "----------------------------------------"
$JMETER_HOME/bin/jmeter -n \
    -t jury_operations.jmx \
    -Jbase_url=$BASE_URL \
    -l $RESULTS_DIR/jury_results.jtl \
    -e -o $RESULTS_DIR/jury_report
echo "✓ Jury operations test completed"
echo "  Report: $RESULTS_DIR/jury_report/index.html"
echo ""

echo "========================================="
echo "All Load Tests Completed!"
echo "========================================="
echo ""
echo "Results Summary:"
echo "  Student Report: $RESULTS_DIR/student_report/index.html"
echo "  Teacher Report: $RESULTS_DIR/teacher_report/index.html"
echo "  Jury Report: $RESULTS_DIR/jury_report/index.html"
echo ""
echo "Performance Targets:"
echo "  - Response Time (95th): < 300ms"
echo "  - Throughput: > 200 req/s"
echo "  - Error Rate: < 0.5%"
echo ""
