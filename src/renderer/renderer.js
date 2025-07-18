const uploadArea = document.getElementById('uploadArea');
const selectBtn = document.getElementById('selectBtn');
const processingArea = document.getElementById('processingArea');
const resultsArea = document.getElementById('resultsArea');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const currentFile = document.getElementById('currentFile');
const resetBtn = document.getElementById('resetBtn');
const totalFiles = document.getElementById('totalFiles');
const successFiles = document.getElementById('successFiles');
const failedFiles = document.getElementById('failedFiles');
const errorDetails = document.getElementById('errorDetails');
const errorList = document.getElementById('errorList');

let processingResults = null;

// Handle folder selection
selectBtn.addEventListener('click', async () => {
  const folderPath = await window.electronAPI.selectFolder();
  if (folderPath) {
    processFolder(folderPath);
  }
});

// Handle drag and drop
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', async (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  
  const files = Array.from(e.dataTransfer.files);
  if (files.length > 0 && files[0].path) {
    processFolder(files[0].path);
  }
});

// Process folder
async function processFolder(folderPath) {
  uploadArea.classList.add('hidden');
  processingArea.classList.remove('hidden');
  resultsArea.classList.add('hidden');
  
  // Listen for progress updates
  window.electronAPI.onProcessingProgress((progress) => {
    updateProgress(progress);
  });
  
  // Start processing
  const result = await window.electronAPI.processFolder(folderPath);
  
  if (result.success) {
    showResults(result.result);
  } else {
    alert(`Error: ${result.error}`);
    reset();
  }
}

// Update progress display
function updateProgress(progress) {
  const percentage = (progress.processed / progress.total) * 100;
  progressFill.style.width = `${percentage}%`;
  progressText.textContent = `${progress.processed} / ${progress.total} files processed`;
  currentFile.textContent = progress.currentFile || '';
}

// Show results
function showResults(results) {
  processingArea.classList.add('hidden');
  resultsArea.classList.remove('hidden');
  
  totalFiles.textContent = results.totalFiles;
  successFiles.textContent = results.successCount;
  failedFiles.textContent = results.failedCount;
  
  if (results.errors && results.errors.length > 0) {
    errorDetails.classList.remove('hidden');
    errorList.innerHTML = results.errors
      .map(err => `<li>${err.file}: ${err.error}</li>`)
      .join('');
  }
}

// Reset to initial state
function reset() {
  uploadArea.classList.remove('hidden');
  processingArea.classList.add('hidden');
  resultsArea.classList.add('hidden');
  errorDetails.classList.add('hidden');
  progressFill.style.width = '0%';
  errorList.innerHTML = '';
}

resetBtn.addEventListener('click', reset);