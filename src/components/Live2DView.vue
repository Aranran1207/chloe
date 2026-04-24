<template>
  <div ref="containerRef" class="live2d-container" 
       :class="{ 'is-dragging': isDraggingWindow }"
       :style="{ width: windowWidth + 'px', height: windowHeight + 'px' }"
       @mousedown="handleMouseDown" 
       @mousemove="handleMouseMove"
       @mouseup="handleMouseUp" 
       @mouseleave="handleMouseUp"
       @dblclick="handleDoubleClick"
       @contextmenu.prevent="showContextMenu">
    <canvas ref="canvasRef" class="live2d-canvas" :style="{ width: windowWidth + 'px', height: windowHeight + 'px' }"></canvas>
    <div v-if="isDraggingWindow" class="drag-border"></div>
    
    <LoadingSpinner :visible="isLoading" :text="loadingText" />

    <ThinkingBubble 
      :visible="showThinking"
      :position="thinkingPosition"
    />

    <ChatBubble 
      :visible="showBubble"
      :text="bubbleText"
      :bubbleColor="bubbleColor"
      :streamMode="isStreaming"
      @disappear="showBubble = false"
    />
    
    <MemoryPanel 
      :visible="showMemoryPanel"
      @close="showMemoryPanel = false"
      @cleared="handleMemoryCleared"
    />
    
    <ChatInput 
      :visible="showChatInput"
      :bubbleColor="bubbleColor"
      @send="handleSendMessage"
      @cancel="showChatInput = false"
    />
    
    <Transition name="toast-fade">
      <div v-if="showSaveToast" class="save-toast">
        <svg class="toast-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>{{ saveToastText }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ChloeLive2D } from '../lib/chloe';
import { sendMessageStream, parseMotionTriggers } from '../lib/chatService';
import { MotionManager } from '../lib/motionManager';
import { proactiveEngine } from '../lib/memory/proactiveEngine';
import { memoryExtractor } from '../lib/memory/memoryExtractor';
import { memoryClient } from '../lib/memory/memoryClient';
import MemoryPanel from './MemoryPanel.vue';
import LoadingSpinner from './LoadingSpinner.vue';
import ChatBubble from './ChatBubble.vue';
import ChatInput from './ChatInput.vue';
import ThinkingBubble from './ThinkingBubble.vue';

const emit = defineEmits<{
  (e: 'window-size-change', width: number, height: number): void;
}>();

interface ModelInfo {
  name: string;
  path: string;
  file: string;
}

const containerRef = ref<HTMLDivElement>();
const canvasRef = ref<HTMLCanvasElement>();
const eyeTrackingEnabled = ref(true);
const modelBasePath = ref('./resources/');
const modelList = ref<ModelInfo[]>([]);
const currentModel = ref<ModelInfo | null>(null);
const isLoading = ref(true);
const loadingText = ref('正在加载模型...');
const modelScale = ref(1.0);
const modelOffsetX = ref(0.0);
const showSaveToast = ref(false);
const saveToastText = ref('保存成功');
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
const isDraggingWindow = ref(false);

const showChatInput = ref(false);
const showBubble = ref(false);
const bubbleText = ref('');
const isProcessing = ref(false);
const isStreaming = ref(false);
const bubbleColor = ref('#8b5cf6');
const systemPrompt = ref('');
const girlfriendName = ref('');

const showThinking = ref(false);
const thinkingPosition = ref({ x: 250, y: 350 });
const showMemoryPanel = ref(false);
const windowWidth = ref(500);
const windowHeight = ref(800);
const ignoreMouseEvents = ref(false);

let motionManager: MotionManager | null = null;

const handleProactiveQuestion = async (question: string) => {
  if (isProcessing.value || showBubble.value) {
    console.log('[Live2DView] 正在处理中，跳过主动提问');
    return;
  }
  
  console.log('[Live2DView] 收到主动提问:', question);
  
  const containerWidth = containerRef.value?.clientWidth || windowWidth.value;
  const containerHeight = containerRef.value?.clientHeight || windowHeight.value;
  thinkingPosition.value = {
    x: containerWidth / 2,
    y: containerHeight * 0.45
  };
  
  showThinking.value = true;
  isStreaming.value = true;
  bubbleText.value = question;
  
  setTimeout(() => {
    showThinking.value = false;
    showBubble.value = true;
  }, 500);
  
  isStreaming.value = false;
};

// 修复：Canvas 尺寸使用固定值，避免亚像素偏移导致容器不断扩张
const resizeCanvas = () => {
  if (!canvasRef.value || !containerRef.value) return;
  
  const dpr = window.devicePixelRatio || 1;
  const w = windowWidth.value;
  const h = windowHeight.value;

  if (canvasRef.value.width === w * dpr && canvasRef.value.height === h * dpr) {
    return;
  }

  canvasRef.value.width = w * dpr;
  canvasRef.value.height = h * dpr;
  
  canvasRef.value.style.width = `${w}px`;
  canvasRef.value.style.height = `${h}px`;
};

