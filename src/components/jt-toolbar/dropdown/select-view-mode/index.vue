<template>
  <div class="">
    <el-radio-group v-model="currentSceneModeType" @change="sceneModeChange">
      <el-radio-button
        v-for="(item, index) in sceneModeTypes"
        :key="index"
        :label="item.name"
      ></el-radio-button>
    </el-radio-group>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch, onMounted, inject } from 'vue'
import { CesiumRef, CESIUM_REF_KEY } from '@/libs/cesium/cesium-vue'
import { ElRadioGroup, ElRadioButton } from 'element-plus'
import changeSceneMode from '@/libs/cesium/libs/scene-mode/index'
import { SceneMode } from 'cesium'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'select-view-mode',
  components: { ElRadioGroup, ElRadioButton },
  props: {},
  setup(props, context) {
    const currentSceneModeType = ref('')

    const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    const { viewer } = cesiumRef || {}
    if (!viewer || !viewer.jt) {
      throw new Error('Viewer not loaded.')
    }

    const { t } = useI18n()

    const sceneModeTypes = reactive([
      {
        name: '2D',
        mode: SceneMode.SCENE2D,
      },
      {
        name: '3D',
        mode: SceneMode.SCENE3D,
      },
      {
        name: t('toolbar.view.columbusViewMode', '哥伦布'),
        mode: SceneMode.COLUMBUS_VIEW,
      },
    ])

    const sceneModeChange = (val: string | number | boolean): void => {
      sceneModeTypes.forEach((sceneMode) => {
        if (sceneMode.name === val) {
          changeSceneMode(viewer, sceneMode.mode, 0.5)
          return
        }
      })
    }

    onMounted(() => {
      const nowMode = viewer.scene.mode
      sceneModeTypes.forEach((mode) => {
        if (mode.mode === nowMode) {
          currentSceneModeType.value = mode.name
        }
      })
    })

    return {
      currentSceneModeType,
      sceneModeChange,
      sceneModeTypes,
      t,
    }
  },
})
</script>
