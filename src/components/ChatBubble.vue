<template>
  <Transition name="chat-bubble-pop" @after-leave="onAfterLeave">
    <div v-if="visible" class="chat-bubble-container" :style="containerStyle">
      <div class="chat-bubble" ref="bubbleRef">
        <div class="bubble-content" :style="contentStyle" ref="contentRef">
          <div class="bubble-inner" ref="innerRef">
            <span class="bubble-text">{{ displayText }}</span>
            <div v-if="isTyping" class="typing-indicator">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, nextTick } from 'vue';

const props = defineProps<{
  visible: boolean;
  text: string;
  bubbleColor?: string;
  bubbleOpacity?: number;
  streamMode?: boolean;
}>();

const emit = defineEmits<{
  disappear: [];
}>();

const displayText = ref('');
const isTyping = ref(false);
const bubbleRef = ref<HTMLDivElement>();
const contentRef = ref<HTMLDivElement>();
const innerRef = ref<HTMLDivElement>();
let typingTimer: number | null = null;
let disappearTimer: number | null = null;

const MAX_HEIGHT = 200;
const BOTTOM_OFFSET = 220;

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

const containerStyle = computed(() => ({
  bottom: `${BOTTOM_OFFSET}px`,
}));

const contentStyle = computed(() => ({
  background: `linear-gradient(135deg, ${hexToRgba(color.value, opacity.value)} 0%, ${hexToRgba(darkenColor(color.value, 0.9), opacity.value)} 50%, ${hexToRgba(darkenColor(color.value, 0.8), opacity.value)} 100%)`,
}));

const checkAndScrollContent = () => {
  nextTick(() => {
    if (!contentRef.value || !innerRef.value) return;
    
    const contentHeight = innerRef.value.scrollHeight;
    
    if (contentHeight > MAX_HEIGHT) {
      contentRef.value.style.height = `${MAX_HEIGHT}px`;
      contentRef.value.style.overflow = 'hidden';
      
      const scrollAmount = contentHeight - MAX_HEIGHT;
      innerRef.value.style.transform = `translateY(-${scrollAmount}px)`;
    } else {
      contentRef.value.style.height = 'auto';
      contentRef.value.style.overflow = 'visible';
      innerRef.value.style.transform = 'translateY(0)';
    }
  });
};

const startTyping = () => {
  if (props.streamMode) {
    displayText.value = props.text;
    isTyping.value = false;
    checkAndScrollContent();
    return;
  }
  
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
      checkAndScrollContent();
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
    
    if (contentRef.value) {
      contentRef.value.style.height = 'auto';
      contentRef.value.style.overflow = 'visible';
    }
    if (innerRef.value) {
      innerRef.value.style.transform = 'translateY(0)';
    }
  }
});

watch(() => props.text, (newText) => {
  if (props.streamMode) {
    displayText.value = newText;
    checkAndScrollContent();
    if (disappearTimer) {
      clearTimeout(disappearTimer);
      disappearTimer = null;
    }
    return;
  }
  
  if (props.visible && newText) {
    startTyping();
  }
});

watch(() => props.streamMode, (newMode, oldMode) => {
  if (oldMode === true && newMode === false && props.visible) {
    startDisappearTimer();
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
.chat-bubble-container {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 2500;
  pointer-events: none;
  display: flex;
  justify-content: center;
}

.chat-bubble {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bubble-content {
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-radius: 20px;
  padding: 14px 18px;
  max-width: 320px;
  min-width: 80px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: relative;
  transition: height 0.1s ease-out;
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
  align-items: flex-start;
  gap: 8px;
  transition: transform 0.15s ease-out;
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
  flex-shrink: 0;
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

.chat-bubble-pop-enter-active {
  animation: bubbleFloatUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.chat-bubble-pop-leave-active {
  animation: bubbleFadeOut 0.4s ease-in forwards;
}

@keyframes bubbleFloatUp {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes bubbleFadeOut {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-20px) scale(0.9);
  }
}
</style>
