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
        {{ itemName(item) }}
      </jt-item>
    </div>
  </template>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import type { Item } from '@/components/jt-toolbar/config/contents/Types'
import jtItem from './jt-item.vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'jt-items',
  components: { jtItem },
  props: {
    items: {
      type: Object as PropType<Array<Item>>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n()
    const itemName = (item: Item): string => {
      if (item.name instanceof Function) {
        return item.name(t)
      }
      return item.name as string
    }

    return {
      itemName,
    }
  },
})
</script>
