const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startDrag: (x, y) => ipcRenderer.send('start-drag', { x, y }),
  drag: (x, y) => ipcRenderer.send('drag', { x, y }),
  endDrag: () => ipcRenderer.send('end-drag'),
  quitApp: () => ipcRenderer.send('quit-app'),
  minimizeApp: () => ipcRenderer.send('minimize-app'),
  getWindowPosition: () => ipcRenderer.invoke('get-window-position'),
  setWindowPosition: (x, y) => ipcRenderer.send('set-window-position', { x, y }),
  startGlobalMouseTracking: () => ipcRenderer.send('start-global-mouse-tracking'),
  stopGlobalMouseTracking: () => ipcRenderer.send('stop-global-mouse-tracking'),
  onGlobalMouseMove: (callback) => ipcRenderer.on('global-mouse-move', (event, data) => callback(data)),
  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (config) => ipcRenderer.invoke('set-config', config),
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  getModelList: () => ipcRenderer.invoke('get-model-list')
});