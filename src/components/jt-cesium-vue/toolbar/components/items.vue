<template>
  <template v-for="(item, index) in items" :key="index">
    <div
      class="wrapper"
      :class="{
        'cursor-not-allowed': !!item.disable || !!item.invisible,
      }"
    >
      <item
        v-if="!item.invisible"
        :item="item"
        :class="{
          'pointer-events-none': !!item.disable || !!item.invisible,
        }"
      >
        {{ item.name }}
      </item>
    </div>
  </template>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import type { Item } from '@/components/jt-cesium-vue/toolbar/config/contents/Types'

import item from './item.vue'

export default defineComponent({
  name: '',
  components: { item },
  props: {
    items: {
      type: Object as PropType<Array<Item>[]>,
      required: true,
    },
  },
})
</script>
