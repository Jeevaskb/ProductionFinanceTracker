const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Keep a global reference of the window object to avoid it being closed automatically
let mainWindow;
let serverProcess;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icons', 'icon.png')
  });

  // Load the app - in production, load from the built files
  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5000';
  
  console.log(`Loading application from: ${startUrl}`);
  mainWindow.loadURL(startUrl);

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Start the Express server
function startServer() {
  console.log('Starting Express server...');
  
  const serverPath = path.join(__dirname, '..', 'dist', 'server.js');
  
  if (process.env.NODE_ENV === 'development') {
    // In development, start the server from the source files
    serverProcess = spawn('node', [path.join(__dirname, '..', 'server', 'index.js')], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
  } else {
    // In production, start from the built files
    serverProcess = spawn('node', [serverPath], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
  }

  serverProcess.on('error', (error) => {
    console.error(`Failed to start server: ${error}`);
  });
  
  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
}

app.on('ready', () => {
  startServer();
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// Properly clean up when the app is about to quit
app.on('will-quit', () => {
  if (serverProcess) {
    console.log('Shutting down server process...');
    if (process.platform === 'win32') {
      // Windows requires a different approach to kill the process tree
      spawn('taskkill', ['/pid', serverProcess.pid, '/f', '/t']);
    } else {
      serverProcess.kill('SIGTERM');
    }
  }
});

// IPC handlers for communication between renderer and main process
ipcMain.on('app-data-path', (event) => {
  event.returnValue = app.getPath('userData');
});