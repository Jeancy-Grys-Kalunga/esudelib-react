<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class CoverageController extends Controller
{
    /**
     * Show the code coverage report.
     *
     * @param string|null $path
     * @return BinaryFileResponse
     */
    public function show(string $path = 'index.html')
    {
        if (!Gate::allows('view-coverage')) {
            /** @var \App\Models\User $user */
            $user = auth()->user();
            abort_unless($user && $user->hasRole('Super Admin'), 403, 'Unauthorized access to code coverage reports.');
        }

        // Clean and validate path to prevent directory traversal
        $path = str_replace('..', '', $path);

        // Define storage path
        $basePath = storage_path('app/coverage');
        $filePath = "$basePath/$path";

        if (!file_exists($filePath)) {
            abort(404, 'Coverage report file not found. Please run tests with coverage first.');
        }

        // Determine mime type
        $mimeType = mime_content_type($filePath);
        if (str_ends_with($path, '.css')) {
            $mimeType = 'text/css';
        } elseif (str_ends_with($path, '.js')) {
            $mimeType = 'application/javascript';
        }

        return response()->file($filePath, [
            'Content-Type' => $mimeType,
            'Cache-Control' => 'no-cache, must-revalidate',
        ]);
    }
}
