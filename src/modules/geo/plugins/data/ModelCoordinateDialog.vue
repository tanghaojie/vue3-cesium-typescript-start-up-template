<template>
  <dialog
    v-if="controller.state.modelCoordinateRequest"
    ref="coordinateDialog"
    class="data-panel__coordinate-dialog"
    aria-labelledby="model-coordinate-title"
    @cancel.prevent="choose('cancel')"
  >
    <h2 id="model-coordinate-title">选择模型位置</h2>
    <p>模型包含内置坐标，请选择本次加载的位置。</p>
    <dl>
      <dt>模型坐标（WGS84）</dt>
      <dd>{{ coordinateSummary(controller.state.modelCoordinateRequest.coordinates) }}</dd>
      <dt>加载输入坐标（WGS84）</dt>
      <dd v-if="controller.state.modelCoordinateRequest.input">
        {{ coordinateSummary(controller.state.modelCoordinateRequest.input) }}
      </dd>
      <dd v-else>使用输入的模型变换</dd>
    </dl>
    <p class="data-panel__coordinate-hint">
      模型未提供定位高度时，使用当前地形高度。缩放和旋转沿用加载输入。
    </p>
    <div class="data-panel__coordinate-actions">
      <button type="button" @click="choose('cancel')">取消</button>
      <button type="button" @click="choose('input')">使用输入坐标</button>
      <button type="button" class="is-primary" @click="choose('model')">使用模型坐标</button>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { GeoDataController } from './data.controller'
import type { GeoModelCoordinates, GeoModelCoordinateSource } from '../../tools/data/model-asset'

const props = defineProps<{ controller: GeoDataController }>()
const coordinateDialog = ref<HTMLDialogElement>()

function choose(source: GeoModelCoordinateSource): void {
  coordinateDialog.value?.close()
  props.controller.chooseModelCoordinates(source)
}

watch(
  () => props.controller.state.modelCoordinateRequest,
  async function showCoordinateChoice(request) {
    if (!request) {
      return
    }
    await nextTick()
    const dialog = coordinateDialog.value
    if (
      dialog?.isConnected &&
      !dialog.open &&
      props.controller.state.modelCoordinateRequest === request
    ) {
      dialog.showModal()
    }
  },
  { immediate: true },
)

onBeforeUnmount(function cancelCoordinateChoice() {
  props.controller.chooseModelCoordinates('cancel')
})

function coordinateSummary(coordinates: GeoModelCoordinates): string {
  const height =
    coordinates.height === undefined ? '按当前地形定位' : `高度 ${coordinates.height.toFixed(2)} m`
  return `经度 ${coordinates.longitude.toFixed(6)}° · 纬度 ${coordinates.latitude.toFixed(6)}° · ${height}`
}
</script>

<style scoped>
.data-panel__coordinate-dialog {
  width: min(540px, calc(100vw - 64px));
  box-sizing: border-box;
  padding: 24px;
  border: 1px solid var(--geo-line, #263c4e);
  border-radius: 16px;
  color: var(--geo-text, #eff8ff);
  background: var(--geo-surface, #11212e);
}
.data-panel__coordinate-dialog::backdrop {
  background: rgb(2 10 18 / 65%);
}
.data-panel__coordinate-dialog h2 {
  margin: 0 0 12px;
  font-size: 18px;
}
.data-panel__coordinate-dialog p,
.data-panel__coordinate-dialog dl {
  font-size: 12px;
  line-height: 1.7;
}
.data-panel__coordinate-dialog dt {
  margin-top: 14px;
  color: var(--geo-text-muted, #7890a2);
}
.data-panel__coordinate-dialog dd {
  margin: 4px 0 0;
}
.data-panel__coordinate-hint {
  color: var(--geo-text-muted, #7890a2);
}
.data-panel__coordinate-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 22px;
}
.data-panel__coordinate-actions button {
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid var(--geo-line, #263c4e);
  border-radius: 8px;
  color: inherit;
  background: transparent;
  cursor: pointer;
}
.data-panel__coordinate-actions button.is-primary {
  color: #07111c;
  border-color: var(--geo-accent, #45c8ff);
  background: var(--geo-accent, #45c8ff);
}
.data-panel__coordinate-actions button:focus-visible {
  outline: 2px solid var(--geo-accent, #45c8ff);
  outline-offset: 2px;
}
</style>
