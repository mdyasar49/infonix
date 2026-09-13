const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isDesktop: true,
  onMediaCommand: (callback) => ipcRenderer.on('media-command', (_event, value) => callback(value)),
});
