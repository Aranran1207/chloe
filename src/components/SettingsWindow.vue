<template>
  <div class="settings-window">
    <div class="settings-panel">
      <div class="panel-header">
        <h2>设置</h2>
        <button class="close-btn" @click="closeWindow">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      
      <div class="panel-content">
        <div class="setting-group">
          <label>模型文件夹路径</label>
          <div class="input-group">
            <input 
              v-model="modelPath" 
              type="text" 
              placeholder="请输入模型文件夹路径"
              @keyup.enter="saveSettings"
            />
            <button class="browse-btn" @click="browseFolder">浏览</button>
          </div>
          <p class="hint">例如: ./resources/ 或 D:/Live2D/models/</p>
        </div>
        
        <div class="setting-group">
          <label>窗口大小</label>
          <div class="window-size-container">
            <div class="size-input-group">
              <label>宽度</label>
              <input
                type="text"
                :value="windowWidth"
                @input="windowWidth = parseInt(($event.target as HTMLInputElement).value) || 500"
                class="size-input"
                placeholder="300-800"
              />
              <span class="size-unit">px</span>
            </div>
            <div class="size-input-group">
              <label>高度</label>
              <input
                type="text"
                :value="windowHeight"
                @input="windowHeight = parseInt(($event.target as HTMLInputElement).value) || 800"
                class="size-input"
                placeholder="500-1200"
              />
              <span class="size-unit">px</span>
            </div>
          </div>
          <p class="hint">最小: 300×500 / 最大: 800×1200</p>
        </div>
        
        <div class="setting-group">
          <label>模型缩放比例</label>
          <div class="slider-container">
            <input type="range" v-model.number="modelScale" min="0.5" max="2.0" step="0.1" class="slider" />
            <span class="slider-value">{{ modelScale.toFixed(1) }}x</span>
          </div>
        </div>
        
        <div class="setting-group">
          <label>水平位置偏移</label>
          <div class="slider-container">
            <input type="range" v-model.number="modelOffsetX" min="-2.0" max="2.0" step="0.1" class="slider" />
            <span class="slider-value">{{ modelOffsetX.toFixed(1) }}</span>
          </div>
        </div>
        
        <div class="setting-group">
          <label>垂直位置偏移</label>
          <div class="slider-container">
            <input type="range" v-model.number="modelOffsetY" min="-1.0" max="1.0" step="0.1" class="slider" />
            <span class="slider-value">{{ modelOffsetY.toFixed(1) }}</span>
          </div>
        </div>
        
        <div class="setting-group">
          <label>气泡颜色</label>
          <div class="color-picker-container">
            <input type="color" v-model="bubbleColor" class="color-picker" />
            <div class="color-preview" :style="{ background: bubbleColor }"></div>
            <span class="color-value">{{ bubbleColor }}</span>
          </div>
        </div>
        
        <div class="setting-group">
          <label>女友名字</label>
          <input 
            v-model="girlfriendName" 
            type="text" 
            class="name-input"
            placeholder="给女友起个名字吧~"
            maxlength="20"
          />
          <p class="hint">这个名字会用于对话中</p>
        </div>
        
        <div class="setting-group">
          <label>角色设定</label>
          <textarea 
            v-model="systemPrompt" 
            class="prompt-textarea"
            placeholder="输入角色的性格、说话风格等设定..."
            rows="4"
          ></textarea>
          <p class="hint">定义角色的性格、说话风格等，留空使用默认设定</p>
        </div>
        
        <div class="setting-group ai-provider-section">
          <label>AI 模型配置</label>
          
          <div class="provider-type-selector">
            <button 
              class="provider-btn"
              :class="{ active: aiProviderType === 'ollama' }"
              @click="aiProviderType = 'ollama'"
            >
              <span class="provider-icon">🏠</span>
              <span class="provider-name">本地 Ollama</span>
              <span class="provider-status" :class="{ available: ollamaAvailable }">
                {{ ollamaAvailable ? '可用' : '离线' }}
              </span>
            </button>
            <button 
              class="provider-btn"
              :class="{ active: aiProviderType === 'openai' }"
              @click="aiProviderType = 'openai'"
            >
              <span class="provider-icon">☁️</span>
              <span class="provider-name">云端 API</span>
              <span class="provider-status" :class="{ available: openaiAvailable }">
                {{ openaiAvailable ? '已配置' : '未配置' }}
              </span>
            </button>
          </div>
          
          <div class="provider-config" v-if="aiProviderType === 'ollama'">
            <div class="config-row">
              <label>API 地址</label>
              <input v-model="ollamaApiUrl" type="text" class="config-input" placeholder="http://localhost:11434" />
            </div>
            <div class="config-row">
              <label>聊天模型</label>
              <input v-model="ollamaChatModel" type="text" class="config-input" placeholder="qwen3.5:9b" />
            </div>
            <div class="config-row">
              <label>嵌入模型</label>
              <input v-model="ollamaEmbeddingModel" type="text" class="config-input" placeholder="nomic-embed-text-v2-moe:latest" />
            </div>
            <p class="hint">本地推理，无需联网，低延迟</p>
          </div>
          
          <div class="provider-config" v-if="aiProviderType === 'openai'">
            <div class="config-row">
              <label>API 地址</label>
              <input v-model="openaiApiUrl" type="text" class="config-input" placeholder="https://api.openai.com/v1" />
            </div>
            <div class="config-row">
              <label>API Key</label>
              <input v-model="openaiApiKey" type="password" class="config-input" placeholder="sk-..." />
            </div>
            <div class="config-row">
              <label>聊天模型</label>
              <input v-model="openaiChatModel" type="text" class="config-input" placeholder="gpt-4o-mini" />
            </div>
            <div class="config-row">
              <label>嵌入模型</label>
              <input v-model="openaiEmbeddingModel" type="text" class="config-input" placeholder="text-embedding-3-small" />
            </div>
            <p class="hint">云端 API，效果更好，需要联网和 API Key</p>
          </div>
        </div>
        
        <div class="setting-group">
          <label>注视鼠标</label>
          <div class="toggle-container">
            <label class="toggle">
              <input type="checkbox" v-model="eyeTracking" />
              <span class="toggle-slider"></span>
            </label>
            <span class="toggle-label">{{ eyeTracking ? '开启' : '关闭' }}</span>
          </div>
        </div>
        
        <div class="setting-group">
          <label>鼠标穿透</label>
          <div class="toggle-container">
            <label class="toggle">
              <input type="checkbox" v-model="ignoreMouseEvents" />
              <span class="toggle-slider"></span>
            </label>
            <span class="toggle-label">{{ ignoreMouseEvents ? '开启' : '关闭' }}</span>
          </div>
        </div>
        
        <div class="setting-group memory-section">
          <label>记忆管理</label>
          <div class="memory-stats">
            <span class="memory-count">已记录 {{ memoryCount }} 条记忆</span>
            <button class="btn btn-danger" @click="clearMemories" :disabled="memoryCount === 0">
              清空记忆
            </button>
          </div>
          <p class="hint">AI 会自动记住你的喜好和个人信息</p>
        </div>
        
        <div class="setting-actions">
          <button class="btn btn-primary" @click="saveSettings">保存设置</button>
          <button class="btn btn-secondary" @click="closeWindow">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { saveProviderConfig } from '../lib/chatService';