const handleMouseDown = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  const isInteractiveElement = target.closest('.chat-input-overlay, .memory-panel-overlay, input, button, textarea');
  if (isInteractiveElement) {
    return;
  }
  
  e.preventDefault();
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
    isDraggingWindow.value = true;
  }

  if (isDragging && window.electronAPI) {
    const offsetX = e.screenX - startX;
    const offsetY = e.screenY - startY;
    const newWinX = winStartX + offsetX;
    const newWinY = winStartY + offsetY;
    
    requestAnimationFrame(() => {
      window.electronAPI.setWindowPosition(newWinX, newWinY);
    });
  }
};

const handleMouseUp = () => {
  isMouseDown = false;
  isDragging = false;
  isDraggingWindow.value = false;
};

const handleDoubleClick = () => {
  showChatInput.value = !showChatInput.value;
};

const handleSendMessage = async (message: string) => {
  showChatInput.value = false;
  
  if (isProcessing.value) return;
  isProcessing.value = true;
  
  proactiveEngine.resetSession();
  
  const containerWidth = containerRef.value?.clientWidth || windowWidth.value;
  const containerHeight = containerRef.value?.clientHeight || windowHeight.value;
  thinkingPosition.value = {
    x: containerWidth / 2,
    y: containerHeight * 0.45
  };
  
  showThinking.value = true;
  
  isStreaming.value = true;
  bubbleText.value = '';
  
  const modelName = currentModel.value?.name || undefined;
  const availableMotions = motionManager?.getMotionListForAI();
  
  console.log('[Live2DView] 可用动作列表:', availableMotions);
  
  let fullResponse = '';
  
  try {
    await sendMessageStream(
      message, 
      (token) => {
        if (showThinking.value) {
          showThinking.value = false;
          showBubble.value = true;
        }
        fullResponse += token;
        const { cleanText } = parseMotionTriggers(fullResponse);
        bubbleText.value = cleanText;
      }, 
      systemPrompt.value || undefined,
      girlfriendName.value || undefined,
      modelName,
      availableMotions
    );
    
    const { cleanText, motions } = parseMotionTriggers(fullResponse);
    bubbleText.value = cleanText;
    
    if (motions.length > 0 && motionManager) {
      motions.forEach((motion, index) => {
        setTimeout(() => {
          motionManager?.playMotionByName(motion.name);
        }, index * 800);
      });
    }
  } finally {
    isProcessing.value = false;
    isStreaming.value = false;
    showThinking.value = false;
  }
};

const showContextMenu = async (e: MouseEvent) => {
  if (!window.electronAPI) return;
  
  const [winX, winY] = await window.electronAPI.getWindowPosition();
  const screenX = winX + e.clientX;
  const screenY = winY + e.clientY;
  
  window.electronAPI.showContextMenu(screenX, screenY);
};

const openSettings = () => {
  if (window.electronAPI) {
    window.electronAPI.showContextMenu(0, 0);
  }
};

const switchModel = async (model: ModelInfo) => {
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
      basePath += '\\';
    }
    const modelPath = basePath + model.path;
    chloe.loadModel(modelPath, model.file);
      chloe.start();
      
      setTimeout(() => {
        if (motionManager) {
          motionManager.setChloe(chloe!);
          console.log('[Live2DView] 动作管理器已更新');
          console.log('[Live2DView] 可用动作:', motionManager.getAvailableMotions());
        }
      }, 1000);
    }
  
  setTimeout(() => {
    isLoading.value = false;
  }, 500);
};

