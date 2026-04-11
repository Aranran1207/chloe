<template>
  <Transition name="bubble-pop" @after-leave="onAfterLeave">
    <div v-if="visible" class="chat-bubble" :style="bubbleStyle">
      <div class="bubble-glow" :style="glowStyle"></div>
      <div class="bubble-content" :style="contentStyle">
        <div class="bubble-inner">
          <span class="bubble-text">{{ displayText }}</span>
          <div v-if="isTyping" class="typing-indicator">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </div>
      <div class="bubble-tail">
        <svg viewBox="0 0 20 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 12L0 0H20L10 12Z" :fill="tailColor"/>
        </svg>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';

const props = defineProps<{
  visible: boolean;
  text: string;
  position: { x: number; y: number };
  bubbleColor?: string;
  bubbleOpacity?: number;
}>();

const emit = defineEmits<{
  disappear: [];
}>();

const displayText = ref('');
const isTyping = ref(false);
let typingTimer: number | null = null;
let disappearTimer: number | null = null;

const color = computed(() => props.bubbleColor || '#8b5cf6');
const opacity = computed(() => props.bubbleOpacity ?? 0.95);

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const darkenColor = (hex: string, factor: number) => {
  const r = Math.floor(parseInt(hex.slice(1, 3), 16) * factor);
  const g = Math.floor(parseInt(hex.slice(3, 5), 16) * factor);
  const b = Math.floor(parseInt(hex.slice(5, 7), 16) * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const bubbleStyle = computed(() => ({
  left: `${props.position.x}px`,
  top: `${props.position.y}px`,
}));

const glowStyle = computed(() => ({
  background: `radial-gradient(ellipse at center, ${hexToRgba(color.value, 0.3)} 0%, transparent 70%)`,
}));

const contentStyle = computed(() => ({
  background: `linear-gradient(135deg, ${hexToRgba(color.value, opacity.value)} 0%, ${hexToRgba(darkenColor(color.value, 0.9), opacity.value)} 50%, ${hexToRgba(darkenColor(color.value, 0.8), opacity.value)} 100%)`,
}));

const tailColor = computed(() => hexToRgba(darkenColor(color.value, 0.9), opacity.value));

const startTyping = () => {
  displayText.value = '';
  isTyping.value = true;
  
  if (typingTimer) {
    clearInterval(typingTimer);
  }
  
  let index = 0;
  const text = props.text;
  
  typingTimer = window.setInterval(() => {
    if (index < text.length) {
      displayText.value += text[index];
      index++;
    } else {
      if (typingTimer) {
        clearInterval(typingTimer);
        typingTimer = null;
      }
      isTyping.value = false;
      startDisappearTimer();
    }
  }, 50 + Math.random() * 50);
};

const startDisappearTimer = () => {
  if (disappearTimer) {
    clearTimeout(disappearTimer);
  }
  
  const readingTime = Math.max(3000, props.text.length * 100);
  
  disappearTimer = window.setTimeout(() => {
    emit('disappear');
  }, readingTime);
};

watch(() => props.visible, (visible) => {
  if (visible && props.text) {
    startTyping();
  } else {
    if (typingTimer) {
      clearInterval(typingTimer);
      typingTimer = null;
    }
    if (disappearTimer) {
      clearTimeout(disappearTimer);
      disappearTimer = null;
    }
    displayText.value = '';
    isTyping.value = false;
  }
});

watch(() => props.text, (newText) => {
  if (props.visible && newText) {
    startTyping();
  }
});

onUnmounted(() => {
  if (typingTimer) {
    clearInterval(typingTimer);
  }
  if (disappearTimer) {
    clearTimeout(disappearTimer);
  }
});

const onAfterLeave = () => {
  displayText.value = '';
  isTyping.value = false;
};
</script>

<style scoped>
.chat-bubble {
  position: absolute;
  transform: translateX(-50%);
  z-index: 2000;
  pointer-events: none;
}

.bubble-glow {
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  border-radius: 30px;
  animation: glowPulse 2s ease-in-out infinite;
  z-index: -1;
}

@keyframes glowPulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

.bubble-content {
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-radius: 20px;
  padding: 14px 18px;
  max-width: 280px;
  min-width: 80px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.bubble-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 100%);
  border-radius: 18px 18px 0 0;
  pointer-events: none;
}

.bubble-inner {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bubble-text {
  color: white;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.6;
  word-break: break-word;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.3px;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-left: 4px;
}

.typing-indicator .dot {
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  animation: typingDot 1.4s ease-in-out infinite;
}

.typing-indicator .dot:nth-child(1) {
  animation-delay: 0s;
}

.typing-indicator .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingDot {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

.bubble-tail {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 12px;
}

.bubble-tail svg {
  width: 100%;
  height: 100%;
}

.bubble-pop-enter-active {
  animation: bubbleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bubble-pop-leave-active {
  animation: bubbleOut 0.4s ease-in forwards;
}

@keyframes bubbleIn {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(20px) scale(0.6);
  }
  50% {
    transform: translateX(-50%) translateY(-5px) scale(1.05);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

@keyframes bubbleOut {
  0% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-15px) scale(0.9);
  }
}
</style>
