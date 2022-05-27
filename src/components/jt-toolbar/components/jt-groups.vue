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
          <jt-group
            v-if="!group.invisible"
            :key="gIndex"
            :class="{
              'pointer-events-none': !!group.disable || !!group.invisible,
            }"
          >
            <template v-slot:name>{{ groupName(group) || '组' }}</template>

            <jt-items :items="group.items" />
          </jt-group>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import type { Group } from '@/components/jt-toolbar/config/contents/Types'
import jtGroup from './jt-group.vue'
import jtItems from './jt-items.vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'jt-groups',
  components: { jtGroup, jtItems },
  props: {
    groups: {
      type: Object as PropType<Array<Group>>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n()
    const groupName = (group: Group): string => {
      if (group.name instanceof Function) {
        return group.name(t)
      }
      return group.name as string
    }

    return {
      groupName,
    }
  },
})
</script>
