<template>
  <div class="capture-panel">
    <header class="capture-header">
      <span>DIRECTOR</span><strong>把建筑，拍成故事。</strong>
      <p>保存机位与节奏，随时预览、补拍和逐帧输出。</p>
    </header>
    <p v-if="state.error" class="error" role="alert">{{ state.error }}</p>
    <p v-if="state.notice" class="notice" role="status">{{ state.notice }}</p>
    <fieldset :disabled="state.busy">
      <section>
        <div class="heading">
          <strong>01 / 拍摄工程</strong
          ><button type="button" @click="controller.newProject">新建</button>
        </div>
        <label
          >工程名称<input
            :value="state.project.name"
            maxlength="120"
            @change="controller.patchProject({ name: text($event) })"
        /></label>
        <div class="actions">
          <button type="button" @click="controller.saveProject">保存到本机</button
          ><button type="button" @click="controller.exportProject">导出工程</button
          ><button type="button" @click="fileInput?.click()">导入工程</button>
        </div>
        <input
          ref="fileInput"
          class="file-input"
          type="file"
          accept=".json,application/json"
          aria-label="选择拍摄工程 JSON"
          @change="importFile"
        />
        <div v-if="state.library.length" class="saved">
          <select v-model="savedId" aria-label="本机拍摄工程">
            <option value="">选择已保存工程</option>
            <option v-for="item in state.library" :key="item.id" :value="item.id">
              {{ item.project.name }}
            </option></select
          ><button type="button" :disabled="!savedId" @click="controller.loadProject(savedId)">
            打开</button
          ><button type="button" :disabled="!savedId" @click="controller.removeSaved(savedId)">
            删除
          </button>
        </div>
      </section>
      <section>
        <div class="heading">
          <strong>02 / 主体与画幅</strong
          ><button type="button" @click="controller.refreshSubjects">刷新模型</button>
        </div>
        <label
          >已加载模型<select
            :value="state.subjectId"
            @change="controller.bindSubject(text($event))"
          >
            <option value="">选择拍摄主体</option>
            <option v-for="subject in state.subjects" :key="subject.id" :value="subject.id">
              {{ subject.label }}
            </option>
          </select></label
        >
        <p v-if="!state.subjects.length" class="hint">请先到“外部数据”加载模型，再返回这里刷新。</p>
        <p v-if="state.project.subject && !state.subjectId" class="hint">
          此工程原主体：{{ state.project.subject.label }}。请选择模型重新绑定。
        </p>
        <div class="pair">
          <label
            >画幅<select :value="state.project.aspect" @change="setAspect">
              <option value="landscape">横屏 16:9</option>
              <option value="portrait">竖屏 9:16</option>
            </select></label
          ><label
            >分辨率<select :value="state.project.resolution" @change="setResolution">
              <option value="1080p">1080p</option>
              <option value="4k">4K</option>
            </select></label
          >
        </div>
        <div class="pair">
          <label
            >帧率<select :value="state.project.fps" @change="setFps">
              <option v-for="fps in [24, 25, 30, 60]" :key="fps" :value="fps">{{ fps }} fps</option>
            </select></label
          ><label
            >场景起始日期<input type="datetime-local" :value="localDate" @change="setDate"
          /></label>
        </div>
        <p class="hint">
          日期按浏览器当地时间输入；工程保存
          UTC。已有机位可继续微调，也可重新生成适合当前画幅的模板。
        </p>
      </section>
      <section>
        <div class="heading">
          <strong>03 / 分镜</strong
          ><span>{{ state.project.shots.length }} 镜头 · {{ duration.toFixed(1) }}s</span>
        </div>
        <div class="template-row">
          <select v-model="template" aria-label="镜头模板">
            <option v-for="item in CAPTURE_TEMPLATES" :key="item.id" :value="item.id">
              {{ item.label }}
            </option></select
          ><button
            type="button"
            :disabled="!state.subjectId"
            @click="controller.applyTemplate(template)"
          >
            生成分镜
          </button>
        </div>
        <p class="hint">
          生成分镜会替换当前镜头列表。建筑展示模板从当地太阳时约 14
          时开始；可再调整日期。请先保存需要保留的工程。
        </p>
        <ol v-if="state.project.shots.length" class="shots">
          <li
            v-for="(shot, index) in state.project.shots"
            :key="shot.id"
            :class="{ selected: shot.id === state.selectedShotId }"
          >
            <button
              class="shot-select"
              type="button"
              :aria-pressed="shot.id === state.selectedShotId"
              @click="controller.selectShot(shot.id)"
            >
              <span>{{ String(index + 1).padStart(2, '0') }}</span
              ><strong>{{ shot.name }}</strong
              ><small>{{ shot.duration }}s</small>
            </button>
            <div class="shot-views pair">
              <button
                type="button"
                :disabled="!state.subjectId"
                :aria-label="`移动到${shot.name}的起点视角`"
                @click="controller.moveToShotPose(shot.id, 'start')"
              >
                移动到起点视角
              </button>
              <button
                type="button"
                :disabled="!state.subjectId"
                :aria-label="`移动到${shot.name}的终点视角`"
                @click="controller.moveToShotPose(shot.id, 'end')"
              >
                移动到终点视角
              </button>
            </div>
            <div class="shot-actions">
              <button
                type="button"
                :disabled="index === 0"
                :aria-label="`上移${shot.name}`"
                @click="controller.moveShot(shot.id, -1)"
              >
                ↑</button
              ><button
                type="button"
                :disabled="index === state.project.shots.length - 1"
                :aria-label="`下移${shot.name}`"
                @click="controller.moveShot(shot.id, 1)"
              >
                ↓</button
              ><button type="button" @click="controller.duplicateShot(shot.id)">复制</button
              ><button type="button" class="shot-delete" @click="controller.removeShot(shot.id)">
                删除
              </button>
            </div>
          </li>
        </ol>
        <div class="actions">
          <button type="button" :disabled="!state.subjectId" @click="controller.addShot">
            ＋ 保存当前视角</button
          ><button
            type="button"
            :aria-pressed="state.pathVisible"
            :disabled="!duration"
            @click="controller.togglePath"
          >
            {{ state.pathVisible ? '隐藏路径' : '查看路径' }}
          </button>
        </div>
        <CaptureShotEditor
          v-if="selectedShot"
          :shot="selectedShot"
          :clips="selectedSubject?.clips ?? []"
          @update="controller.updateShot(selectedShot.id, $event)"
          @capture="controller.capturePose"
          @locate="controller.moveToShotPose(selectedShot.id, $event)"
          @distance="(which, value) => controller.setShotDistance(selectedShot!.id, which, value)"
        />
      </section>
      <section>
        <div class="heading">
          <strong>04 / 预览与输出</strong
          ><span>{{ dimensions.width }} × {{ dimensions.height }}</span>
        </div>
        <input
          class="scrubber"
          type="range"
          min="0"
          :max="duration || 1"
          :step="1 / state.project.fps"
          :value="state.current"
          :disabled="!duration"
          aria-label="拍摄进度"
          @input="controller.seek(Number(text($event)))"
        />
        <div class="timecode">
          <span>{{ state.current.toFixed(2) }} / {{ duration.toFixed(2) }}s</span
          ><span>{{ Math.round(duration * state.project.fps) }} 帧</span>
        </div>
        <div class="actions">
          <button
            class="primary"
            type="button"
            :disabled="!duration"
            @click="state.playing ? controller.pause() : controller.play()"
          >
            {{ state.playing ? '暂停' : '▶ 播放预览' }}</button
          ><button type="button" @click="controller.stop">停止并恢复</button
          ><button type="button" @click="controller.toggleClean">净画面</button>
        </div>
        <div class="pair">
          <label
            >输出内容<select v-model="exportScope">
              <option value="all">完整工程</option>
              <option value="shot">当前镜头</option>
              <option value="batch">逐镜头批次</option>
            </select></label
          ><label
            >输出格式<select v-model="exportFormat">
              <option value="mp4">MP4 视频</option>
              <option value="png">PNG 序列 ZIP</option>
            </select></label
          >
        </div>
        <label
          >单镜头首尾静止余量 / 秒<input
            type="number"
            min="0"
            max="5"
            step="0.1"
            :value="state.project.handles"
            @change="controller.patchProject({ handles: Number(text($event)) })"
        /></label>
        <button
          class="primary export"
          type="button"
          :disabled="!duration || !state.subjectId"
          @click="controller.exportMedia(exportFormat, exportScope)"
        >
          逐帧输出 {{ exportFormat === 'mp4' ? 'MP4' : 'PNG 序列' }}
        </button>
        <p class="hint">
          导出会逐帧等待资源加载。请保持页面在前台；可按 Esc
          取消。支持文件写入时直接存盘，普通下载上限 256 MB。批次输出可能需要浏览器允许多个下载。
        </p>
        <p class="hint">
          导出沿用“场景”中的画质与光照设置，并锁定输出像素。先试拍短镜头检查遮挡和构图；MP4
          需要浏览器支持当前尺寸的 H.264 编码。
        </p>
      </section>
    </fieldset>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { CaptureController } from './capture.controller'
