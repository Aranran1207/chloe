const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startDrag: (x, y) => ipcRenderer.send('start-drag', { x, y }),
  drag: (x, y) => ipcRenderer.send('drag', { x, y }),
  endDrag: () => ipcRenderer.send('end-drag'),
  quitApp: () => ipcRenderer.send('quit-app'),
  minimizeApp: () => ipcRenderer.send('minimize-app'),
  getWindowPosition: () => ipcRenderer.invoke('get-window-position'),
  setWindowPosition: (x, y) => ipcRenderer.send('set-window-position', { x, y }),
  getWindowSize: () => ipcRenderer.invoke('get-window-size'),
  setWindowSize: (width, height) => ipcRenderer.send('set-window-size', { width, height }),
  startGlobalMouseTracking: () => ipcRenderer.send('start-global-mouse-tracking'),
  stopGlobalMouseTracking: () => ipcRenderer.send('stop-global-mouse-tracking'),
  onGlobalMouseMove: (callback) => ipcRenderer.on('global-mouse-move', (event, data) => callback(data)),
  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (config) => ipcRenderer.invoke('set-config', config),
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  getModelList: () => ipcRenderer.invoke('get-model-list'),
  
  getIgnoreMouseEvents: () => ipcRenderer.invoke('get-ignore-mouse-events'),
  setIgnoreMouseEvents: (ignore) => ipcRenderer.send('set-ignore-mouse-events', ignore),
  onIgnoreMouseEventsChanged: (callback) => ipcRenderer.on('ignore-mouse-events-changed', (event, ignore) => callback(ignore)),
  
  showContextMenu: (x, y) => ipcRenderer.send('show-context-menu', { x, y }),
  closeSettingsWindow: () => ipcRenderer.send('close-settings-window'),
  onEyeTrackingChanged: (callback) => ipcRenderer.on('eye-tracking-changed', (event, enabled) => callback(enabled)),
  onOpenMemoryPanel: (callback) => ipcRenderer.on('open-memory-panel', () => callback()),
  onModelChanged: (callback) => ipcRenderer.on('model-changed', (event, model) => callback(model)),
  onSettingsSaved: (callback) => ipcRenderer.on('settings-saved', (event, settings) => callback(settings)),
  
  memory: {
    add: (memoryData) => ipcRenderer.invoke('memory-add', memoryData),
    getAll: () => ipcRenderer.invoke('memory-get-all'),
    getByCategory: (category) => ipcRenderer.invoke('memory-get-by-category', category),
    update: (id, updates) => ipcRenderer.invoke('memory-update', id, updates),
    delete: (id) => ipcRenderer.invoke('memory-delete', id),
    clearAll: () => ipcRenderer.invoke('memory-clear-all'),
    getStats: () => ipcRenderer.invoke('memory-get-stats'),
    searchByEmbedding: (embedding, topK) => ipcRenderer.invoke('memory-search-by-embedding', embedding, topK)
  },

  reminder: {
    add: (reminderData) => ipcRenderer.invoke('reminder-add', reminderData),
    getAll: () => ipcRenderer.invoke('reminder-get-all'),
    delete: (id) => ipcRenderer.invoke('reminder-delete', id),
    onFire: (callback) => ipcRenderer.on('reminder-fire', (event, data) => callback(event, data))
  }
});
