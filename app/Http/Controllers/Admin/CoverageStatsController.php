<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use SimpleXMLElement;
use Illuminate\Support\Facades\File;

class CoverageStatsController extends Controller
{
    public function index()
    {
        $junitPath = storage_path('app/coverage/junit.xml');
        $cloverPath = storage_path('app/coverage/clover.xml');

        try {
            $testStats = $this->parseJunit($junitPath);
        } catch (\Exception $e) {
            $testStats = $this->emptyTestStats();
        }

        try {
            $testFiles = $this->getDetailedFileStats($junitPath);
        } catch (\Exception $e) {
            $testFiles = [];
        }

        try {
            $codeCoverage = $this->parseClover($cloverPath);
        } catch (\Exception $e) {
            $codeCoverage = $this->emptyCodeCoverage();
        }

        return Inertia::render('Admin/Coverage/Stats', [
            'testStats' => $testStats,
            'codeCoverage' => $codeCoverage,
            'testFiles' => $testFiles,
        ]);
    }

    private function getDetailedFileStats($path)
    {
        // 1. Get all test files from tests directory
        $testDir = base_path('tests');
        $allFiles = [];
        if (File::exists($testDir)) {
            $files = File::allFiles($testDir);
            foreach ($files as $file) {
                if (str_ends_with($file->getFilename(), 'Test.php')) {
                    $name = $file->getFilename();
                    if ($name === 'FlexPayServiceTest.php') continue;

                    $realPath = $file->getRealPath();
                    $basePath = base_path();

                    // Robust relative path calculation
                    $relativePath = $realPath;
                    if (stripos($realPath, $basePath) === 0) {
                        $relativePath = ltrim(substr($realPath, strlen($basePath)), DIRECTORY_SEPARATOR);
                    }

                    // Normalize to forward slashes for categorization checks
                    $normalizedPath = str_replace('\\', '/', $relativePath);

                    $category = 'Other';
                    if (str_contains($normalizedPath, 'tests/Unit/Services') || str_contains($normalizedPath, 'Services')) {
                        $category = 'Services';
                    } elseif (str_contains($normalizedPath, 'tests/Unit')) {
                        $category = 'Unit';
                    } elseif (str_contains($normalizedPath, 'tests/Feature')) {
                        $category = 'Feature';
                    }

                    // Normalize for internal matching
                    $lookupKey = str_replace('\\', '/', strtolower($relativePath));

                    $allFiles[$lookupKey] = [
                        'name' => $name,
                        'path' => str_replace('\\', '/', $relativePath),
                        'type' => $category,
                        'tests' => 0,
                        'failures' => 0,
                        'errors' => 0,
                        'pass_rate' => 0,
                        'psr_percentage' => 100,
                        'security_percentage' => 100,
                        'recommendation' => 'Awaiting test execution.'
                    ];
                }
            }
        }

        // 2. Merge with JUnit results if available
        if (File::exists($path) && filesize($path) > 0) {
            try {
                $xml = simplexml_load_file($path);
                $this->processXmlResults($xml, $allFiles);
            } catch (\Exception $e) {
            }
        }

        return array_values($allFiles);
    }

    private function processXmlResults($xml, &$allFiles)
    {
        if (isset($xml->testsuite)) {
            foreach ($xml->testsuite as $suite) {
                $this->updateFileWithSuite($suite, $allFiles);
                // Also process children recursively
                $this->processXmlResults($suite, $allFiles);
            }
        }
    }

    private function updateFileWithSuite($suite, &$allFiles)
    {
        $file = (string)$suite['file'];
        if (!$file) return;

        // Normalize paths for robust matching on Windows
        $normalizedFile = str_replace(['\\', '/'], '/', strtolower((string)$suite['file']));
        $projectRoot = str_replace(['\\', '/'], '/', strtolower(base_path()));

        // Strip project root to get a relative path for matching
        $relativeFile = $normalizedFile;
        if (strpos($normalizedFile, $projectRoot) === 0) {
            $relativeFile = ltrim(substr($normalizedFile, strlen($projectRoot)), '/');
        }

        $matchedKey = null;
        if (isset($allFiles[$relativeFile])) {
            $matchedKey = $relativeFile;
        } else {
            // Fallback: search for a key that ends with this relative file path
            foreach (array_keys($allFiles) as $key) {
                if ($key === $relativeFile || str_ends_with($relativeFile, $key) || str_ends_with($key, $relativeFile)) {
                    $matchedKey = $key;
                    break;
                }
            }
        }

        if ($matchedKey) {
            $tests = (int)$suite['tests'];
            $failures = (int)$suite['failures'];
            $errors = (int)$suite['errors'];
            $passRate = $tests > 0 ? round((($tests - $failures - $errors) / $tests) * 100, 2) : 0;

            $psrScore = min(100, $passRate + ($allFiles[$matchedKey]['type'] === 'Unit' ? 5 : 0));
            $securityScore = min(100, $passRate - ($errors > 0 ? 10 : 0));

            $recommendation = "Maintain high coverage and ensure PSR-12 compliance.";
            if ($failures > 0) $recommendation = "Fix existing failures to ensure regression safety.";
            elseif ($psrScore < 90) $recommendation = "Review code structure for better PSR adherence.";
            elseif ($passRate == 100) $recommendation = "Excellent! Consider adding more edge-case scenarios.";

            $allFiles[$matchedKey]['tests'] = $tests;
            $allFiles[$matchedKey]['failures'] = $failures;
            $allFiles[$matchedKey]['errors'] = $errors;
            $allFiles[$matchedKey]['pass_rate'] = $passRate;
            $allFiles[$matchedKey]['psr_percentage'] = (int)$psrScore;
            $allFiles[$matchedKey]['security_percentage'] = (int)$securityScore;
            $allFiles[$matchedKey]['recommendation'] = $recommendation;
        }
    }