import {
  CAPTURE_TEMPLATES,
  type CaptureTemplate,
  type CaptureProject,
} from '../../tools/capture/capture-project'
import type { CaptureExportFormat } from '../../tools/capture/capture-export'
import CaptureShotEditor from './CaptureShotEditor.vue'
const props = defineProps<{ controller: CaptureController }>()
const state = computed(() => props.controller.state)
const template = ref<CaptureTemplate>('tower')
const exportScope = ref<'all' | 'shot' | 'batch'>('all')
const exportFormat = ref<CaptureExportFormat>('mp4')
const fileInput = ref<HTMLInputElement>()
const savedId = ref('')
const duration = computed(() =>
  state.value.project.shots.reduce((total, shot) => total + shot.duration, 0),
)
const selectedShot = computed(() =>
  state.value.project.shots.find((shot) => shot.id === state.value.selectedShotId),
)
const selectedSubject = computed(() =>
  state.value.subjects.find((subject) => subject.id === state.value.subjectId),
)
const dimensions = computed(() => {
  const long = state.value.project.resolution === '4k' ? 3840 : 1920
  const short = state.value.project.resolution === '4k' ? 2160 : 1080
  return state.value.project.aspect === 'landscape'
    ? { width: long, height: short }
    : { width: short, height: long }
})
const localDate = computed(() => {
  const date = new Date(state.value.project.startTime)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
})
function text(event: Event): string {
  return (event.target as HTMLInputElement).value
}
function setAspect(event: Event): void {
  props.controller.patchProject({ aspect: text(event) as CaptureProject['aspect'] })
}
function setResolution(event: Event): void {
  props.controller.patchProject({ resolution: text(event) as CaptureProject['resolution'] })
}
function setFps(event: Event): void {
  props.controller.patchProject({ fps: Number(text(event)) as CaptureProject['fps'] })
}
function setDate(event: Event): void {
  const time = Date.parse(text(event))
  if (Number.isFinite(time)) {
    props.controller.patchProject({ startTime: new Date(time).toISOString() })
  }
}
function importFile(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    void props.controller.importProject(file)
  }
  input.value = ''
}
onMounted(props.controller.refreshSubjects)
onBeforeUnmount(props.controller.leavePanel)
</script>

