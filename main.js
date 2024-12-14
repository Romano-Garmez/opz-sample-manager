// main.js
const { app, BrowserWindow, ipcMain, dialog  } = require('electron');
const path = require('path');
const fs = require('fs');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 1080,
        webPreferences: {
            nodeIntegration: true, // Enable Node.js integration
            contextIsolation: false, // Enable context isolation
        }
    });

    // Load the index.html file
    mainWindow.loadFile('index.html');

    // Open DevTools (for development)
    mainWindow.webContents.openDevTools();

    // Handle window close
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Electron initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle the showOpenDialog call via IPC
ipcMain.handle('dialog:open', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    return result.filePaths;  // Return the selected file paths


});

ipcMain.on('file-dropped', (event, filePath, slotNumber) => {
    console.log(`File dropped: ${filePath} for slot ${slotNumber}`);
    // You can copy the file to the desired location here:
    const destination = path.join('your-usb-drive-path', `slot-${slotNumber}`);
    fs.copyFileSync(filePath, destination);
    console.log(`File copied to ${destination}`);
});