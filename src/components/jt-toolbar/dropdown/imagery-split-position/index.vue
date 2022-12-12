<template>
  <div class="w-40">
    <div class="name">
      {{ t('toolbar.effect.splitPosition', '分屏位置设置') }}
    </div>
    <el-slider
      v-model="value"
      :min="0"
      :max="1"
      :step="0.01"
      :show-tooltip="true"
      :format-tooltip="
        (val) => {
          return (val * 100).toFixed(0) + '%'
        }
      "
      :disabled="disable"
      @change="afterChange"
    ></el-slider>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, inject, computed } from 'vue'
import { useStore } from '@/store'
import { CesiumRef, CESIUM_REF_KEY } from '@/libs/cesium/cesium-vue'
import { ImageryActionTypes } from '@/store/modules/jt-cesium-vue/modules/toolbar/modules/imagery/action-types'
import type { SplitType } from '@/store/modules/jt-cesium-vue/modules/toolbar/modules/imagery/state'
import { useI18n } from 'vue-i18n'
import { ElSlider } from 'element-plus'
import { Arrayable } from 'element-plus/es/utils'

export default defineComponent({
  name: 'imagery-split-position',
  components: { ElSlider },
  setup() {
    const store = useStore()
    const value = ref<number>(0)

    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)

    const afterChange = (val: Arrayable<number>) => {
      if (Array.isArray(val)) {
        return
      }
      const { viewer } = cesiumRef || {}
      if (viewer) {
        if (store.state.jtCesiumVue.toolbar.imagery.split.enable) {
          let split: SplitType = {
            enable: true,
            position: val,
          }
          viewer.scene.splitPosition = val
          store.dispatch(`jtCesiumVue/toolbar/imagery/${ImageryActionTypes.SET_SPLIT}`, split)
        }
      }
    }

    const disable = computed(() => {
      return !store.state.jtCesiumVue.toolbar.imagery.split.enable
    })

    onMounted(() => {
      const { viewer } = cesiumRef || {}
      if (viewer) {
        value.value = store.state.jtCesiumVue.toolbar.imagery.split.position
      }
    })

    const { t } = useI18n()

    return {
      value,
      afterChange,
      disable,
      t,
    }
  },
})
</script>

<style scoped lang="scss"></style>
