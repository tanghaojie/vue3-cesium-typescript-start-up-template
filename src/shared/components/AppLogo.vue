<template>
  <span
    class="cyber-logo"
    :class="[`cyber-logo--${tone}`, { 'cyber-logo--icon-only': iconOnly }]"
    :aria-label="iconOnly ? platformConfig.fullName : undefined"
  >
    <svg
      class="cyber-logo__mark"
      viewBox="0 0 112 96"
      role="img"
      :aria-hidden="iconOnly ? undefined : true"
    >
      <title v-if="iconOnly">{{ platformConfig.fullName }}</title>
      <path class="cyber-logo__outer" d="M88 30 74 16H36L16 36v24l20 20h38l14-14" />
      <path class="cyber-logo__inner" d="M75 37 68 30H43L30 43v10l13 13h25l7-7" />
      <path class="cyber-logo__accent cyber-logo__accent--top" d="m79 21 9 9" />
      <path class="cyber-logo__accent cyber-logo__accent--bottom" d="m79 75 9-9" />
      <rect class="cyber-logo__node" x="92" y="43" width="10" height="10" rx="1.5" />
    </svg>
    <span v-if="!iconOnly" class="cyber-logo__wordmark">
      <strong>{{ platformConfig.name }}</strong>
      <small v-if="showDescriptor">{{ platformConfig.tagline.toUpperCase() }}</small>
    </span>
  </span>
</template>

<script setup lang="ts">
import { appConfig as platformConfig } from '@/app/app.config'

withDefaults(
  defineProps<{
    iconOnly?: boolean
    showDescriptor?: boolean
    tone?: 'dark' | 'light'
  }>(),
  {
    iconOnly: false,
    showDescriptor: true,
    tone: 'light',
  },
)
</script>

<style scoped>
.cyber-logo {
  --cyber-logo-mark: var(--hero-foreground);
  --cyber-logo-text: var(--hero-foreground);
  --cyber-logo-muted: var(--hero-meta);
  --cyber-logo-mark-size: 48px;
  display: inline-flex;
  align-items: center;
  gap: 13px;
}

.cyber-logo--dark {
  --brand-accent: var(--primary);
  --brand-node: var(--primary);
  --cyber-logo-mark: var(--ink);
  --cyber-logo-text: var(--ink);
  --cyber-logo-muted: var(--muted);
}

.cyber-logo--icon-only {
  display: inline-grid;
  place-items: center;
}

.cyber-logo__mark {
  width: var(--cyber-logo-mark-size);
  height: var(--cyber-logo-mark-size);
  flex: 0 0 auto;
  overflow: visible;
}

.cyber-logo__outer,
.cyber-logo__inner,
.cyber-logo__accent {
  fill: none;
  stroke-linecap: square;
  stroke-linejoin: bevel;
}

.cyber-logo__outer {
  stroke: var(--cyber-logo-mark);
  stroke-width: 12;
}

.cyber-logo__inner {
  stroke: var(--cyber-logo-mark);
  stroke-width: 5;
}

.cyber-logo__accent {
  stroke: var(--brand-accent, var(--primary));
}

.cyber-logo__accent--top,
.cyber-logo__accent--bottom {
  stroke-width: 12;
}

.cyber-logo__node {
  fill: var(--brand-node, var(--signal));
}

.cyber-logo__wordmark {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.cyber-logo__wordmark strong {
  color: var(--cyber-logo-text);
  font-family: var(--font-display);
  font-size: var(--cyber-logo-wordmark-size, 16px);
  font-weight: 760;
  letter-spacing: 0.22em;
  line-height: 1;
}

.cyber-logo__wordmark small {
  max-width: 220px;
  overflow-wrap: anywhere;
  line-height: 1.4;
  color: var(--cyber-logo-muted);
  font-size: var(--cyber-logo-descriptor-size, 8px);
  font-weight: 700;
  letter-spacing: 0.2em;
}
</style>
