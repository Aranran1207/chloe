<template>
  <div ref="containerRef" class="live2d-container" 
       @mousedown="handleMouseDown" 
       @mousemove="handleMouseMove"
       @mouseup="handleMouseUp" 
       @mouseleave="handleMouseUp" 
       @contextmenu.prevent="showContextMenu">
    <canvas ref="canvasRef" class="live2d-canvas"></canvas>

    <div v-if="showMenu" class="context-menu" :style="{ left: menuX + 'px', top: menuY + 'px' }">
      <div class="menu-item" @click="quitApp">退出</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ChloeLive2D } from '../lib/chloe';

const containerRef = ref<HTMLDivElement>();
const canvasRef = ref<HTMLCanvasElement>();
const showMenu = ref(false);
const menuX = ref(0);
const menuY = ref(0);
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
  // 关键：用容器的尺寸（窗口内的Live2D容器），不是整个文档
  const { clientWidth, clientHeight } = containerRef.value;

  // 防止重复设置导致尺寸无限放大
  if (canvasRef.value.width === clientWidth * dpr && canvasRef.value.height === clientHeight * dpr) {
    return;
  }

  // 设置真实像素尺寸
  canvasRef.value.width = clientWidth * dpr;
  canvasRef.value.height = clientHeight * dpr;
  
  // 设置显示尺寸
  canvasRef.value.style.width = `${clientWidth}px`;
  canvasRef.value.style.height = `${clientHeight}px`;
};

const handleMouseDown = (e: MouseEvent) => {
  showMenu.value = false;
  isMouseDown = true;
  isDragging = false;
  hasWindowPosition = false;

  if (window.electronAPI) {
    window.electronAPI.getWindowPosition().then(([x, y]) => {
      winStartX = x;
      winStartY = y;
      startX = e.screenX;
      startY = e.screenY;
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
  showMenu.value = true;
  menuX.value = e.clientX;
  menuY.value = e.clientY;
};

const quitApp = () => {
  showMenu.value = false;
  if (window.electronAPI) {
    window.electronAPI.quitApp();
  }
};

onMounted(() => {
  if (canvasRef.value && containerRef.value) {
    resizeCanvas();

    console.log('[Chloe] Initializing Live2D...');
    chloe = ChloeLive2D.getInstance();

    const initSuccess = chloe.initialize(canvasRef.value);
    console.log('[Chloe] Initialize result:', initSuccess);

    if (initSuccess) {
      const modelPath = './resources/藿藿/';
      const modelFile = '藿藿.model3.json';
      console.log('[Chloe] Loading model from:', modelPath + modelFile);

      chloe.loadModel(modelPath, modelFile);
      chloe.start();

      console.log('[Chloe] Live2D started successfully');
    }

    canvasRef.value.addEventListener('click', (e) => {
      const rect = canvasRef.value!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dpr = window.devicePixelRatio || 1;
      chloe?.onTap(x * dpr, y * dpr);
    });
  }
});

onUnmounted(() => {
  if (chloe) {
    chloe.stop();
    chloe.release();
  }
});
</script>

<style scoped>
.live2d-container {
  width: 500px;
  height: 800px;
  position: relative;
  cursor: default;
  overflow: hidden;
  z-index: 999;
}

.live2d-canvas {
  display: block;
  width: 500px;
  height: 800px;
}

.context-menu {
  position: absolute;
  background: rgba(30, 30, 30, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 8px 0;
  z-index: 1000;
  min-width: 120px;
}

.menu-item {
  padding: 10px 20px;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>