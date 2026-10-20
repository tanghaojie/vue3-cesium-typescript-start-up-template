<template>
  <aside class="geo-inspector" :aria-label="title">
    <header>
      <span>{{ eyebrow }}</span>
      <h2>{{ title }}</h2>
    </header>
    <div class="geo-inspector__body"><slot /></div>
  </aside>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  eyebrow: string
}>()
</script>

<style scoped>
.geo-inspector {
  position: absolute;
  z-index: 19;
  top: 22px;
  right: 78px;
  width: 288px;
  max-height: calc(100vh - 182px);
  overflow: hidden;
  border: 1px solid var(--geo-line);
  border-radius: 18px;
  color: var(--geo-text);
  background: var(--geo-surface);
  box-shadow: var(--geo-shadow);
  backdrop-filter: blur(22px) saturate(120%);
  animation: geo-inspector-enter 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}

.geo-inspector header {
  padding: 16px 17px 13px;
  border-bottom: 1px solid var(--geo-line);
}

.geo-inspector header span {
  color: var(--geo-accent);
  font-size: 8px;
  font-weight: 850;
  letter-spacing: 0.16em;
}

.geo-inspector h2 {
  margin: 4px 0 0;
  font-family: var(--font-display);
  font-size: 16px;
  letter-spacing: -0.02em;
}

.geo-inspector__body {
  max-height: calc(100vh - 260px);
  overflow: auto;
  padding: 16px 17px;
}

@keyframes geo-inspector-enter {
  from {
    opacity: 0;
    transform: translateX(8px) scale(0.985);
  }
}

@media (prefers-reduced-motion: reduce) {
  .geo-inspector {
    animation: none;
  }
}
</style>
