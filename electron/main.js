const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 500,
    height: 800,
    x: width - 550,
    y: height - 850,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    // 调试时可以启用以下边框
    // mainWindow.webContents.insertCSS(`
    //   body {
    //     border: 3px solid #ff69b4 !important;
    //     box-sizing: border-box;
    //   }
    // `);
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

let dragOffsetX = 0;
let dragOffsetY = 0;

ipcMain.on('start-drag', (event, { x, y }) => {
  const pos = mainWindow.getPosition();
  dragOffsetX = x - pos[0];
  dragOffsetY = y - pos[1];
});

ipcMain.on('drag', (event, { x, y }) => {
  mainWindow.setPosition(x - dragOffsetX, y - dragOffsetY);
});

ipcMain.on('end-drag', () => {
  // 拖拽结束，不需要特殊处理
});

ipcMain.on('quit-app', () => {
  app.quit();
});

ipcMain.handle('get-window-position', () => {
  return mainWindow.getPosition();
});

ipcMain.on('set-window-position', (event, { x, y }) => {
  mainWindow.setPosition(Math.round(x), Math.round(y));
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

if (isDev) {
  try {
    require('electron-reloader')(module);
  } catch (err) {
    console.log('electron-reloader 加载失败:', err);
  }
}
