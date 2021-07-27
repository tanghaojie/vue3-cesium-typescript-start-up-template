<template>
  <el-scrollbar class="m-4">
    <imageryManager />
    <primitiveManager />
    <terrainManager />
  </el-scrollbar>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { ElScrollbar } from 'element-plus'

import imageryManager from './imagery-manager.vue'
import terrainManager from './terrain-manager.vue'
import primitiveManager from './primitive-manager.vue'

export default defineComponent({
  name: '',
  components: { ElScrollbar, imageryManager, terrainManager, primitiveManager },
})
</script>