const modelPath = ref('./resources/');
const modelScale = ref(1.0);
const modelOffsetX = ref(0.0);
const modelOffsetY = ref(-0.3);
const bubbleColor = ref('#8b5cf6');
const eyeTracking = ref(true);
const ignoreMouseEvents = ref(false);
const systemPrompt = ref('');
const girlfriendName = ref('');
const windowWidth = ref(500);
const windowHeight = ref(800);
const memoryCount = ref(0);

const aiProviderType = ref<'ollama' | 'openai'>('ollama');
const ollamaApiUrl = ref('http://localhost:11434');
const ollamaChatModel = ref('qwen3.5:9b');
const ollamaEmbeddingModel = ref('nomic-embed-text-v2-moe:latest');
const openaiApiUrl = ref('https://api.openai.com/v1');
const openaiApiKey = ref('');
const openaiChatModel = ref('gpt-4o-mini');
const openaiEmbeddingModel = ref('text-embedding-3-small');
const ollamaAvailable = ref(false);
const openaiAvailable = ref(false);

const loadConfig = async () => {
  if (window.electronAPI) {
    const config = await window.electronAPI.getConfig();
    if (config.modelPath) {
      let path = config.modelPath;
      if (!path.endsWith('/') && !path.endsWith('\\')) {
        path += '/';
      }
      modelPath.value = path;
    }
    if (config.modelScale !== undefined) modelScale.value = config.modelScale;
    if (config.modelOffsetX !== undefined) modelOffsetX.value = config.modelOffsetX;
    if (config.modelOffsetY !== undefined) modelOffsetY.value = config.modelOffsetY;
    if (config.bubbleColor !== undefined) bubbleColor.value = config.bubbleColor;
    if (config.eyeTracking !== undefined) eyeTracking.value = config.eyeTracking;
    if (config.ignoreMouseEvents !== undefined) ignoreMouseEvents.value = config.ignoreMouseEvents;
    if (config.systemPrompt !== undefined) systemPrompt.value = config.systemPrompt;
    if (config.girlfriendName !== undefined) girlfriendName.value = config.girlfriendName;
    if (config.windowWidth !== undefined) windowWidth.value = config.windowWidth;
    if (config.windowHeight !== undefined) windowHeight.value = config.windowHeight;
    
    if (config.aiProvider) {
      aiProviderType.value = config.aiProvider.type || 'ollama';
      if (config.aiProvider.type === 'ollama') {
        ollamaApiUrl.value = config.aiProvider.apiUrl || 'http://localhost:11434';
        ollamaChatModel.value = config.aiProvider.chatModel || 'qwen3.5:9b';
        ollamaEmbeddingModel.value = config.aiProvider.embeddingModel || 'nomic-embed-text-v2-moe:latest';
      } else if (config.aiProvider.type === 'openai') {
        openaiApiUrl.value = config.aiProvider.apiUrl || 'https://api.openai.com/v1';
        openaiApiKey.value = config.aiProvider.apiKey || '';
        openaiChatModel.value = config.aiProvider.chatModel || 'gpt-4o-mini';
        openaiEmbeddingModel.value = config.aiProvider.embeddingModel || 'text-embedding-3-small';
      }
      localStorage.setItem('aiProviderConfig', JSON.stringify(config.aiProvider));
    }
  }
};

