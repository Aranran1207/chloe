<template>
  <Transition name="chat-bubble-pop" @after-leave="onAfterLeave">
    <div v-if="visible" class="chat-bubble-container" :style="containerStyle">
      <div class="chat-bubble" ref="bubbleRef">
        <div class="bubble-content" :style="contentStyle" ref="contentRef">
          <div class="fade-top" v-if="isOverflow"></div>
          <div class="bubble-scroll" ref="scrollRef">
            <span class="bubble-text" v-html="renderedText"></span>
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
  streamMode?: boolean;
}>();

const emit = defineEmits<{
  disappear: [];
}>();

const displayText = ref('');
const isTyping = ref(false);
const isOverflow = ref(false);
const bubbleRef = ref<HTMLDivElement>();
const contentRef = ref<HTMLDivElement>();
const scrollRef = ref<HTMLDivElement>();
let typingTimer: number | null = null;
let disappearTimer: number | null = null;

const MAX_HEIGHT = 180;
const BOTTOM_OFFSET = 220;

const color = computed(() => props.bubbleColor || '#8b5cf6');

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const containerStyle = computed(() => ({
  bottom: `${BOTTOM_OFFSET}px`,
}));

const contentStyle = computed(() => ({
  background: hexToRgba(color.value, 0.15),
  borderColor: hexToRgba(color.value, 0.3),
}));

const parseMarkdown = (text: string): string => {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/\n/g, '<br>');
  
  return html;
};

const renderedText = computed(() => {
  return parseMarkdown(displayText.value);
});

const checkAndScrollContent = () => {
  nextTick(() => {
    if (!contentRef.value || !scrollRef.value) return;
    
    const contentHeight = scrollRef.value.scrollHeight;
    
    if (contentHeight > MAX_HEIGHT) {
      isOverflow.value = true;
      contentRef.value.style.height = `${MAX_HEIGHT}px`;
      scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
    } else {
      isOverflow.value = false;
      contentRef.value.style.height = 'auto';
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
  
  const readingTime = Math.max(5000, props.text.length * 80);
  
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
    isOverflow.value = false;
    
    if (contentRef.value) {
      contentRef.value.style.height = 'auto';
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
  isOverflow.value = false;
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
  border: 1px solid;
  border-radius: 16px;
  max-width: 320px;
  min-width: 80px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  position: relative;
  transition: height 0.15s ease-out;
  overflow: hidden;
}

.fade-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 30px;
  background: linear-gradient(to bottom, 
    var(--fade-color, rgba(139, 92, 246, 0.15)) 0%, 
    transparent 100%
  );
  pointer-events: none;
  z-index: 10;
  border-radius: 16px 16px 0 0;
}

.bubble-scroll {
  max-height: 180px;
  padding: 14px 16px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.bubble-scroll::-webkit-scrollbar {
  display: none;
}

.bubble-text {
  color: rgba(255, 255, 255, 0.95);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.6;
  word-break: break-word;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.3px;
}

.bubble-text :deep(strong) {
  font-weight: 700;
  color: #fff;
}

.bubble-text :deep(em) {
  font-style: italic;
}

.bubble-text :deep(code) {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}

.bubble-text :deep(del) {
  text-decoration: line-through;
  opacity: 0.7;
}

.typing-indicator {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: 4px;
  vertical-align: middle;
}

.typing-indicator .dot {
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.8);
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
  animation: bubbleFadeOutUp 0.6s ease-out forwards;
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

@keyframes bubbleFadeOutUp {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-30px);
  }
}
</style>
