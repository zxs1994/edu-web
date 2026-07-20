<script lang="ts" setup>
defineOptions({ name: 'AppVersionBadge' });

const version = import.meta.env.VITE_OA_VERSION as string | undefined;
</script>

<template>
  <div v-if="version" class="app-version-badge" title="系统版本号">
    版本号v{{ version }}
  </div>
</template>

<style scoped>
.app-version-badge {
  position: fixed;
  right: 12px;
  bottom: 8px;
  z-index: 100;
  padding: 2px 8px;
  font-size: 12px;
  line-height: 1.4;
  color: rgb(0 0 0 / 45%);
  pointer-events: none;
  user-select: none;
  background: rgb(255 255 255 / 70%);
  border-radius: 4px;
}

html.dark .app-version-badge {
  color: rgb(255 255 255 / 45%);
  background: rgb(0 0 0 / 40%);
}
</style>
