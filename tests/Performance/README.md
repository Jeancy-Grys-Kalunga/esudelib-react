# Performance Testing Guide

## Overview
This directory contains Apache JMeter test plans for load testing the esudelib application with 1000+ concurrent users, focusing on priority endpoints: **Student**, **Teacher**, and **Jury** operations.

## Prerequisites

### Install Apache JMeter
```bash
# Download JMeter 5.6.3 or later
wget https://dlcdn.apache.org//jmeter/binaries/apache-jmeter-5.6.3.zip
unzip apache-jmeter-5.6.3.zip
cd apache-jmeter-5.6.3/bin
```

### System Requirements
- **RAM**: Minimum 8GB (16GB recommended for 1000+ users)
- **CPU**: Multi-core processor (4+ cores recommended)
- **Java**: JDK 8 or later

## Test Plans

### Priority Endpoints

#### 1. Student Operations (`student_operations.jmx`)
**Target Load**: 500, 1000, 1500 concurrent users  
**Endpoints Tested**:
- `GET /api/students` - Student listing with pagination
- `GET /api/students/search` - Student search by name/matricule
- `GET /api/students/{id}` - Student profile retrieval
- `GET /api/students/{id}/grades` - Student grades viewing
- `GET /api/students/{id}/payments` - Payment history
- `GET /api/students/{id}/courses` - Course enrollment

**Think Time**: 2-4 seconds between requests

#### 2. Teacher Operations (`teacher_operations.jmx`)
**Target Load**: 300, 750, 1000 concurrent users  
**Endpoints Tested**:
- `GET /api/teachers/dashboard` - Teacher dashboard
- `GET /api/teachers/assignments` - Course assignments
- `GET /api/teachers/students` - Student roster
- `POST /api/teachers/grades` - Grade entry
- `GET /api/teachers/appeals` - Appeal reviews
- `GET /api/teachers/schedule` - Course schedule

**Think Time**: 3-5 seconds between requests

#### 3. Jury Operations (`jury_operations.jmx`)
**Target Load**: 200, 500, 750 concurrent users  
**Endpoints Tested**:
- `GET /api/jury/composition` - Jury composition
- `GET /api/jury/deliberations` - Deliberation data
- `GET /api/jury/students` - Student evaluation lists
- `POST /api/jury/validate` - Grade validation
- `POST /api/jury/bulk-process` - Bulk grade processing
- `GET /api/jury/reports` - Deliberation reports

**Think Time**: 5-8 seconds between requests

### Additional Test Plans

#### 4. Authentication (`authentication.jmx`)
**Target Load**: 250, 500, 1000, 1500 users  
**Ramp-up**: 120 seconds  
**Loops**: 20

#### 5. Dashboard Load (`dashboard_load.jmx`)
**Target Load**: 1000, 1500 users  
**Tests role-based dashboard loading**

#### 6. Comprehensive Load Test (`comprehensive_load_test.jmx`)
**Simulates real-world usage**:
- Mixed user roles (60% students, 30% teachers, 10% jury)
- Peak load: 1000-2000 concurrent users
- Sustained load: 500 users for 30 minutes
- Spike test: Sudden increase to 1500 users

## Running Tests

### Basic Execution
```bash
cd tests/Performance/jmeter

# Run with GUI (for test development)
jmeter -t student_operations.jmx

# Run in CLI mode (for actual load testing)
jmeter -n -t student_operations.jmx -l results/student_results.jtl -e -o results/student_report
```

### With Custom Parameters
```bash
# Override base URL
jmeter -n -t student_operations.jmx \
  -Jbase_url=https://your-server.com \
  -l results/student_results.jtl \
  -e -o results/student_report

# With API token
jmeter -n -t teacher_operations.jmx \
  -Jbase_url=https://your-server.com \
  -Japi_token=your_token_here \
  -l results/teacher_results.jtl \
  -e -o results/teacher_report
```

### Running All Priority Tests
```bash
#!/bin/bash
# run_priority_tests.sh

BASE_URL="http://localhost:8000"
RESULTS_DIR="results"

mkdir -p $RESULTS_DIR

echo "Running Student Operations Test (1000 users)..."
jmeter -n -t student_operations.jmx \
  -Jbase_url=$BASE_URL \
  -l $RESULTS_DIR/student_results.jtl \
  -e -o $RESULTS_DIR/student_report

echo "Running Teacher Operations Test (1000 users)..."
jmeter -n -t teacher_operations.jmx \
  -Jbase_url=$BASE_URL \
  -l $RESULTS_DIR/teacher_results.jtl \
  -e -o $RESULTS_DIR/teacher_report

echo "Running Jury Operations Test (750 users)..."
jmeter -n -t jury_operations.jmx \
  -Jbase_url=$BASE_URL \
  -l $RESULTS_DIR/jury_results.jtl \
  -e -o $RESULTS_DIR/jury_report

echo "All tests completed. Reports available in $RESULTS_DIR/"
```

