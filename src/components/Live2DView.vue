<template>
  <div ref="containerRef" class="live2d-container" 
       @mousedown="handleMouseDown" 
       @mousemove="handleMouseMove"
       @mouseup="handleMouseUp" 
       @mouseleave="handleMouseUp" 
       @contextmenu.prevent="showContextMenu">
    <canvas ref="canvasRef" class="live2d-canvas"></canvas>
    
    <LoadingSpinner :visible="isLoading" :text="loadingText" />

    <Transition name="menu-fade">
      <div v-if="showMenu" class="context-menu" :style="{ left: menuX + 'px', top: menuY + 'px' }">
        <div class="menu-item" @click="toggleEyeTracking">
          <svg class="menu-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
          </svg>
          <span>{{ eyeTrackingEnabled ? '关闭注视' : '注视鼠标' }}</span>
          <div v-if="eyeTrackingEnabled" class="status-dot"></div>
        </div>
        
        <div class="menu-item" @click="showModelSwitcher">
          <svg class="menu-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 3H21V8M21 3L14 10M8 21H3V16M3 21L10 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>切换模型</span>
          <svg class="menu-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        
        <div class="menu-item" @click="openSettings">
          <svg class="menu-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" stroke-width="2"/>
          </svg>
          <span>设置</span>
        </div>
        
        <div class="menu-divider"></div>
        <div class="menu-item menu-item-danger" @click="quitApp">
          <svg class="menu-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>退出程序</span>
        </div>
      </div>
    </Transition>
    
    <Transition name="menu-fade">
      <div v-if="showModelMenu" class="context-menu model-menu" :style="{ left: modelMenuX + 'px', top: modelMenuY + 'px' }">
        <div v-for="model in modelList" :key="model.name" 
             class="menu-item" 
             :class="{ 'menu-item-active': currentModel?.name === model.name }"
             @click="switchModel(model)">
          <span>{{ model.name }}</span>
          <div v-if="currentModel?.name === model.name" class="status-dot"></div>
        </div>
        <div v-if="modelList.length === 0" class="menu-item menu-item-disabled">
          <span>暂无模型</span>
        </div>
      </div>
    </Transition>
    
    <SettingsPanel 
      :visible="showSettings" 
      :currentPath="modelBasePath"
      :currentScale="modelScale"
      :currentOffsetX="modelOffsetX"
      :currentOffsetY="modelOffsetY"
      @close="showSettings = false"
      @cancel="handleCancelSettings"
      @save="handleSaveSettings"
      @updateTransform="handleUpdateTransform"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ChloeLive2D } from '../lib/chloe';
import SettingsPanel from './SettingsPanel.vue';
import LoadingSpinner from './LoadingSpinner.vue';

interface ModelInfo {
  name: string;
  path: string;
  file: string;
}

const containerRef = ref<HTMLDivElement>();
const canvasRef = ref<HTMLCanvasElement>();
const showMenu = ref(false);
const menuX = ref(0);
const menuY = ref(0);
const eyeTrackingEnabled = ref(false);
const showSettings = ref(false);
const showModelMenu = ref(false);
const modelMenuX = ref(0);
const modelMenuY = ref(0);
const modelBasePath = ref('./resources/');
const modelList = ref<ModelInfo[]>([]);
const currentModel = ref<ModelInfo | null>(null);
const isLoading = ref(true);
const loadingText = ref('正在加载模型...');
const modelScale = ref(1.0);
const modelOffsetX = ref(0.0);
const modelOffsetY = ref(-0.3);
let chloe: typeof ChloeLive2D | null = null;
let isMouseDown = false;
let isDragging = false;
let hasWindowPosition = false;
let startX = 0;
let startY = 0;
let winStartX = 0;
let winStartY = 0;
const DRAG_THRESHOLD = 5;

