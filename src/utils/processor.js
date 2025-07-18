const fs = require('fs').promises;
const path = require('path');
const { exiftool } = require('exiftool-vendored');
const { findMatchingJson, extractDateFromJson } = require('./metadata');

async function processGoogleTakeout(folderPath, progressCallback) {
  const results = {
    totalFiles: 0,
    successCount: 0,
    failedCount: 0,
    errors: []
  };

  try {
    // Get all files in the folder recursively
    const files = await getAllFiles(folderPath);
    
    // Filter for image and video files
    const mediaFiles = files.filter(file => isMediaFile(file));
    results.totalFiles = mediaFiles.length;

    // Process each media file
    for (let i = 0; i < mediaFiles.length; i++) {
      const file = mediaFiles[i];
      const progress = {
        total: results.totalFiles,
        processed: i,
        currentFile: path.basename(file)
      };
      progressCallback(progress);

      try {
        await processMediaFile(file);
        results.successCount++;
      } catch (error) {
        results.failedCount++;
        results.errors.push({
          file: path.basename(file),
          error: error.message
        });
      }
    }

    // Final progress update
    progressCallback({
      total: results.totalFiles,
      processed: results.totalFiles,
      currentFile: 'Complete'
    });

  } catch (error) {
    throw new Error(`Failed to process folder: ${error.message}`);
  } finally {
    // Ensure exiftool closes properly
    await exiftool.end();
  }

  return results;
}

async function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = await fs.readdir(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = await fs.stat(filePath);

    if (stat.isDirectory()) {
      await getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  }

  return arrayOfFiles;
}

function isMediaFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mediaExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif',
    '.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.mpg', '.mpeg',
    '.3gp', '.wmv'
  ];
  return mediaExtensions.includes(ext);
}

async function processMediaFile(filePath) {
  // Find matching JSON file
  const jsonPath = await findMatchingJson(filePath);
  
  if (!jsonPath) {
    // Skip files without JSON metadata
    return;
  }

  // Extract date from JSON
  const dateTime = await extractDateFromJson(jsonPath);
  
  if (!dateTime) {
    throw new Error('No valid date found in JSON');
  }

  // Write metadata to file using exiftool
  await writeMetadata(filePath, dateTime);
}

async function writeMetadata(filePath, dateTime) {
  const dateStr = formatExifDate(dateTime);
  
  try {
    await exiftool.write(filePath, {
      DateTimeOriginal: dateStr,
      CreateDate: dateStr,
      ModifyDate: dateStr,
      FileModifyDate: dateTime
    }, ['-overwrite_original']);
  } catch (error) {
    throw new Error(`Failed to write metadata: ${error.message}`);
  }
}

function formatExifDate(date) {
  // Format date for EXIF: "YYYY:MM:DD HH:MM:SS"
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}:${month}:${day} ${hours}:${minutes}:${seconds}`;
}

module.exports = {
  processGoogleTakeout
};