const loadMemoryCount = async () => {
  if (window.electronAPI?.memory) {
    try {
      const stats = await window.electronAPI.memory.getStats();
      memoryCount.value = stats.totalMemories || 0;
    } catch (error) {
      console.warn('[SettingsWindow] 获取记忆统计失败:', error);
    }
  }
};

const checkProviderAvailability = async () => {
  let ollamaUrl = ollamaApiUrl.value;
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });
    ollamaAvailable.value = response.ok;
  } catch {
    ollamaAvailable.value = false;
  }
  openaiAvailable.value = !!openaiApiKey.value;
};

const browseFolder = async () => {
  if (window.electronAPI?.openFolderDialog) {
    const result = await window.electronAPI.openFolderDialog();
    if (result && !result.canceled && result.filePaths.length > 0) {
      modelPath.value = result.filePaths[0];
    }
  }
};

const clearMemories = async () => {
  if (window.electronAPI?.memory?.clearAll) {
    try {
      const result = await window.electronAPI.memory.clearAll();
      if (result.success) {
        memoryCount.value = 0;
        console.log('[SettingsWindow] 已清空所有记忆');
      }
    } catch (error) {
      console.error('[SettingsWindow] 清空记忆失败:', error);
    }
  }
};

const saveSettings = async () => {
  const clampedWidth = Math.max(300, Math.min(800, windowWidth.value || 500));
  const clampedHeight = Math.max(500, Math.min(1200, windowHeight.value || 800));
  
  let normalizedPath = modelPath.value;
  if (!normalizedPath.endsWith('/') && !normalizedPath.endsWith('\\')) {
    normalizedPath += '/';
  }
  
  const aiConfig = aiProviderType.value === 'ollama' ? {
    type: 'ollama' as const,
    apiUrl: ollamaApiUrl.value,
    chatModel: ollamaChatModel.value,
    embeddingModel: ollamaEmbeddingModel.value
  } : {
    type: 'openai' as const,
    apiUrl: openaiApiUrl.value,
    apiKey: openaiApiKey.value,
    chatModel: openaiChatModel.value,
    embeddingModel: openaiEmbeddingModel.value
  };
  
  saveProviderConfig(aiConfig);
  
  if (window.electronAPI) {
    await window.electronAPI.setConfig({
      modelPath: normalizedPath,
      modelScale: modelScale.value,
      modelOffsetX: modelOffsetX.value,
      modelOffsetY: modelOffsetY.value,
      bubbleColor: bubbleColor.value,
      eyeTracking: eyeTracking.value,
      ignoreMouseEvents: ignoreMouseEvents.value,
      systemPrompt: systemPrompt.value,
      girlfriendName: girlfriendName.value,
      windowWidth: clampedWidth,
      windowHeight: clampedHeight
    });
    
    window.electronAPI.setIgnoreMouseEvents(ignoreMouseEvents.value);
    window.electronAPI.send('settings-saved', {});
  }
  
  closeWindow();
};

const closeWindow = () => {
  if (window.electronAPI) {
    window.electronAPI.closeSettingsWindow();
  }
};

onMounted(async () => {
  await loadConfig();
  loadMemoryCount();
  checkProviderAvailability();
});
</script>

<style scoped>
.settings-window {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(145deg, rgba(35, 35, 45, 0.98) 0%, rgba(25, 25, 35, 0.99) 100%);
  overflow: hidden;
  -webkit-app-region: drag;
}

.settings-panel {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  -webkit-app-region: no-drag;
}

.settings-panel::-webkit-scrollbar {
  width: 6px;
}