// 修复：Canvas 尺寸绑定到容器（不是document），避免窗口变大
const resizeCanvas = () => {
  if (!canvasRef.value || !containerRef.value) return;
  
  const dpr = window.devicePixelRatio || 1;
  const { clientWidth, clientHeight } = containerRef.value;

  if (canvasRef.value.width === clientWidth * dpr && canvasRef.value.height === clientHeight * dpr) {
    return;
  }

  canvasRef.value.width = clientWidth * dpr;
  canvasRef.value.height = clientHeight * dpr;
  
  canvasRef.value.style.width = `${clientWidth}px`;
  canvasRef.value.style.height = `${clientHeight}px`;
};

const handleMouseDown = (e: MouseEvent) => {
  if (e.button === 0 && (showMenu.value || showModelMenu.value)) {
    showMenu.value = false;
    showModelMenu.value = false;
    return;
  }
  
  e.preventDefault();
  showMenu.value = false;
  showModelMenu.value = false;
  isMouseDown = true;
  isDragging = false;
  hasWindowPosition = false;

  const currentScreenX = e.screenX;
  const currentScreenY = e.screenY;

  if (window.electronAPI) {
    window.electronAPI.getWindowPosition().then(([x, y]) => {
      winStartX = x;
      winStartY = y;
      startX = currentScreenX;
      startY = currentScreenY;
      hasWindowPosition = true;
    });
  }
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isMouseDown || !hasWindowPosition) return;

  const dx = Math.abs(e.screenX - startX);
  const dy = Math.abs(e.screenY - startY);

  if (!isDragging && (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD)) {
    isDragging = true;
  }

  if (isDragging && window.electronAPI) {
    const offsetX = e.screenX - startX;
    const offsetY = e.screenY - startY;
    const newWinX = winStartX + offsetX;
    const newWinY = winStartY + offsetY;
    window.electronAPI.setWindowPosition(newWinX, newWinY);
  }
};

const handleMouseUp = () => {
  isMouseDown = false;
  isDragging = false;
};

const showContextMenu = (e: MouseEvent) => {
  const menuWidth = 170;
  const menuHeight = 200;
  const padding = 10;
  
  let x = e.clientX;
  let y = e.clientY;
  
  if (x + menuWidth + padding > 500) {
    x = 500 - menuWidth - padding;
  }
  
  if (y + menuHeight + padding > 800) {
    y = 800 - menuHeight - padding;
  }
  
  x = Math.max(padding, x);
  y = Math.max(padding, y);
  
  menuX.value = x;
  menuY.value = y;
  showMenu.value = true;
};

const quitApp = () => {
  showMenu.value = false;
  showModelMenu.value = false;
  if (window.electronAPI) {
    window.electronAPI.quitApp();
  }
};

const openSettings = () => {
  showMenu.value = false;
  showSettings.value = true;
};

const showModelSwitcher = async () => {
  showMenu.value = false;
  
  if (window.electronAPI) {
    modelList.value = await window.electronAPI.getModelList();
  }
  
  const modelMenuWidth = 150;
  const modelMenuHeight = Math.min(modelList.value.length * 40 + 16, 300);
  const padding = 10;
  
  let x = menuX.value + 170;
  let y = menuY.value - 50;
  
  if (x + modelMenuWidth + padding > 500) {
    x = menuX.value - modelMenuWidth - 10;
  }
  
  if (y + modelMenuHeight + padding > 800) {
    y = 800 - modelMenuHeight - padding;
  }
  
  y = Math.max(padding, y);
  
  modelMenuX.value = x;
  modelMenuY.value = y;
  showModelMenu.value = true;
};

