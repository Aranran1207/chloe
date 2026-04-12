<template>
  <Transition name="panel-fade">
    <div v-if="visible" class="settings-overlay" :class="{ 'is-sliding': isSliding }" @click.self="$emit('cancel')">
      <div class="settings-panel" :class="{ 'is-sliding': isSliding }">
        <div class="panel-header">
          <h2>设置</h2>
          <button class="close-btn" @click="$emit('close')">
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
            <label>模型缩放比例</label>
            <div class="slider-container">
              <input 
                type="range" 
                v-model.number="modelScale" 
                min="0.5" 
                max="2.0" 
                step="0.1"
                class="slider"
                @mousedown.stop="startSliding"
                @mouseup="stopSliding"
                @touchstart.stop="startSliding"
                @touchend="stopSliding"
                @input="updateTransform"
              />
              <span class="slider-value">{{ modelScale.toFixed(1) }}x</span>
            </div>
          </div>
          
          <div class="setting-group">
            <label>水平位置偏移</label>
            <div class="slider-container">
              <input 
                type="range" 
                v-model.number="modelOffsetX" 
                min="-2.0" 
                max="2.0" 
                step="0.1"
                class="slider"
                @mousedown.stop="startSliding"
                @mouseup="stopSliding"
                @touchstart.stop="startSliding"
                @touchend="stopSliding"
                @input="updateTransform"
              />
              <span class="slider-value">{{ modelOffsetX.toFixed(1) }}</span>
            </div>
          </div>
          
          <div class="setting-group">
            <label>垂直位置偏移</label>
            <div class="slider-container">
              <input 
                type="range" 
                v-model.number="modelOffsetY" 
                min="-1.0" 
                max="1.0" 
                step="0.1"
                class="slider"
                @mousedown.stop="startSliding"
                @mouseup="stopSliding"
                @touchstart.stop="startSliding"
                @touchend="stopSliding"
                @input="updateTransform"
              />
              <span class="slider-value">{{ modelOffsetY.toFixed(1) }}</span>
            </div>
          </div>
          
          <div class="setting-group">
            <label>气泡颜色</label>
            <div class="color-picker-container">
              <input 
                type="color" 
                v-model="bubbleColor" 
                class="color-picker"
              />
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
            <button class="btn btn-secondary" @click="$emit('cancel')">取消</button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';

const props = defineProps<{
  visible: boolean;
  currentPath: string;
  currentScale: number;
  currentOffsetX: number;
  currentOffsetY: number;
  currentBubbleColor: string;
  currentEyeTracking: boolean;
  currentSystemPrompt?: string;
  currentGirlfriendName?: string;
}>();

const emit = defineEmits<{
  close: [];
  cancel: [];
  save: [settings: {
    path: string;
    scale: number;
    offsetX: number;
    offsetY: number;
    bubbleColor: string;
    eyeTracking: boolean;
    systemPrompt: string;
    girlfriendName: string;
  }];
  updateTransform: [settings: {
    scale: number;
    offsetX: number;
    offsetY: number;
  }];
  clearMemories: [];
}>();

const modelPath = ref(props.currentPath);
const modelScale = ref(props.currentScale);
const modelOffsetX = ref(props.currentOffsetX);
const modelOffsetY = ref(props.currentOffsetY);
const bubbleColor = ref(props.currentBubbleColor);
const eyeTracking = ref(props.currentEyeTracking);
const systemPrompt = ref('');
const girlfriendName = ref('');
const isSliding = ref(false);
const memoryCount = ref(0);

const loadMemoryCount = async () => {
  if (window.electronAPI?.memory) {
    try {
      const stats = await window.electronAPI.memory.getStats();
      memoryCount.value = stats.totalMemories || 0;
    } catch (error) {
      console.warn('[Settings] 获取记忆统计失败:', error);
    }
  }
};

watch(() => props.visible, (visible) => {
  if (visible) {
    modelPath.value = props.currentPath;
    modelScale.value = props.currentScale;
    modelOffsetX.value = props.currentOffsetX;
    modelOffsetY.value = props.currentOffsetY;
    bubbleColor.value = props.currentBubbleColor || '#8b5cf6';
    eyeTracking.value = props.currentEyeTracking ?? true;
    systemPrompt.value = props.currentSystemPrompt || '';
    girlfriendName.value = props.currentGirlfriendName || '';
    loadMemoryCount();
  }
});

