<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Tests\CreatesApplication;
use App\Services\UploadService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Mockery;

class UploadServiceTest extends BaseTestCase
{
    use CreatesApplication;

    private $uploadService;
    private $uploadMock;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        // Mock the Upload model to prevent DB access
        $this->uploadMock = Mockery::mock('alias:Modules\Upload\Entities\Upload');

        // We use a partial mock of UploadService to override getImageManager
        $this->uploadService = Mockery::mock(UploadService::class)->makePartial();
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_handle_filepond_upload_stores_file()
    {
        $file = UploadedFile::fake()->create('test.jpg', 100);

        $imageMock = Mockery::mock();
        $managerMock = Mockery::mock();

        $this->uploadService->shouldAllowMockingProtectedMethods();
        $this->uploadService->shouldReceive('getImageManager')->andReturn($managerMock);

        $managerMock->shouldReceive('read')->andReturn($imageMock);
        $imageMock->shouldReceive('encodeByExtension')->andReturn('fake-content');

        $this->uploadMock->shouldReceive('create')->once();

        $folder = $this->uploadService->handleFilepondUpload($file);

        $this->assertNotEmpty($folder);
        $files = Storage::disk('public')->files('temp/' . $folder);
        $this->assertCount(1, $files);
    }

    public function test_handle_filepond_delete_removes_directory()
    {
        $folder = 'test-folder';
        Storage::disk('public')->makeDirectory('temp/' . $folder);
        Storage::disk('public')->put('temp/' . $folder . '/file.jpg', 'content');

        $uploadRecordMock = Mockery::mock();
        $uploadRecordMock->folder = $folder;
        $uploadRecordMock->shouldReceive('delete')->once();

        $this->uploadMock->shouldReceive('where')->with('folder', $folder)->andReturnSelf();
        $this->uploadMock->shouldReceive('first')->andReturn($uploadRecordMock);

        $this->uploadService->handleFilepondDelete($folder);

        Storage::disk('public')->assertMissing('temp/' . $folder);
    }

    public function test_handle_dropzone_upload_stores_file()
    {
        $file = UploadedFile::fake()->create('dropzone.jpg', 100);

        $result = $this->uploadService->handleDropzoneUpload($file);

        $this->assertEquals('dropzone.jpg', $result['original_name']);
        Storage::disk('public')->assertExists('temp/dropzone/' . $result['name']);
    }

    public function test_handle_dropzone_delete_removes_file()
    {
        $filename = 'to_delete.jpg';
        Storage::disk('public')->put('temp/dropzone/' . $filename, 'content');

        $this->uploadService->handleDropzoneDelete($filename);

        Storage::disk('public')->assertMissing('temp/dropzone/' . $filename);
    }
}
