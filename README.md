# Takeout Fixer

A desktop application that fixes metadata for Google Photos Takeout files by reading the accompanying JSON files and embedding the metadata directly into photos and videos.

## Features

- Drag & drop interface for easy folder selection
- Processes Google Takeout folders recursively
- Extracts metadata from JSON files (photoTakenTime, creationTime, etc.)
- Writes EXIF metadata directly to image and video files
- Handles various edge cases:
  - Truncated filenames (>51 characters)
  - Bracket position issues
  - Edited file suffixes (-edited, -effects, etc.)
  - Files without extensions
- Progress tracking with real-time updates
- Error reporting for failed files

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. Start the application:
   ```bash
   npm start
   ```

2. Either:
   - Drag and drop your Google Takeout folder onto the upload area
   - Click "Select Folder" to browse and choose your folder

3. The app will:
   - Scan all files in the folder recursively
   - Match each photo/video with its corresponding JSON file
   - Extract the date/time metadata
   - Write the metadata to the file's EXIF data

4. View the results showing:
   - Total files processed
   - Successfully updated files
   - Failed files (with error details)

## How It Works

The app uses multiple strategies to match media files with their JSON metadata:

1. **Direct match**: `photo.jpg` → `photo.jpg.json`
2. **Shortened names**: For files >51 characters (Google's truncation)
3. **Bracket swap**: `image(11).jpg` → `image.jpg(11).json`
4. **Remove suffixes**: Strip `-edited`, `-effects`, etc.
5. **No extension**: `20030616.jpg` → `20030616.json`
6. **Pattern matching**: Various other edge cases

## Building

To build the application for distribution:

```bash
npm run build
```

This will create platform-specific builds in the `dist` folder.

## Dependencies

- **Electron**: Cross-platform desktop application framework
- **exiftool-vendored**: For reading and writing EXIF metadata

## License

MIT