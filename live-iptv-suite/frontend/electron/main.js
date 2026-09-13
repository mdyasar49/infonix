const { app, BrowserWindow, globalShortcut, Menu, Tray, nativeImage, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;

// Enable hardware acceleration for ultra-smooth 1080p/4K 60fps streaming
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1440, width),
    height: Math.min(900, height),
    minWidth: 400,
    minHeight: 500,
    backgroundColor: '#050507',
    title: 'StreamPulse Cinema Suite',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#050507',
      symbolColor: '#ffffff',
      height: 36,
    },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../public/icon.png'),
    show: false,
  });

  const isDev = !app.isPackaged;
  const startUrl = isDev
    ? 'http://localhost:5173/'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Global Media Hotkeys on Desktop
  globalShortcut.register('MediaPlayPause', () => {
    mainWindow.webContents.send('media-command', 'play-pause');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
