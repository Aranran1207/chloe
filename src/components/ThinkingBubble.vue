<template>
  <Transition name="thinking-pop">
    <div v-if="visible" class="thinking-bubble" :style="bubbleStyle">
      <div class="thinking-content">
        <span class="thinking-emoji">{{ currentEmoji }}</span>
        <div class="thinking-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';

const props = defineProps<{
  visible: boolean;
  position: { x: number; y: number };
}>();

const thinkingEmojis = ['🤔', '💭', '✨', '💫', '🌟'];
const currentEmoji = ref(thinkingEmojis[0]);
let emojiTimer: number | null = null;
let emojiIndex = 0;

const bubbleStyle = computed(() => ({
  left: `${props.position.x}px`,
  top: `${props.position.y}px`,
}));

watch(() => props.visible, (visible) => {
  if (visible) {
    currentEmoji.value = thinkingEmojis[0];
    emojiIndex = 0;
    
    emojiTimer = window.setInterval(() => {
      emojiIndex = (emojiIndex + 1) % thinkingEmojis.length;
      currentEmoji.value = thinkingEmojis[emojiIndex];
    }, 800);
  } else {
    if (emojiTimer) {
      clearInterval(emojiTimer);
      emojiTimer = null;
    }
  }
});

onUnmounted(() => {
  if (emojiTimer) {
    clearInterval(emojiTimer);
  }
});
</script>

<style scoped>
.thinking-bubble {
  position: absolute;
  transform: translate(-50%, -100%);
  z-index: 2000;
  pointer-events: none;
  margin-top: -20px;
}

.thinking-content {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 240, 250, 0.95) 100%);
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-radius: 20px;
  padding: 8px 14px;
  box-shadow: 
    0 4px 20px rgba(139, 92, 246, 0.2),
    0 2px 8px rgba(0, 0, 0, 0.1);
  animation: float 2s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.thinking-emoji {
  font-size: 18px;
  animation: pulse 0.8s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.thinking-dots {
  display: flex;
  align-items: center;
  gap: 3px;
}

.thinking-dots .dot {
  width: 5px;
  height: 5px;
  background: #8b5cf6;
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite;
}

.thinking-dots .dot:nth-child(1) {
  animation-delay: 0s;
}

.thinking-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.thinking-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

.thinking-pop-enter-active {
  animation: thinkingIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.thinking-pop-leave-active {
  animation: thinkingOut 0.3s ease-in forwards;
}

@keyframes thinkingIn {
  0% {
    opacity: 0;
    transform: translate(-50%, -100%) scale(0.5);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -100%) scale(1);
  }
}

@keyframes thinkingOut {
  0% {
    opacity: 1;
    transform: translate(-50%, -100%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -100%) scale(0.5);
  }
}
</style>
