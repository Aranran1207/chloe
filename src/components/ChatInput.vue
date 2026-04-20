<template>
  <Transition name="input-fade">
    <div v-if="visible" class="chat-input-overlay" @click.self="$emit('cancel')" @dblclick.stop @mousedown.stop>
      <div class="chat-input-container" @dblclick.stop @mousedown.stop>
        <div class="input-wrapper">
          <input
            ref="inputRef"
            v-model="inputText"
            type="text"
            placeholder="说点什么..."
            class="chat-input"
            @keydown.enter="handleSend"
            @keydown.esc="$emit('cancel')"
          />
          <button 
            class="send-btn" 
            :class="{ 'can-send': inputText.trim() }"
            :style="inputText.trim() ? buttonStyle : {}"
            :disabled="!inputText.trim()"
            @click="handleSend"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <p class="hint">按 Enter 发送，ESC 取消</p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';

const props = defineProps<{
  visible: boolean;
  bubbleColor?: string;
}>();

const emit = defineEmits<{
  send: [message: string];
  cancel: [];
}>();

const inputText = ref('');
const inputRef = ref<HTMLInputElement>();

const color = computed(() => props.bubbleColor || '#8b5cf6');

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

const buttonStyle = computed(() => ({
  background: `linear-gradient(135deg, ${color.value} 0%, ${darkenColor(color.value, 0.85)} 100%)`,
  boxShadow: `0 4px 15px ${hexToRgba(color.value, 0.4)}`,
}));

watch(() => props.visible, async (visible) => {
  if (visible) {
    inputText.value = '';
    await nextTick();
    inputRef.value?.focus();
  }
});

const handleSend = () => {
  const text = inputText.value.trim();
  if (text) {
    emit('send', text);
    inputText.value = '';
  }
};
</script>

<style scoped>
.chat-input-overlay {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 30px;
  z-index: 3000;
}

.chat-input-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, rgba(40, 40, 50, 0.95) 0%, rgba(30, 30, 40, 0.98) 100%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  padding: 8px 8px 8px 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.chat-input {
  width: 280px;
  background: transparent;
  border: none;
  outline: none;
  color: rgba(255, 255, 255, 0.95);
  font-size: 15px;
  font-family: inherit;
}

.chat-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.send-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.3);
  cursor: not-allowed;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.send-btn.can-send {
  color: white;
  cursor: pointer;
}

.send-btn.can-send:hover {
  transform: scale(1.05);
}

.send-btn svg {
  width: 18px;
  height: 18px;
}

.hint {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.input-fade-enter-active,
.input-fade-leave-active {
  transition: all 0.3s ease;
}

.input-fade-enter-from,
.input-fade-leave-to {
  opacity: 0;
}

.input-fade-enter-from .input-wrapper,
.input-fade-leave-to .input-wrapper {
  transform: translateY(20px);
}
</style>