onMounted(() => {
  loadMemoryCount();
});

const startSliding = () => {
  isSliding.value = true;
};

const stopSliding = () => {
  isSliding.value = false;
};

const updateTransform = () => {
  emit('updateTransform', {
    scale: modelScale.value,
    offsetX: modelOffsetX.value,
    offsetY: modelOffsetY.value
  });
};

const browseFolder = async () => {
  if (window.electronAPI && window.electronAPI.openFolderDialog) {
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
        emit('clearMemories');
        console.log('[Settings] 已清空所有记忆，共删除', result.count, '条');
      }
    } catch (error) {
      console.error('[Settings] 清空记忆失败:', error);
    }
  }
};

const saveSettings = () => {
  emit('save', {
    path: modelPath.value,
    scale: modelScale.value,
    offsetX: modelOffsetX.value,
    offsetY: modelOffsetY.value,
    bubbleColor: bubbleColor.value,
    eyeTracking: eyeTracking.value,
    systemPrompt: systemPrompt.value,
    girlfriendName: girlfriendName.value
  });
  emit('close');
};
</script>

<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  transition: all 0.3s ease;
}

.settings-overlay.is-sliding {
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(1px);
}

.settings-panel {
  background: linear-gradient(135deg, rgba(40, 40, 50, 0.98) 0%, rgba(30, 30, 40, 0.99) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 450px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
}

.settings-panel.is-sliding {
  background: linear-gradient(135deg, rgba(40, 40, 50, 0.3) 0%, rgba(30, 30, 40, 0.4) 100%);
  border-color: rgba(255, 255, 255, 0.05);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  background: linear-gradient(135deg, rgba(40, 40, 50, 0.98) 0%, rgba(30, 30, 40, 0.99) 100%);
  z-index: 1;
  transition: all 0.3s ease;
}

.settings-panel.is-sliding .panel-header {
  background: linear-gradient(135deg, rgba(40, 40, 50, 0.3) 0%, rgba(30, 30, 40, 0.4) 100%);
  border-bottom-color: rgba(255, 255, 255, 0.05);
}

.panel-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 100, 100, 0.2);
}

.close-btn svg {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.7);
}

.panel-content {
  padding: 24px;
}

.setting-group {
  margin-bottom: 24px;
}

.setting-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 12px;
}

.input-group {
  display: flex;
  gap: 12px;
}

.input-group input {
  flex: 1;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  transition: all 0.2s;
}

.input-group input:focus {
  outline: none;
  border-color: rgba(100, 150, 255, 0.5);
  background: rgba(255, 255, 255, 0.08);
}

.input-group input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.browse-btn {
  padding: 12px 20px;
  background: rgba(100, 150, 255, 0.15);
  border: 1px solid rgba(100, 150, 255, 0.3);
  border-radius: 8px;
  color: #64b5f6;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.browse-btn:hover {
  background: rgba(100, 150, 255, 0.25);
  border-color: rgba(100, 150, 255, 0.5);
}

.hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.name-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  transition: all 0.2s;
  box-sizing: border-box;
}

.name-input:focus {
  outline: none;
  border-color: rgba(100, 150, 255, 0.5);
  background: rgba(255, 255, 255, 0.08);
}

.name-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.prompt-textarea {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  transition: all 0.2s;
  box-sizing: border-box;
}

.prompt-textarea:focus {
  outline: none;
  border-color: rgba(100, 150, 255, 0.5);
  background: rgba(255, 255, 255, 0.08);
}

.prompt-textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.slider::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}

.slider-value {
  min-width: 50px;
  text-align: right;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  font-family: 'Monaco', 'Menlo', monospace;
}

.toggle-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 50px;
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
  background-color: rgba(255, 255, 255, 0.1);
  transition: 0.3s;
  border-radius: 26px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle input:checked + .toggle-slider {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.toggle-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.setting-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.btn-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 8px 16px;
  font-size: 13px;
}

.btn-danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.5);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.memory-section {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.memory-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.memory-count {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: all 0.3s ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
}

.panel-fade-enter-from .settings-panel,
.panel-fade-leave-to .settings-panel {
  transform: scale(0.95) translateY(20px);
}
</style>
