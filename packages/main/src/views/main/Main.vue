<script setup lang="ts">
import { onMounted } from 'vue'
import JtisVueCesium from '@/components/JtisVueCesium/JtisVueCesium.vue'

onMounted(function () {})
</script>

<template>
  <div class="w-screen h-screen overflow-hidden flex flex-col">
    <div class="flex-none h-[128px] transition-[height]"></div>
    <div class="flex-1 flex flex-row">
      <div class="flex-none w-[128px] transition-[width]"></div>
      <div class="flex-1">
        <JtisVueCesium
          :cesiumToken="'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxMjZjNGMyYy02ZmJlLTQ1ZGYtOWE2NC0yYTdjYmZhODUxYTgiLCJpZCI6NDMyMjgsImlhdCI6MTYxNzMzNDA5OX0.ox0okdwvueefvj7I4KVd9KNqVOEsMStSTmn8sDhoim4'"
        />
      </div>
    </div>
  </div>
</template>
