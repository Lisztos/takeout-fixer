const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  processFolder: (folderPath) => ipcRenderer.invoke('process-folder', folderPath),
  onProcessingProgress: (callback) => {
    ipcRenderer.on('processing-progress', (event, progress) => callback(progress));
  }
});