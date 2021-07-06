<template>
  <div class="flex mt-1.5">
    <div class="content flex py-1">
      <template v-for="(group, gIndex) in groups" :key="gIndex">
        <div
          class="wrapper"
          :class="{
            'cursor-not-allowed': !!group.disable || !!group.invisible,
          }"
        >
          <group
            v-if="!group.invisible"
            :key="gIndex"
            :class="{
              'pointer-events-none': !!group.disable || !!group.invisible,
            }"
          >
            <template v-slot:name>{{ group.name || '组' }}</template>

            <items :items="group.items" />
          </group>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import type { Group } from '@/components/jt-cesium-vue/toolbar/config/contents/Types'
import group from './group.vue'
import items from './items.vue'

export default defineComponent({
  name: '',
  components: { group, items },
  props: {
    groups: {
      type: Object as PropType<Array<Group>[]>,
      required: true,
    },
  },
})
</script>
