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
            <label>气泡透明度</label>
            <div class="slider-container">
              <input 
                type="range" 
                v-model.number="bubbleOpacity" 
                min="0.3" 
                max="1.0" 
                step="0.05"
                class="slider"
                @mousedown.stop="startSliding"
                @mouseup="stopSliding"
                @touchstart.stop="startSliding"
                @touchend="stopSliding"
              />
              <span class="slider-value">{{ (bubbleOpacity * 100).toFixed(0) }}%</span>
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
import { ref, watch } from 'vue';

const props = defineProps<{
  visible: boolean;
  currentPath: string;
  currentScale: number;
  currentOffsetX: number;
  currentOffsetY: number;
  currentBubbleColor: string;
  currentBubbleOpacity: number;
  currentEyeTracking: boolean;
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
    bubbleOpacity: number;
    eyeTracking: boolean;
  }];
  updateTransform: [settings: {
    scale: number;
    offsetX: number;
    offsetY: number;
  }];
}>();

const modelPath = ref(props.currentPath);
const modelScale = ref(props.currentScale);
const modelOffsetX = ref(props.currentOffsetX);
const modelOffsetY = ref(props.currentOffsetY);
const bubbleColor = ref(props.currentBubbleColor);
const bubbleOpacity = ref(props.currentBubbleOpacity);
const eyeTracking = ref(props.currentEyeTracking);
const isSliding = ref(false);

watch(() => props.visible, (visible) => {
  if (visible) {
    modelPath.value = props.currentPath;
    modelScale.value = props.currentScale;
    modelOffsetX.value = props.currentOffsetX;
    modelOffsetY.value = props.currentOffsetY;
    bubbleColor.value = props.currentBubbleColor || '#8b5cf6';
    bubbleOpacity.value = props.currentBubbleOpacity ?? 0.95;
    eyeTracking.value = props.currentEyeTracking ?? true;
  }
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

const saveSettings = () => {
  emit('save', {
    path: modelPath.value,
    scale: modelScale.value,
    offsetX: modelOffsetX.value,
    offsetY: modelOffsetY.value,
    bubbleColor: bubbleColor.value,
    bubbleOpacity: bubbleOpacity.value,
    eyeTracking: eyeTracking.value
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