const switchModel = async (model: ModelInfo) => {
  showModelMenu.value = false;
  
  if (!chloe) return;
  
  currentModel.value = model;
  loadingText.value = `正在加载 ${model.name}...`;
  isLoading.value = true;
  
  if (window.electronAPI) {
    await window.electronAPI.setConfig({ 
      currentModel: {
        name: model.name,
        path: model.path,
        file: model.file
      }
    });
  }
  
  chloe.stop();
  chloe.release();
  
  chloe = ChloeLive2D.getInstance();
  if (chloe.initialize(canvasRef.value!)) {
    let basePath = modelBasePath.value;
    if (!basePath.endsWith('/') && !basePath.endsWith('\\')) {
      basePath += '/';
    }
    const modelPath = basePath + model.path;
    chloe.loadModel(modelPath, model.file);
    chloe.start();
  }
  
  setTimeout(() => {
    isLoading.value = false;
  }, 500);
};

const handleSaveSettings = async (settings: { 
  path: string; 
  scale: number; 
  offsetX: number; 
  offsetY: number;
}) => {
  let normalizedPath = settings.path;
  if (!normalizedPath.endsWith('/') && !normalizedPath.endsWith('\\')) {
    normalizedPath += '/';
  }
  
  modelBasePath.value = normalizedPath;
  modelScale.value = settings.scale;
  modelOffsetX.value = settings.offsetX;
  modelOffsetY.value = settings.offsetY;
  
  if (window.electronAPI) {
    await window.electronAPI.setConfig({ 
      modelPath: normalizedPath,
      modelScale: settings.scale,
      modelOffsetX: settings.offsetX,
      modelOffsetY: settings.offsetY
    });
  }
  
  if (chloe) {
    chloe.setModelTransform(settings.scale, settings.offsetX, settings.offsetY);
  }
  
  modelList.value = await window.electronAPI.getModelList();
};

const handleUpdateTransform = (settings: { 
  scale: number; 
  offsetX: number; 
  offsetY: number;
}) => {
  if (chloe) {
    chloe.setModelTransform(settings.scale, settings.offsetX, settings.offsetY);
  }
};

const handleCancelSettings = () => {
  showSettings.value = false;
  if (chloe) {
    chloe.setModelTransform(modelScale.value, modelOffsetX.value, modelOffsetY.value);
  }
};

const loadConfig = async () => {
  if (window.electronAPI) {
    const config = await window.electronAPI.getConfig();
    if (config.modelPath) {
      let path = config.modelPath;
      if (!path.endsWith('/') && !path.endsWith('\\')) {
        path += '/';
      }
      modelBasePath.value = path;
    }
    if (config.modelScale !== undefined) {
      modelScale.value = config.modelScale;
    }
    if (config.modelOffsetX !== undefined) {
      modelOffsetX.value = config.modelOffsetX;
    }
    if (config.modelOffsetY !== undefined) {
      modelOffsetY.value = config.modelOffsetY;
    }
    modelList.value = await window.electronAPI.getModelList();
    
    if (config.currentModel && modelList.value.length > 0) {
      const savedModel = modelList.value.find(m => m.name === config.currentModel.name);
      if (savedModel) {
        currentModel.value = savedModel;
      }
    }
  }
};

const toggleEyeTracking = () => {
  showMenu.value = false;
  eyeTrackingEnabled.value = !eyeTrackingEnabled.value;
  
  if (eyeTrackingEnabled.value) {
    if (window.electronAPI) {
      window.electronAPI.startGlobalMouseTracking();
      window.electronAPI.onGlobalMouseMove((data) => {
        handleGlobalMouseMove(data);
      });
    }
  } else {
    if (window.electronAPI) {
      window.electronAPI.stopGlobalMouseTracking();
    }
  }
};

const handleGlobalMouseMove = async (data: { x: number; y: number }) => {
  if (!eyeTrackingEnabled.value || !chloe || !canvasRef.value) return;

  if (window.electronAPI) {
    try {
      const [winX, winY] = await window.electronAPI.getWindowPosition();
      const canvasRect = canvasRef.value.getBoundingClientRect();
      const canvasCenterX = winX + canvasRect.width / 2;
      const canvasCenterY = winY + canvasRect.height / 2;
      
      const relativeX = data.x - canvasCenterX;
      const relativeY = data.y - canvasCenterY;
      
      const normalizedX = relativeX / (canvasRect.width / 2);
      const normalizedY = relativeY / (canvasRect.height / 2);
      
      const clampedX = Math.max(-1, Math.min(1, normalizedX));
      const clampedY = Math.max(-1, Math.min(1, -normalizedY));
      
      chloe.setDragging(clampedX, clampedY);
    } catch (error) {
      // 静默处理错误
    }
  }
};

