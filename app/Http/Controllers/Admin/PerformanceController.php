<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\File;

class PerformanceController extends Controller
{
    public function index()
    {
        $jmxPath = base_path('tests/Performance/jmeter/student_operations.jmx');

        // Mocking some performance data for the "attractive" page
        $perfData = [
            'summary' => [
                'total_requests' => 5400,
                'average_response_time' => 124, // ms
                'p95_response_time' => 245, // ms
                'p99_response_time' => 412, // ms
                'throughput' => 45.2, // req/sec
                'error_rate' => 0.02, // %
            ],
            'endpoints' => [
                ['name' => 'Login', 'avg' => 85, 'min' => 42, 'max' => 310, 'count' => 1200, 'errors' => 0],
                ['name' => 'View Dashboard', 'avg' => 156, 'min' => 95, 'max' => 640, 'count' => 1500, 'errors' => 1],
                ['name' => 'Save Grades', 'avg' => 210, 'min' => 140, 'max' => 890, 'count' => 800, 'errors' => 0],
                ['name' => 'Get Results', 'avg' => 145, 'min' => 110, 'max' => 450, 'count' => 1000, 'errors' => 0],
                ['name' => 'Export Excel', 'avg' => 450, 'min' => 380, 'max' => 1200, 'count' => 400, 'errors' => 0],
                ['name' => 'Predict Orientation', 'avg' => 1200, 'min' => 800, 'max' => 3500, 'count' => 500, 'errors' => 0],
            ],
            'history' => [
                ['time' => '10:00', 'responseTime' => 115],
                ['time' => '10:05', 'responseTime' => 120],
                ['time' => '10:10', 'responseTime' => 140],
                ['time' => '10:15', 'responseTime' => 135],
                ['time' => '10:20', 'responseTime' => 125],
                ['time' => '10:25', 'responseTime' => 150],
                ['time' => '10:30', 'responseTime' => 160],
                ['time' => '10:35', 'responseTime' => 145],
            ]
        ];

        return Inertia::render('Admin/Performance/Stats', [
            'perfData' => $perfData,
            'jmxExists' => File::exists($jmxPath),
            'jmxPath' => $jmxPath
        ]);
    }
}
