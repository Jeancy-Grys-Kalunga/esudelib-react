<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Modules\Upload\Entities\Upload;

class UploadService
{
    public function handleFilepondUpload(UploadedFile $file): string
    {
        $filename = now()->timestamp . '.' . $file->getClientOriginalExtension();
        $folder = uniqid() . '-' . now()->timestamp;

        $image = $this->getImageManager()->read($file->getRealPath());
        $encodedFile = $image->encodeByExtension($file->getClientOriginalExtension());

        Storage::disk('public')->put('temp/' . $folder . '/' . $filename, (string) $encodedFile);

        Upload::create([
            'folder'   => $folder,
            'filename' => $filename
        ]);

        return $folder;
    }

    public function handleFilepondDelete(string $folderContent): void
    {
        $upload = Upload::where('folder', $folderContent)->first();

        if ($upload) {
            Storage::disk('public')->deleteDirectory('temp/' . $upload->folder);
            $upload->delete();
        }
    }

    public function handleDropzoneUpload(UploadedFile $file): array
    {
        $filename = now()->timestamp . '.' . trim($file->getClientOriginalExtension());

        // storeAs uses default disk from config if not specified? 
        // putFileAs(path, file, name, options)
        Storage::disk('public')->putFileAs('temp/dropzone/', $file, $filename);

        return [
            'name'          => $filename,
            'original_name' => $file->getClientOriginalName(),
        ];
    }

    public function handleDropzoneDelete(string $fileName): void
    {
        Storage::disk('public')->delete('temp/dropzone/' . $fileName);
    }

    protected function getImageManager()
    {
        return new ImageManager(new Driver());
    }
}
