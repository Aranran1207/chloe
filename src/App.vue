<template>
  <div id="app-container">
    <Live2DView />
  </div>
</template>

<script setup lang="ts">
import Live2DView from './components/Live2DView.vue';
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app-container {
  width: 100%;
  height: 100%;
}
</style>
