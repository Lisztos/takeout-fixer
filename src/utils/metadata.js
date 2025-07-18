const fs = require('fs').promises;
const path = require('path');

// Find matching JSON file for a media file using various strategies
async function findMatchingJson(mediaFilePath) {
  const dir = path.dirname(mediaFilePath);
  const baseName = path.basename(mediaFilePath);
  
  // Try different matching strategies in order
  const strategies = [
    // Strategy 1: Direct match (photo.jpg -> photo.jpg.json)
    () => `${baseName}.json`,
    
    // Strategy 2: For files with long names (>51 chars), try truncated version
    () => {
      const nameWithoutExt = path.basename(mediaFilePath, path.extname(mediaFilePath));
      if (nameWithoutExt.length > 47) {
        const truncated = nameWithoutExt.substring(0, 47);
        return `${truncated}${path.extname(mediaFilePath)}.json`;
      }
      return null;
    },
    
    // Strategy 3: Bracket swap (image(11).jpg -> image.jpg(11).json)
    () => {
      const match = baseName.match(/^(.+)\((\d+)\)(\.[^.]+)$/);
      if (match) {
        return `${match[1]}${match[3]}(${match[2]}).json`;
      }
      return null;
    },
    
    // Strategy 4: Remove edited suffixes
    () => {
      const nameWithoutExt = path.basename(mediaFilePath, path.extname(mediaFilePath));
      const suffixes = ['-edited', '-effects', '-smile', '-mix'];
      for (const suffix of suffixes) {
        if (nameWithoutExt.endsWith(suffix)) {
          const cleanName = nameWithoutExt.slice(0, -suffix.length);
          return `${cleanName}${path.extname(mediaFilePath)}.json`;
        }
      }
      return null;
    },
    
    // Strategy 5: No extension (20030616.jpg -> 20030616.json)
    () => {
      const nameWithoutExt = path.basename(mediaFilePath, path.extname(mediaFilePath));
      return `${nameWithoutExt}.json`;
    },
    
    // Strategy 6: Remove trailing numbers and parentheses
    () => {
      const nameWithoutExt = path.basename(mediaFilePath, path.extname(mediaFilePath));
      const match = nameWithoutExt.match(/^(.+?)[\s_-]*\(\d+\)$/);
      if (match) {
        return `${match[1]}${path.extname(mediaFilePath)}.json`;
      }
      return null;
    }
  ];

  // Try each strategy
  for (const strategy of strategies) {
    const jsonFileName = strategy();
    if (jsonFileName) {
      const jsonPath = path.join(dir, jsonFileName);
      try {
        await fs.access(jsonPath);
        return jsonPath;
      } catch {
        // File doesn't exist, try next strategy
      }
    }
  }

  return null;
}

// Extract date from Google Takeout JSON metadata
async function extractDateFromJson(jsonPath) {
  try {
    const content = await fs.readFile(jsonPath, 'utf8');
    const data = JSON.parse(content);
    
    // Primary field: photoTakenTime.timestamp
    if (data.photoTakenTime && data.photoTakenTime.timestamp) {
      const timestamp = parseInt(data.photoTakenTime.timestamp);
      return new Date(timestamp * 1000); // Convert seconds to milliseconds
    }
    
    // Fallback: creationTime.timestamp
    if (data.creationTime && data.creationTime.timestamp) {
      const timestamp = parseInt(data.creationTime.timestamp);
      return new Date(timestamp * 1000);
    }
    
    // Fallback: modificationTime.timestamp
    if (data.modificationTime && data.modificationTime.timestamp) {
      const timestamp = parseInt(data.modificationTime.timestamp);
      return new Date(timestamp * 1000);
    }
    
    return null;
  } catch (error) {
    console.error(`Error reading JSON ${jsonPath}:`, error);
    return null;
  }
}

module.exports = {
  findMatchingJson,
  extractDateFromJson
};