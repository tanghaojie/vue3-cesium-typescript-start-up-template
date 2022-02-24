<template>
  <template v-for="(item, index) in items" :key="index">
    <div
      class="wrapper"
      :class="{
        'cursor-not-allowed': !!item.disable || !!item.invisible,
      }"
    >
      <jt-item
        v-if="!item.invisible"
        :item="item"
        :class="{
          'pointer-events-none': !!item.disable || !!item.invisible,
        }"
      >
        {{ item.name }}
      </jt-item>
    </div>
  </template>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import type { Item } from '@/components/jt-toolbar/config/contents/Types'

import jtItem from './jt-item.vue'

export default defineComponent({
  name: 'jt-items',
  components: { jtItem },
  props: {
    items: {
      type: Object as PropType<Array<Item>[]>,
      required: true,
    },
  },
})
</script>