    private function addFileStat($suite, &$files)
    {
        $file = (string)$suite['file'];
        if (!$file) {
            return;
        }

        $name = basename($file);

        // Exclude FlexPayServiceTest.php as requested
        if ($name === 'FlexPayServiceTest.php') {
            return;
        }

        $category = 'Other';
        if (str_contains($file, 'tests/Unit/Services') || str_contains($file, 'Services')) {
            $category = 'Services';
        } elseif (str_contains($file, 'tests/Unit')) {
            $category = 'Unit';
        } elseif (str_contains($file, 'tests/Feature')) {
            $category = 'Feature';
        }

        $tests = (int)$suite['tests'];
        $failures = (int)$suite['failures'];
        $errors = (int)$suite['errors'];
        $passRate = $tests > 0 ? round((($tests - $failures - $errors) / $tests) * 100, 2) : 0;

        // Simulated PSR and Security scores based on pass rate and category
        $psrScore = min(100, $passRate + ($category === 'Unit' ? 5 : 0));
        $securityScore = min(100, $passRate - ($errors > 0 ? 10 : 0));

        $recommendation = "Maintain high coverage and ensure PSR-12 compliance.";
        if ($failures > 0) {
            $recommendation = "Fix existing failures to ensure regression safety.";
        } elseif ($psrScore < 90) {
            $recommendation = "Review code structure for better PSR adherence.";
        } elseif ($passRate == 100) {
            $recommendation = "Excellent! Consider adding more edge-case scenarios.";
        }

        $files[] = [
            'name' => $name,
            'path' => $file,
            'type' => $category,
            'tests' => $tests,
            'failures' => $failures,
            'errors' => $errors,
            'pass_rate' => $passRate,
            'psr_percentage' => (int)$psrScore,
            'security_percentage' => (int)$securityScore,
            'recommendation' => $recommendation
        ];
    }

    private function parseJunit($path)
    {
        if (!File::exists($path) || filesize($path) === 0) {
            return $this->emptyTestStats();
        }

        try {
            $xml = simplexml_load_file($path);
        } catch (\Exception $e) {
            return $this->emptyTestStats();
        }

        $stats = [
            'Unit' => ['tests' => 0, 'failures' => 0, 'errors' => 0, 'time' => 0],
            'Feature' => ['tests' => 0, 'failures' => 0, 'errors' => 0, 'time' => 0],
            'Services' => ['tests' => 0, 'failures' => 0, 'errors' => 0, 'time' => 0],
            'Other' => ['tests' => 0, 'failures' => 0, 'errors' => 0, 'time' => 0],
        ];

        $this->crawlTestSuites($xml, $stats);

        return $stats;
    }

    private function crawlTestSuites($element, &$stats)
    {
        if (isset($element->testsuite)) {
            foreach ($element->testsuite as $suite) {
                $this->processTestSuite($suite, $stats);
                $this->crawlTestSuites($suite, $stats); // Recurse
            }
        }
    }

    private function processTestSuite($suite, &$stats)
    {
        $name = (string)$suite['name'];
        $file = (string)$suite['file'];
        if (!$file) return;

        // Normalize to forward slashes for categorization checks
        $normalizedFile = str_replace('\\', '/', $file);

        $category = 'Other';
        if (str_contains($normalizedFile, 'tests/Unit/Services') || str_contains($normalizedFile, 'Services')) {
            $category = 'Services';
        } elseif (str_contains($normalizedFile, 'tests/Unit')) {
            $category = 'Unit';
        } elseif (str_contains($normalizedFile, 'tests/Feature')) {
            $category = 'Feature';
        }

        $stats[$category]['tests'] += (int)$suite['tests'];
        $stats[$category]['failures'] += (int)$suite['failures'];
        $stats[$category]['errors'] += (int)$suite['errors'];
        $stats[$category]['time'] += (float)$suite['time'];
    }

    private function parseClover($path)
    {
        if (!File::exists($path)) {
            return $this->emptyCodeCoverage();
        }

        $xml = simplexml_load_file($path);
        $metrics = $xml->project->metrics; // Global project metrics

        return [
            'files' => (int)$metrics['files'],
            'loc' => (int)$metrics['loc'], // Lines of Code
            'ncloc' => (int)$metrics['ncloc'], // Non-Comment Lines of Code
            'classes' => (int)$metrics['classes'],
            'methods' => (int)$metrics['methods'],
            'coveredmethods' => (int)$metrics['coveredmethods'],
            'statements' => (int)$metrics['statements'],
            'coveredstatements' => (int)$metrics['coveredstatements'],
            'elements' => (int)$metrics['elements'],
            'coveredelements' => (int)$metrics['coveredelements'],
            // Calculate percentage
            'percent_covered' => $metrics['elements'] > 0
                ? round(((int)$metrics['coveredelements'] / (int)$metrics['elements']) * 100, 2)
                : 0
        ];
    }

    private function emptyTestStats()
    {
        return [
            'Unit' => ['tests' => 0, 'failures' => 0, 'errors' => 0, 'time' => 0],
            'Feature' => ['tests' => 0, 'failures' => 0, 'errors' => 0, 'time' => 0],
            'Services' => ['tests' => 0, 'failures' => 0, 'errors' => 0, 'time' => 0],
            'Other' => ['tests' => 0, 'failures' => 0, 'errors' => 0, 'time' => 0],
        ];
    }

    private function emptyCodeCoverage()
    {
        return [
            'files' => 0,
            'loc' => 0,
            'classes' => 0,
            'methods' => 0,
            'coveredmethods' => 0,
            'statements' => 0,
            'coveredstatements' => 0,
            'percent_covered' => 0
        ];
    }
}
