<template>
  <SettingsWindow v-if="isSettingsWindow" />
  <div v-else id="app-container" :style="{ width: containerWidth + 'px', height: containerHeight + 'px' }">
    <Live2DView 
      @window-size-change="handleWindowSizeChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Live2DView from './components/Live2DView.vue';
import SettingsWindow from './components/SettingsWindow.vue';

const isSettingsWindow = window.location.hash === '#/settings';

const containerWidth = ref(500);
const containerHeight = ref(800);

const handleWindowSizeChange = (width: number, height: number) => {
  containerWidth.value = width;
  containerHeight.value = height;
};

onMounted(() => {
  const saved = localStorage.getItem('chloeWindowSize');
  if (saved) {
    try {
      const { width, height } = JSON.parse(saved);
      containerWidth.value = width;
      containerHeight.value = height;
    } catch {
      // ignore
    }
  }
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  overflow: hidden;
}

#app-container {
  position: fixed;
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
