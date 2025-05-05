// Preload script to provide secure access to specific Node.js features
const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

// Expose protected methods that allow the renderer process to use
// specific Node.js APIs without exposing the entire Node.js API
contextBridge.exposeInMainWorld(
  'electron', {
    getAppDataPath: () => ipcRenderer.sendSync('app-data-path'),
    resolveDataPath: (relativePath) => {
      const userDataPath = ipcRenderer.sendSync('app-data-path');
      return path.join(userDataPath, relativePath);
    }
  }
);