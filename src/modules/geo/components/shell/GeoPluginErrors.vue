<template>
  <aside v-if="errors.length" class="geo-plugin-errors" role="status" aria-live="polite">
    <strong>{{ title }}</strong>
    <span v-for="error in errors.slice(0, 3)" :key="`${error.pluginId}-${error.message}`">
      {{ error.pluginId }} · {{ error.message }}
    </span>
  </aside>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  errors: readonly { readonly pluginId: string; readonly message: string }[]
}>()
</script>

<style scoped>
.geo-plugin-errors {
  position: absolute;
  z-index: 22;
  right: 78px;
  bottom: 74px;
  width: 330px;
  display: grid;
  gap: 5px;
  padding: 11px 13px;
  border: 1px solid rgba(255, 145, 157, 0.28);
  border-radius: 12px;
  color: #ffd3d8;
  background: rgba(35, 12, 19, 0.88);
  box-shadow: var(--geo-shadow);
  backdrop-filter: blur(16px);
  font-size: 9px;
}

.geo-plugin-errors strong {
  font-size: 10px;
}

.geo-plugin-errors span {
  overflow: hidden;
  color: rgba(255, 211, 216, 0.76);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
