<template>
  <el-scrollbar class="m-4">
    <imageryManager />
    <primitiveManager />
    <terrainManager />
  </el-scrollbar>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElScrollbar } from 'element-plus'
import { useStore } from '@/store'
import { LayoutActionTypes } from '@/store/modules/jt-cesium-vue/modules/layout/action-types'
import UrlQuery from '@/utils/url-query'

import imageryManager from './imagery/imagery-manager.vue'
import terrainManager from './terrain/terrain-manager.vue'
import primitiveManager from './primitive/primitive-manager.vue'

export default defineComponent({
  name: 'jt-browser-panel',
  components: { ElScrollbar, imageryManager, terrainManager, primitiveManager },
  setup() {
    onMounted(() => {
      const route = useRoute()
      const store = useStore()
      const hideBrowserPanel = route.query[UrlQuery.HideBrowserPanel]
      if (hideBrowserPanel) {
        store.dispatch(`jtCesiumVue/layout/${LayoutActionTypes.SET_SHOW_BROWSER_PANEL}`, false)
      }
    })
  },
})
</script>
