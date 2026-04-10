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
let isDragging = false;
let startX = 0; // 鼠标按下时的客户端X
let startY = 0; // 鼠标按下时的客户端Y
let winStartX = 0; // 窗口初始X坐标
let winStartY = 0; // 窗口初始Y坐标
const DRAG_THRESHOLD = 5; // 拖拽阈值

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
  // 记录鼠标初始位置（相对客户端）
  startX = e.clientX;
  startY = e.clientY;
  isDragging = false;

  // 修复：先获取窗口初始位置（从Electron API拿）
  if (window.electronAPI) {
    // 新增：获取窗口当前位置，存到winStartX/winStartY
    window.electronAPI.getWindowPosition().then(([x, y]) => {
      winStartX = x;
      winStartY = y;
    });
    // 注释掉：不再直接传screenX，改在mousemove计算偏移
  }
};

const handleMouseMove = (e: MouseEvent) => {
  // 计算鼠标位移，判断是否触发拖拽
  const dx = Math.abs(e.clientX - startX);
  const dy = Math.abs(e.clientY - startY);

  // 未触发拖拽且超过阈值
  if (!isDragging && (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD)) {
    isDragging = true;
  }

  // 仅当拖拽状态时，计算窗口新位置
  if (isDragging && window.electronAPI) {
    // 修复：计算窗口偏移（鼠标移动的距离 = 当前鼠标 - 初始鼠标）
    const offsetX = e.clientX - startX;
    const offsetY = e.clientY - startY;
    // 窗口新位置 = 初始窗口位置 + 鼠标偏移
    const newWinX = winStartX + offsetX;
    const newWinY = winStartY + offsetY;
    // 传递新位置给Electron，而不是鼠标的screen坐标
    window.electronAPI.setWindowPosition(newWinX, newWinY);
  }
};

const handleMouseUp = () => {
  isDragging = false; // 仅重置状态，不需要endDrag（因为改了拖拽逻辑）
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
    // 初始化Canvas尺寸
    resizeCanvas();
    // 修复：监听容器resize，不是window（避免窗口移动触发resize）
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(containerRef.value);

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

    // 存到全局，供onUnmounted销毁
    (window as any).resizeObserver = resizeObserver;
  }
});

onUnmounted(() => {
  // 销毁ResizeObserver，防止内存泄漏
  if ((window as any).resizeObserver) {
    (window as any).resizeObserver.disconnect();
  }
  if (chloe) {
    chloe.stop();
    chloe.release();
  }
});
</script>

<style scoped>
.live2d-container {
  width: 100%; /* 修复：用100%而不是100vw，避免超出窗口 */
  height: 100%; /* 修复：用100%而不是100vh，避免超出窗口 */
  position: relative; /* 修复：改为relative，避免fixed导致全屏 */
  cursor: default;
  overflow: hidden;
  z-index: 999;
}

.live2d-canvas {
  display: block;
  width: 100%; /* 显式设置，避免尺寸异常 */
  height: 100%;
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