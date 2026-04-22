const { app, BrowserWindow, screen, ipcMain, dialog, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const isDev = !app.isPackaged;

let mainWindow;
let tray = null;
let configPath;
let memoryDb;
let config = {
  modelPath: './resources/',
  currentModel: null,
  modelScale: 1.0,
  modelOffsetX: 0.0,
  modelOffsetY: 0.0,
  bubbleColor: '#8b5cf6',
  eyeTracking: true,
  systemPrompt: '',
  girlfriendName: '',
  windowWidth: 500,
  windowHeight: 800,
  aiProvider: {
    type: 'ollama',
    apiUrl: 'http://localhost:11434',
    apiKey: '',
    chatModel: 'qwen3.5:9b',
    embeddingModel: 'nomic-embed-text-v2-moe:latest'
  }
};

const MIN_WINDOW_WIDTH = 300;
const MIN_WINDOW_HEIGHT = 500;
const MAX_WINDOW_WIDTH = 800;
const MAX_WINDOW_HEIGHT = 1200;

function initMemoryDatabase() {
  const memoryDbPath = path.join(__dirname, '../../chloe-memory.db');
  
  try {
    memoryDb = new Database(memoryDbPath);
    memoryDb.pragma('journal_mode = WAL');
    memoryDb.pragma('synchronous = NORMAL');
    
    memoryDb.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        importance INTEGER DEFAULT 5,
        confidence REAL DEFAULT 0.8,
        embedding BLOB,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_accessed TEXT,
        access_count INTEGER DEFAULT 0,
        last_modified TEXT DEFAULT CURRENT_TIMESTAMP,
        source TEXT,
        related_message_id TEXT,
        tags TEXT,
        question_asked INTEGER DEFAULT 0,
        follow_up_questions TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_category ON memories(category);
      CREATE INDEX IF NOT EXISTS idx_importance ON memories(importance);
      CREATE INDEX IF NOT EXISTS idx_last_accessed ON memories(last_accessed);
      CREATE INDEX IF NOT EXISTS idx_created_at ON memories(created_at);
      
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
      
      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
    
    console.log('[MemoryDB] 数据库初始化成功:', memoryDbPath);
  } catch (error) {
    console.error('[MemoryDB] 数据库初始化失败:', error);
  }
}

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
  const windowWidth = config.windowWidth || 500;
  const windowHeight = config.windowHeight || 800;
  const margin = 20;

  const iconPath = isDev 
    ? path.join(__dirname, '../src/assets/logo.ico')
    : path.join(process.resourcesPath, 'assets/logo.ico');

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: width - windowWidth - margin,
    y: height - windowHeight - margin,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: false,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  });

  mainWindow.setMinimumSize(MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT);
  mainWindow.setMaximumSize(MAX_WINDOW_WIDTH, MAX_WINDOW_HEIGHT);

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
    mainWindow.loadURL('http://localhost:12070');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
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
  if (mainWindow && !mainWindow.isDestroyed()) {
    // 获取当前尺寸并强制保持
    const [currentW, currentH] = mainWindow.getSize();
    
    // 先设置尺寸（确保尺寸正确）
    mainWindow.setSize(currentW, currentH);
    
    // 再设置位置
    mainWindow.setPosition(Math.round(x), Math.round(y));
    
    // 再次检查并恢复尺寸（双重保险）
    const [newW, newH] = mainWindow.getSize();
    if (newW !== currentW || newH !== currentH) {
      mainWindow.setSize(currentW, currentH);
    }
  }
});

ipcMain.handle('get-window-size', () => {
  return mainWindow.getSize();
});

