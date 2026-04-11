const { app, BrowserWindow, screen, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = !app.isPackaged;

let mainWindow;
let configPath;
let config = {
  modelPath: './resources/',
  currentModel: null,
  modelScale: 1.0,
  modelOffsetX: 0.0,
  modelOffsetY: 0.0,
  bubbleColor: '#8b5cf6',
  bubbleOpacity: 0.95,
  eyeTracking: true
};

function loadConfig() {
  configPath = path.join(__dirname, '../../chloe-config.json');
  
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      config = JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }
}

function saveConfig() {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Failed to save config:', error);
  }
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const windowWidth = 500;
  const windowHeight = 800;
  const margin = 20;

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: width - windowWidth - margin,
    y: height - windowHeight - margin,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  });

  mainWindow.setMinimumSize(500, 800);
  mainWindow.setMaximumSize(500, 800);

  mainWindow.on('resized', () => {
    const [width, height] = mainWindow.getSize();
    if (width !== 500 || height !== 800) {
      mainWindow.setSize(500, 800);
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
    mainWindow.webContents.openDevTools({ mode: 'detach' });
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
  mainWindow.setBounds({
    x: Math.round(x),
    y: Math.round(y),
    width: 500,
    height: 800
  });
});

let globalMouseTracking = false;

ipcMain.on('start-global-mouse-tracking', () => {
  if (!globalMouseTracking) {
    globalMouseTracking = true;
    const { screen } = require('electron');
    
    const trackMouse = () => {
      if (!globalMouseTracking) return;
      
      const point = screen.getCursorScreenPoint();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('global-mouse-move', {
          x: point.x,
          y: point.y
        });
      }
      
      if (globalMouseTracking) {
        setTimeout(trackMouse, 16);
      }
    };
    
    trackMouse();
  }
});

ipcMain.on('stop-global-mouse-tracking', () => {
  globalMouseTracking = false;
});

ipcMain.handle('get-config', () => {
  return config;
});

ipcMain.handle('set-config', (event, newConfig) => {
  config = { ...config, ...newConfig };
  saveConfig();
  return true;
});

ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result;
});

ipcMain.handle('get-model-list', () => {
  const modelList = [];
  try {
    const modelDir = path.resolve(config.modelPath);
    if (!fs.existsSync(modelDir)) {
      return modelList;
    }
    
    const entries = fs.readdirSync(modelDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const modelDirPath = path.join(modelDir, entry.name);
        const files = fs.readdirSync(modelDirPath);
        const modelFile = files.find(f => f.endsWith('.model3.json') || f.endsWith('.model.json'));
        
        if (modelFile) {
          modelList.push({
            name: entry.name,
            path: entry.name + '/',
            file: modelFile
          });
        }
      }
    }
  } catch (error) {
    console.error('Failed to get model list:', error);
  }
  return modelList;
});

app.whenReady().then(() => {
  loadConfig();
  createWindow();
});

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
