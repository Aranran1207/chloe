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
  width: 500px;
  height: 800px;
  overflow: hidden;
}

#app-container {
  width: 500px !important;
  height: 800px !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: auto !important;
  bottom: auto !important;
  margin: 0 !important;
  padding: 0 !important;
}
</style>