ipcMain.on('set-window-size', (event, { width, height }) => {
  const clampedWidth = Math.max(MIN_WINDOW_WIDTH, Math.min(MAX_WINDOW_WIDTH, width));
  const clampedHeight = Math.max(MIN_WINDOW_HEIGHT, Math.min(MAX_WINDOW_HEIGHT, height));
  mainWindow.setSize(clampedWidth, clampedHeight);
  config.windowWidth = clampedWidth;
  config.windowHeight = clampedHeight;
  saveConfig();
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

// ============ 记忆系统 IPC ============

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

ipcMain.handle('memory-add', async (event, memoryData) => {
  if (!memoryDb) return { success: false, error: '数据库未初始化' };
  
  try {
    const now = new Date().toISOString();
    
    // 去重检查：检查是否已存在相似的记忆
    const allExistingMemories = memoryDb.prepare('SELECT * FROM memories').all();
    
    console.log('[MemoryDB] 检查去重，现有记忆数:', allExistingMemories.length, '新记忆:', memoryData.content.substring(0, 30));
    console.log('[MemoryDB] 新记忆有 embedding:', !!memoryData.embedding, '长度:', memoryData.embedding?.length);
    console.log('[MemoryDB] 新记忆 embedding 类型:', typeof memoryData.embedding, Array.isArray(memoryData.embedding));
    
    for (const existing of allExistingMemories) {
      let similarity = 0;
      let method = '';
      
      console.log('[MemoryDB] existing.embedding 类型:', typeof existing.embedding, existing.embedding?.constructor?.name);
      console.log('[MemoryDB] existing.embedding 长度:', existing.embedding?.length);
      
      // 如果两者都有 embedding，使用向量相似度
      if (memoryData.embedding && existing.embedding) {
        // existing.embedding 是 Buffer，需要正确转换
        let existingEmbedding;
        if (existing.embedding instanceof Buffer) {
          // Buffer 继承自 Uint8Array，需要使用 .buffer 属性获取底层 ArrayBuffer
          existingEmbedding = Array.from(new Float64Array(existing.embedding.buffer));
          console.log('[MemoryDB] Buffer 转换后长度:', existingEmbedding.length);
        } else {
          existingEmbedding = existing.embedding;
        }
        console.log('[MemoryDB] 新记忆 embedding 前5个:', memoryData.embedding.slice(0, 5));
        console.log('[MemoryDB] 旧记忆 embedding 前5个:', existingEmbedding.slice(0, 5));
        similarity = cosineSimilarity(memoryData.embedding, existingEmbedding);
        method = '向量';
      } else {
        // 否则使用文本相似度
        similarity = textSimilarity(memoryData.content, existing.content);
        method = '文本';
      }
      
      console.log(`[MemoryDB] ${method}相似度: ${similarity.toFixed(3)} vs "${existing.content.substring(0, 20)}..."`);
      
      // 如果相似度超过 0.85，认为是重复记忆，跳过添加
      if (similarity > 0.85) {
        console.log('[MemoryDB] 跳过重复记忆:', memoryData.content.substring(0, 30), '相似度:', similarity.toFixed(3));
        // 更新访问次数
        memoryDb.prepare('UPDATE memories SET access_count = access_count + 1, last_accessed = ? WHERE id = ?')
          .run(now, existing.id);
        return { success: true, id: existing.id, duplicate: true };
      }
      
      // 如果相似度在 0.7-0.85 之间，可能是同一信息的不同表述，更新重要性
      if (similarity > 0.7) {
        const newImportance = Math.min(10, Math.max(existing.importance, memoryData.importance ?? 5) + 1);
        memoryDb.prepare('UPDATE memories SET importance = ?, last_modified = ?, access_count = access_count + 1 WHERE id = ?')
          .run(newImportance, now, existing.id);
        console.log('[MemoryDB] 更新相似记忆重要性:', existing.id, '新重要性:', newImportance.toFixed(1));
        return { success: true, id: existing.id, updated: true };
      }
    }
    
    // 没有重复，添加新记忆
    const id = generateUUID();
    
    const stmt = memoryDb.prepare(`
      INSERT INTO memories (
        id, content, category, importance, confidence, embedding,
        created_at, last_accessed, access_count, last_modified,
        source, tags, question_asked
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    let embeddingBuffer = null;
    if (memoryData.embedding && Array.isArray(memoryData.embedding)) {
      embeddingBuffer = Buffer.from(new Float64Array(memoryData.embedding).buffer);
    }
    
    stmt.run(
      id,
      memoryData.content,
      memoryData.category,
      memoryData.importance ?? 5,
      memoryData.confidence ?? 0.8,
      embeddingBuffer,
      now,
      now,
      0,
      now,
      JSON.stringify(memoryData.source ?? { type: 'manual' }),
      JSON.stringify(memoryData.tags ?? []),
      memoryData.questionAsked ? 1 : 0
    );
    
    console.log('[MemoryDB] 添加记忆:', id, memoryData.content.substring(0, 30));
    return { success: true, id, duplicate: false };
  } catch (error) {
    console.error('[MemoryDB] 添加记忆失败:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('memory-get-all', () => {
  if (!memoryDb) return [];
  
  try {
    const rows = memoryDb.prepare('SELECT * FROM memories ORDER BY importance DESC, created_at DESC').all();
    return rows.map(row => rowToMemory(row));
  } catch (error) {
    console.error('[MemoryDB] 获取所有记忆失败:', error);
    return [];
  }
});

ipcMain.handle('memory-get-by-category', (event, category) => {
  if (!memoryDb) return [];
  
  try {
    const rows = memoryDb.prepare('SELECT * FROM memories WHERE category = ? ORDER BY importance DESC').all(category);
    return rows.map(row => rowToMemory(row));
  } catch (error) {
    console.error('[MemoryDB] 按分类获取记忆失败:', error);
    return [];
  }
});

ipcMain.handle('memory-update', (event, id, updates) => {
  if (!memoryDb) return { success: false, error: '数据库未初始化' };
  
  try {
    const now = new Date().toISOString();
    
    let embeddingBuffer = null;
    if (updates.embedding && Array.isArray(updates.embedding)) {
      embeddingBuffer = Buffer.from(new Float64Array(updates.embedding).buffer);
    }
    
    const stmt = memoryDb.prepare(`
      UPDATE memories SET
        content = COALESCE(?, content),
        category = COALESCE(?, category),
        importance = COALESCE(?, importance),
        confidence = COALESCE(?, confidence),
        embedding = COALESCE(?, embedding),
        last_accessed = COALESCE(?, last_accessed),
        access_count = COALESCE(?, access_count),
        last_modified = ?,
        tags = COALESCE(?, tags)
      WHERE id = ?
    `);
    
    stmt.run(
      updates.content ?? null,
      updates.category ?? null,
      updates.importance ?? null,
      updates.confidence ?? null,
      embeddingBuffer,
      updates.lastAccessed ? updates.lastAccessed.toISOString() : null,
      updates.accessCount ?? null,
      now,
      updates.tags ? JSON.stringify(updates.tags) : null,
      id
    );
    
    return { success: true };
  } catch (error) {
    console.error('[MemoryDB] 更新记忆失败:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('memory-delete', (event, id) => {
  if (!memoryDb) return { success: false, error: '数据库未初始化' };
  
  try {
    const result = memoryDb.prepare('DELETE FROM memories WHERE id = ?').run(id);
    return { success: result.changes > 0 };
  } catch (error) {
    console.error('[MemoryDB] 删除记忆失败:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('memory-clear-all', () => {
  if (!memoryDb) return { success: false, error: '数据库未初始化' };
  
  try {
    const result = memoryDb.prepare('DELETE FROM memories').run();
    console.log('[MemoryDB] 已清空所有记忆，共删除', result.changes, '条');
    return { success: true, count: result.changes };
  } catch (error) {
    console.error('[MemoryDB] 清空记忆失败:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('memory-get-stats', () => {
  if (!memoryDb) return { totalMemories: 0, categories: {}, avgImportance: 0 };
  
  try {
    const totalRow = memoryDb.prepare('SELECT COUNT(*) as count FROM memories').get();
    const categoryRows = memoryDb.prepare('SELECT category, COUNT(*) as count FROM memories GROUP BY category').all();
    const avgRow = memoryDb.prepare('SELECT AVG(importance) as avg FROM memories').get();
    
    const categories = {};
    categoryRows.forEach(row => {
      categories[row.category] = row.count;
    });
    
    return {
      totalMemories: totalRow.count,
      categories,
      avgImportance: avgRow.avg ?? 0
    };
  } catch (error) {
    console.error('[MemoryDB] 获取统计失败:', error);
    return { totalMemories: 0, categories: {}, avgImportance: 0 };
  }
});

ipcMain.handle('memory-search-by-embedding', (event, queryEmbedding, topK) => {
  if (!memoryDb) return [];
  
  try {
    const rows = memoryDb.prepare('SELECT * FROM memories WHERE embedding IS NOT NULL').all();
    
    const candidates = rows.map(row => {
      let embedding = null;
      if (row.embedding) {
        // Buffer 需要使用 .buffer 属性获取底层 ArrayBuffer
        embedding = row.embedding instanceof Buffer 
          ? Array.from(new Float64Array(row.embedding.buffer))
          : Array.from(new Float64Array(row.embedding));
      }
      return { row, embedding };
    }).filter(c => c.embedding);
    
    const similarities = candidates.map(({ row, embedding }) => ({
      row,
      similarity: cosineSimilarity(queryEmbedding, embedding)
    }));
    
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    return similarities.slice(0, topK || 10).map(s => ({
      memory: rowToMemory(s.row),
      similarity: s.similarity
    }));
  } catch (error) {
    console.error('[MemoryDB] 向量搜索失败:', error);
    return [];
  }
});

function rowToMemory(row) {
  let embedding = null;
  if (row.embedding) {
    // Buffer 需要使用 .buffer 属性获取底层 ArrayBuffer
    embedding = row.embedding instanceof Buffer 
      ? Array.from(new Float64Array(row.embedding.buffer))
      : Array.from(new Float64Array(row.embedding));
  }
  
  return {
    id: row.id,
    content: row.content,
    category: row.category,
    importance: row.importance,
    confidence: row.confidence,
    embedding,
    createdAt: row.created_at,
    lastAccessed: row.last_accessed,
    accessCount: row.access_count ?? 0,
    lastModified: row.last_modified,
    source: row.source ? JSON.parse(row.source) : { type: 'manual' },
    relatedMessageId: row.related_message_id,
    tags: row.tags ? JSON.parse(row.tags) : [],
    questionAsked: row.question_asked === 1,
    followUpQuestions: row.follow_up_questions ? JSON.parse(row.follow_up_questions) : null
  };
}

function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
}

function textSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  
  const normalize = (str) => str.toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]/g, '');
  const s1 = normalize(text1);
  const s2 = normalize(text2);
  
  if (s1 === s2) return 1;
  
  // 计算编辑距离相似度
  const editDistance = (a, b) => {
    const m = a.length;
    const n = b.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
        }
      }
    }
    return dp[m][n];
  };
  
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  
  const distance = editDistance(s1, s2);
  const similarity = 1 - distance / maxLen;
  
  // 如果一个字符串包含另一个，额外加分
  const containsBonus = (s1.includes(s2) || s2.includes(s1)) ? 0.15 : 0;
  
  return Math.min(1, similarity + containsBonus);
}

app.whenReady().then(() => {
  loadConfig();
  initMemoryDatabase();
  createWindow();
  createTray();
});

function createTray() {
  const iconPath = isDev 
    ? path.join(__dirname, '../src/assets/logo.ico')
    : path.join(process.resourcesPath, 'assets/logo.ico');
  
  const icon = nativeImage.createFromPath(iconPath);
  
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  
  const updateContextMenu = () => {
    const isVisible = mainWindow ? mainWindow.isVisible() : false;
    const isAlwaysOnTop = mainWindow ? mainWindow.isAlwaysOnTop() : true;
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: isVisible ? '● 已显示' : '○ 已隐藏',
        enabled: false
      },
      {
        type: 'separator'
      },
      {
        label: isVisible ? '隐藏窗口' : '显示窗口',
        click: () => {
          if (mainWindow) {
            if (isVisible) {
              mainWindow.hide();
            } else {
              mainWindow.show();
              mainWindow.focus();
            }
            updateContextMenu();
          }
        }
      },
      {
        type: 'separator'
      },
      {
        label: '置顶显示',
        type: 'checkbox',
        checked: isAlwaysOnTop,
        click: (menuItem) => {
          if (mainWindow) {
            mainWindow.setAlwaysOnTop(menuItem.checked);
            updateContextMenu();
          }
        }
      },
      {
        type: 'separator'
      },
      {
        label: '退出',
        click: () => {
          if (memoryDb) {
            memoryDb.close();
          }
          app.quit();
        }
      }
    ]);
    
    tray.setContextMenu(contextMenu);
  };
  
  tray.setToolTip('Chloe - AI女友桌面宠物');
  updateContextMenu();
  
  mainWindow.on('show', updateContextMenu);
  mainWindow.on('hide', updateContextMenu);
  
  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
  
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
  if (memoryDb) {
    memoryDb.close();
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
