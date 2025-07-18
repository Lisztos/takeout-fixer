const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { processGoogleTakeout } = require('../utils/processor');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('process-folder', async (event, folderPath) => {
  try {
    const progressCallback = (progress) => {
      mainWindow.webContents.send('processing-progress', progress);
    };
    
    const result = await processGoogleTakeout(folderPath, progressCallback);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});