## Performance Targets

### Response Times
- **95th Percentile**: < 300ms under 1000+ users
- **99th Percentile**: < 500ms
- **Average**: < 150ms

### Throughput
- **Minimum**: 200 requests/second
- **Target**: 500+ requests/second

### Error Rate
- **Maximum**: 0.5%
- **Target**: < 0.1%

### Resource Utilization
- **CPU**: < 75%
- **Memory**: < 85%
- **Database Connections**: < 80% of pool

## Analyzing Results

### HTML Reports
After running tests, open the generated HTML report:
```bash
# Open in browser
open results/student_report/index.html
```

### Key Metrics to Review
1. **Response Time Over Time**: Check for degradation
2. **Transactions Per Second**: Verify throughput targets
3. **Error %**: Should be < 0.5%
4. **Active Threads Over Time**: Verify ramp-up is smooth
5. **Response Time Percentiles**: 95th and 99th percentiles

### JTL File Analysis
```bash
# View summary statistics
jmeter -g results/student_results.jtl -o results/analysis

# Extract specific metrics
awk -F',' '{sum+=$2; count++} END {print "Average Response Time:", sum/count}' results/student_results.jtl
```

## Optimization Tips

### JMeter Configuration
Edit `jmeter.properties`:
```properties
# Increase heap size for large tests
HEAP="-Xms4g -Xmx8g -XX:MaxMetaspaceSize=512m"

# Disable unnecessary listeners during load test
jmeterengine.nongui.maxport=4455

# Increase result buffer
jmeter.save.saveservice.thread_counts=true
```

### Distributed Testing (for 1000+ users)
```bash
# On master machine
jmeter -n -t student_operations.jmx \
  -R server1,server2,server3 \
  -l results/distributed_results.jtl \
  -e -o results/distributed_report
```

## Troubleshooting

### Out of Memory Errors
```bash
# Increase JMeter heap size
export HEAP="-Xms4g -Xmx8g"
jmeter -n -t your_test.jmx ...
```

### Connection Timeouts
- Increase `HTTPSampler.connect_timeout` in test plan
- Check server connection limits
- Verify network bandwidth

### High Error Rates
- Review server logs for errors
- Check database connection pool size
- Verify server resources (CPU, RAM, Disk I/O)
- Review application logs for bottlenecks

## Best Practices

1. **Start Small**: Begin with 100 users, then scale up
2. **Monitor Server**: Use monitoring tools (htop, New Relic, etc.)
3. **Baseline First**: Establish baseline performance before optimization
4. **Incremental Load**: Gradually increase load to find breaking point
5. **Think Times**: Use realistic think times (2-8 seconds)
6. **Clean Data**: Use fresh database for consistent results
7. **Multiple Runs**: Run tests multiple times for reliability

## Integration with CI/CD

### Jenkins Pipeline Example
```groovy
stage('Load Testing') {
    steps {
        sh '''
            cd tests/Performance/jmeter
            jmeter -n -t student_operations.jmx \
              -Jbase_url=${TEST_URL} \
              -l results/student_results.jtl \
              -e -o results/student_report
        '''
        
        // Publish results
        perfReport sourceDataFiles: 'tests/Performance/jmeter/results/*.jtl'
    }
}
```

## Support

For issues or questions:
1. Check JMeter documentation: https://jmeter.apache.org/
2. Review server logs
3. Contact DevOps team

## Performance Benchmarks

Expected results for optimized server configuration:

| Metric | 500 Users | 1000 Users | 1500 Users |
|--------|-----------|------------|------------|
| Avg Response Time | 120ms | 180ms | 250ms |
| 95th Percentile | 200ms | 280ms | 400ms |
| Throughput (req/s) | 300 | 550 | 750 |
| Error Rate | 0.05% | 0.1% | 0.3% |
| CPU Usage | 45% | 65% | 75% |
| Memory Usage | 55% | 70% | 80% |