<style scoped>
.capture-panel,
fieldset,
section {
  display: grid;
  gap: 12px;
}
.capture-header {
  display: grid;
  gap: 7px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--geo-line);
}
.capture-header > span {
  color: var(--geo-accent);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.22em;
}
.capture-header strong {
  font-size: 17px;
  font-weight: 600;
}
.capture-header p {
  margin: 0;
  color: var(--geo-text-faint);
  font-size: 11px;
  line-height: 1.6;
}
fieldset {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  gap: 22px;
}
section {
  min-width: 0;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--geo-line);
}
.heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
}
.heading > span {
  color: var(--geo-text-faint);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}
.heading > button {
  width: auto;
  min-height: 30px;
  font-size: 10px;
}
label {
  min-width: 0;
  display: grid;
  gap: 6px;
  font-size: 11px;
  color: var(--geo-text-soft);
}
input,
select,
button {
  min-width: 0;
  width: 100%;
  min-height: 35px;
  padding: 7px 8px;
  border: 1px solid var(--geo-line);
  border-radius: 8px;
  color: var(--geo-text);
  background: #0b1a27;
  font: inherit;
  box-sizing: border-box;
}
select {
  font-size: 11px;
}
button {
  cursor: pointer;
  font-size: 11px;
  transition: border-color 0.15s;
}
button:hover {
  border-color: var(--geo-accent);
}
button:disabled,
fieldset:disabled button {
  opacity: 0.4;
  cursor: default;
}
.primary {
  color: #041721;
  border-color: var(--geo-accent);
  background: var(--geo-accent);
  font-weight: 700;
}
.pair,
.actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
}
.actions:has(> :nth-child(3)) {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.template-row,
.saved {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px;
}
.saved {
  grid-template-columns: minmax(0, 1fr) auto auto;
}
.template-row button,
.saved button {
  width: auto;
}
.shots {
  display: grid;
  gap: 7px;
  list-style: none;
  padding: 0;
  margin: 0;
}
.shots li {
  overflow: hidden;
  border: 1px solid var(--geo-line);
  border-radius: 9px;
}
.shots li.selected {
  border-color: var(--geo-accent);
  background: rgba(73, 201, 255, 0.07);
}
.shot-select {
  display: flex;
  align-items: center;
  gap: 9px;
  border: 0;
  background: transparent;
  text-align: left;
}
.shot-select > span {
  color: var(--geo-accent);
  font-size: 10px;
}
.shot-select > strong {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  white-space: nowrap;
}
.shot-select > small {
  color: var(--geo-text-faint);
}
.shot-actions {
  display: flex;
  gap: 6px;
  padding: 0 6px 6px;
}
.shot-views {
  padding: 0 6px 6px;
}
.shot-views button {
  min-height: 30px;
  font-size: 10px;
}
.shot-actions button {
  min-height: 30px;
  font-size: 10px;
  border-color: transparent;
  background: transparent;
  transition:
    color 0.15s,
    border-color 0.15s,
    background-color 0.15s;
}
.shot-actions button:not(:disabled):is(:hover, :focus-visible) {
  color: var(--geo-accent);
  border-color: rgba(73, 201, 255, 0.45);
  background: rgba(73, 201, 255, 0.14);
}
.shot-actions .shot-delete:not(:disabled):is(:hover, :focus-visible) {
  color: #ffb3bd;
  border-color: rgba(255, 179, 189, 0.5);
  background: rgba(255, 179, 189, 0.14);
}
.shot-actions button:focus-visible {
  outline: 2px solid var(--geo-accent);
  outline-offset: 2px;
}
.shot-actions .shot-delete:focus-visible {
  outline-color: #ffb3bd;
}
.hint {
  margin: 0;
  color: var(--geo-text-faint);
  font-size: 10px;
  line-height: 1.65;
}
.error,
.notice {
  margin: 0;
  padding: 10px;
  border: 1px solid var(--geo-line);
  border-radius: 8px;
  font-size: 11px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}
.error {
  color: #ffb3bd;
  background: #57203140;
}
.notice {
  color: #b6e4f7;
  background: #1a536230;
}
.scrubber {
  padding: 0;
  accent-color: var(--geo-accent);
}
.timecode {
  display: flex;
  justify-content: space-between;
  margin-top: -8px;
  color: var(--geo-text-faint);
  font: 10px monospace;
}
.export {
  min-height: 40px;
}
.file-input {
  display: none;
}
input:focus-visible,
select:focus-visible,
button:focus-visible {
  outline: 2px solid var(--geo-accent);
  outline-offset: 2px;
}
</style>