onMounted(async () => {
  if (canvasRef.value && containerRef.value) {
    resizeCanvas();
    
    await loadConfig();
    
    if (currentModel.value) {
      loadingText.value = `正在加载 ${currentModel.value.name}...`;
    }
    isLoading.value = true;

    chloe = ChloeLive2D.getInstance();
    const initSuccess = chloe.initialize(canvasRef.value);

    if (initSuccess) {
      if (modelList.value.length > 0) {
        const modelToLoad = currentModel.value || modelList.value[0];
        currentModel.value = modelToLoad;
        let basePath = modelBasePath.value;
        if (!basePath.endsWith('/') && !basePath.endsWith('\\')) {
          basePath += '/';
        }
        const modelPath = basePath + modelToLoad.path;
        chloe.loadModel(modelPath, modelToLoad.file);
      } else {
        const modelPath = './resources/藿藿/';
        const modelFile = '藿藿.model3.json';
        chloe.loadModel(modelPath, modelFile);
      }
      
      chloe.setModelTransform(modelScale.value, modelOffsetX.value, modelOffsetY.value);
      chloe.start();
    }

    canvasRef.value.addEventListener('click', (e) => {
      const rect = canvasRef.value!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dpr = window.devicePixelRatio || 1;
      chloe?.onTap(x * dpr, y * dpr);
    });
    
    setTimeout(() => {
      isLoading.value = false;
    }, 800);
  }
});

onUnmounted(() => {
  if (window.electronAPI) {
    window.electronAPI.stopGlobalMouseTracking();
  }
  
  if (chloe) {
    chloe.stop();
    chloe.releaseAll();
  }
});
</script>

<style scoped>
.live2d-container {
  width: 500px !important;
  height: 800px !important;
  position: relative !important;
  cursor: default;
  overflow: hidden;
  z-index: 999;
}

.live2d-canvas {
  display: block;
  width: 500px !important;
  height: 800px !important;
}

.context-menu {
  position: absolute;
  background: linear-gradient(135deg, rgba(40, 40, 50, 0.95) 0%, rgba(30, 30, 40, 0.98) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 8px 0;
  z-index: 1000;
  min-width: 160px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4),
              0 2px 8px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
  user-select: none;
}

.menu-item:hover {
  background: linear-gradient(90deg, rgba(100, 150, 255, 0.15) 0%, rgba(100, 150, 255, 0.05) 100%);
  color: #64b5f6;
}

.menu-item-danger:hover {
  background: linear-gradient(90deg, rgba(255, 100, 100, 0.15) 0%, rgba(255, 100, 100, 0.05) 100%);
  color: #ff6b6b;
}

.menu-item:hover .menu-icon {
  transform: rotate(90deg);
}

.menu-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.menu-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  margin: 4px 0;
}

.menu-arrow {
  width: 16px;
  height: 16px;
  margin-left: auto;
  color: rgba(255, 255, 255, 0.4);
}

.model-menu {
  max-height: 300px;
  overflow-y: auto;
}

.menu-item-active {
  background: rgba(100, 150, 255, 0.1);
}

.menu-item-disabled {
  color: rgba(255, 255, 255, 0.3);
  cursor: not-allowed;
}

.menu-item-disabled:hover {
  background: transparent;
  color: rgba(255, 255, 255, 0.3);
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #4ade80;
  border-radius: 50%;
  margin-left: auto;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: all 0.2s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-5px);
}
</style>