.settings-panel::-webkit-scrollbar-track {
  background: transparent;
}

.settings-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: sticky;
  top: 0;
  background: linear-gradient(145deg, rgba(35, 35, 45, 0.98) 0%, rgba(25, 25, 35, 0.99) 100%);
  z-index: 1;
  -webkit-app-region: drag;
}

.panel-header h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: 0.3px;
}

.close-btn {
  width: 34px;
  height: 34px;
  border: none;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  -webkit-app-region: no-drag;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  transform: rotate(90deg);
}

.close-btn svg {
  width: 16px;
  height: 16px;
  color: rgba(255, 255, 255, 0.6);
  transition: color 0.2s;
}

.close-btn:hover svg {
  color: #ef4444;
}

.panel-content {
  padding: 20px 24px 24px;
}

.setting-group {
  margin-bottom: 22px;
}

.setting-group:last-child {
  margin-bottom: 0;
}

.setting-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-group {
  display: flex;
  gap: 10px;
}

.input-group input {
  flex: 1;
  padding: 11px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  transition: all 0.2s;
}

.input-group input:focus {
  outline: none;
  border-color: rgba(102, 126, 234, 0.5);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-group input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.browse-btn {
  padding: 11px 18px;
  background: rgba(102, 126, 234, 0.12);
  border: 1px solid rgba(102, 126, 234, 0.25);
  border-radius: 10px;
  color: #818cf8;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.browse-btn:hover {
  background: rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.4);
  transform: translateY(-1px);
}

.hint {
  margin: 8px 0 0;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
}

.window-size-container {
  display: flex;
  gap: 12px;
}

.size-input-group {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 8px 12px;
  transition: all 0.2s;
}

.size-input-group:focus-within {
  border-color: rgba(102, 126, 234, 0.5);
  background: rgba(255, 255, 255, 0.06);
}

.size-input-group label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  min-width: 28px;
  margin: 0;
  text-transform: none;
  letter-spacing: 0;
}

.size-input {
  flex: 1;
  padding: 0;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  text-align: center;
  outline: none;
  min-width: 0;
  width: 100%;
}

.size-unit {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  min-width: 18px;
}

.name-input {
  width: 100%;
  padding: 11px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  transition: all 0.2s;
  box-sizing: border-box;
}

.name-input:focus {
  outline: none;
  border-color: rgba(102, 126, 234, 0.5);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.name-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.prompt-textarea {
  width: 100%;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  transition: all 0.2s;
  box-sizing: border-box;
  line-height: 1.5;
}

.prompt-textarea:focus {
  outline: none;
  border-color: rgba(102, 126, 234, 0.5);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.prompt-textarea::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 0;
}

.slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  outline: none;
  cursor: pointer;
  position: relative;
  margin: 0;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: linear-gradient(145deg, #818cf8 0%, #6366f1 100%);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 6px rgba(99, 102, 241, 0.4);
  margin-top: -5px;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 3px 10px rgba(99, 102, 241, 0.5);
}

.slider::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 10px;
}

.slider-value {
  min-width: 48px;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  background: rgba(255, 255, 255, 0.04);
  padding: 4px 8px;
  border-radius: 6px;
}

.toggle-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.08);
  transition: 0.25s ease;
  border-radius: 26px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 2px;
  bottom: 2px;
  background: rgba(255, 255, 255, 0.9);
  transition: 0.25s ease;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle input:checked + .toggle-slider {
  background: linear-gradient(145deg, #818cf8 0%, #6366f1 100%);
  border-color: transparent;
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.3);
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

.toggle-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.color-picker-container {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 8px 12px;
}

.color-picker {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: transparent;
  padding: 0;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.color-preview {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.color-value {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  text-transform: uppercase;
}

.setting-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.btn {
  padding: 11px 22px;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(145deg, #818cf8 0%, #6366f1 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
}

.btn-danger {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 8px 14px;
  font-size: 12px;
}

.btn-danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.35);
}

.btn-danger:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.memory-section,
.ai-provider-section {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.memory-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.memory-count {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
}

.provider-type-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.provider-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.provider-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
}

.provider-btn.active {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.4);
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.2);
}

.provider-icon {
  font-size: 24px;
}

.provider-name {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.provider-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.5);
}

.provider-status.available {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.provider-config {
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.config-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.config-row:last-child {
  margin-bottom: 0;
}

.config-row label {
  min-width: 70px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  text-transform: none;
  letter-spacing: 0;
}

.config-input {
  flex: 1;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  transition: all 0.2s;
}

.config-input:focus {
  outline: none;
  border-color: rgba(102, 126, 234, 0.5);
  background: rgba(255, 255, 255, 0.06);
}

.config-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}
</style>