const handleMemoryCleared = () => {
  saveToastText.value = '记忆已清空';
  showSaveToast.value = true;
  setTimeout(() => {
    showSaveToast.value = false;
  }, 2000);
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
    if (config.bubbleColor !== undefined) {
      bubbleColor.value = config.bubbleColor;
    }
    if (config.systemPrompt !== undefined) {
      systemPrompt.value = config.systemPrompt;
    }
    if (config.girlfriendName !== undefined) {
      girlfriendName.value = config.girlfriendName;
    }
    if (config.eyeTracking !== undefined) {
      eyeTrackingEnabled.value = config.eyeTracking;
    }
    if (config.windowWidth !== undefined) {
      windowWidth.value = config.windowWidth;
    }
    if (config.windowHeight !== undefined) {
      windowHeight.value = config.windowHeight;
    }
    if (config.ignoreMouseEvents !== undefined) {
      ignoreMouseEvents.value = config.ignoreMouseEvents;
    }
    
    // 通知 App.vue 窗口尺寸
    emit('window-size-change', windowWidth.value, windowHeight.value);
    localStorage.setItem('chloeWindowSize', JSON.stringify({ 
      width: windowWidth.value, 
      height: windowHeight.value 
    }));
    
    if (config.aiProvider) {
      localStorage.setItem('aiProviderConfig', JSON.stringify(config.aiProvider));
      console.log('[Config] 从配置文件同步 AI Provider 配置:', config.aiProvider.type);
    }
    
    modelList.value = await window.electronAPI.getModelList();
    
    if (config.currentModel && modelList.value.length > 0) {
      const savedModel = modelList.value.find(m => m.name === config.currentModel.name);
      if (savedModel) {
        currentModel.value = savedModel;
      }
    }
    
    if (eyeTrackingEnabled.value) {
      window.electronAPI.startGlobalMouseTracking();
      window.electronAPI.onGlobalMouseMove((data) => {
        handleGlobalMouseMove(data);
      });
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
    await loadConfig();
    
    resizeCanvas();
    
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
      
      setTimeout(() => {
        motionManager = MotionManager.getInstance();
        motionManager.setChloe(chloe!);
        console.log('[Live2DView] 动作管理器已初始化');
        console.log('[Live2DView] 可用动作:', motionManager.getAvailableMotions());
      }, 1000);
      
      proactiveEngine.setQuestionCallback(handleProactiveQuestion);
      proactiveEngine.startProactiveMode(30);
      console.log('[Live2DView] 主动提问引擎已启动');
      
      // 挂载到 window 对象，方便在控制台中调试
      (window as any).proactiveEngine = proactiveEngine;
      (window as any).memoryExtractor = memoryExtractor;
      (window as any).memoryClient = memoryClient;
      console.log('[Live2DView] 调试工具已挂载到 window: proactiveEngine, memoryExtractor, memoryClient');
      
      // 监听鼠标穿透状态变化（从托盘菜单触发）
      if (window.electronAPI) {
        window.electronAPI.onIgnoreMouseEventsChanged((ignore: boolean) => {
          ignoreMouseEvents.value = ignore;
          console.log('[Live2DView] 鼠标穿透状态已同步:', ignore);
        });
        
        window.electronAPI.onEyeTrackingChanged((enabled: boolean) => {
          eyeTrackingEnabled.value = enabled;
          if (enabled) {
            window.electronAPI.startGlobalMouseTracking();
            window.electronAPI.onGlobalMouseMove((data) => {
              handleGlobalMouseMove(data);
            });
          } else {
            window.electronAPI.stopGlobalMouseTracking();
          }
          saveToastText.value = enabled ? '已开启注视鼠标' : '已关闭注视鼠标';
          showSaveToast.value = true;
          setTimeout(() => { showSaveToast.value = false; }, 2000);
        });
        
        window.electronAPI.onOpenMemoryPanel(() => {
          showMemoryPanel.value = true;
        });
        
        window.electronAPI.onModelChanged((model: ModelInfo) => {
          switchModel(model);
        });
        
        window.electronAPI.onSettingsSaved((settings: any) => {
          loadConfig();
          if (chloe) {
            chloe.setModelTransform(modelScale.value, modelOffsetX.value, modelOffsetY.value);
          }
          saveToastText.value = '保存成功';
          showSaveToast.value = true;
          setTimeout(() => { showSaveToast.value = false; }, 2000);
        });
      }
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
  proactiveEngine.stopProactiveMode();
  
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
  position: relative !important;
  cursor: default;
  overflow: hidden;
  z-index: 999;
}

.live2d-canvas {
  display: block;
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

.drag-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 3px solid transparent;
  border-radius: 0;
  pointer-events: none;
  z-index: 9999;
  animation: borderGlow 0.6s ease-in-out infinite alternate;
}

@keyframes borderGlow {
  0% {
    border-color: rgba(102, 126, 234, 0.8);
    box-shadow: 
      0 0 10px rgba(102, 126, 234, 0.5),
      0 0 20px rgba(102, 126, 234, 0.3),
      inset 0 0 10px rgba(102, 126, 234, 0.2);
  }
  50% {
    border-color: rgba(118, 75, 162, 0.9);
    box-shadow: 
      0 0 15px rgba(118, 75, 162, 0.6),
      0 0 30px rgba(118, 75, 162, 0.4),
      inset 0 0 15px rgba(118, 75, 162, 0.3);
  }
  100% {
    border-color: rgba(102, 126, 234, 0.8);
    box-shadow: 
      0 0 10px rgba(102, 126, 234, 0.5),
      0 0 20px rgba(102, 126, 234, 0.3),
      inset 0 0 10px rgba(102, 126, 234, 0.2);
  }
}

.live2d-container.is-dragging {
  cursor: grabbing;
}

.save-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.95) 0%, rgba(22, 163, 74, 0.95) 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 8px 32px rgba(34, 197, 94, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 9999;
}

.toast-icon {
  width: 18px;
  height: 18px;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}
</style>