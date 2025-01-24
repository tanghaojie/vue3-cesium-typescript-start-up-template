<template>
  <div class="tabs">
    <div class="flex flex-row justify-between">
      <div class="flex m-0 p-0 w-full bg-gray-700 list-none relative select-none">
        <template v-for="(content, index) in contents" :key="index">
          <div
            :class="{
              'cursor-not-allowed': !!content.disable || !!content.invisible,
            }"
          >
            <div
              v-if="!content.invisible"
              class="text-white py-1 px-6 list-none text-sm font-bold cursor-pointer hover:bg-gray-500"
              :class="{
                'bg-gray-500': index === currentIndex,
                'pointer-events-none': !!content.disable || !!content.invisible,
              }"
              @click="setCurrent(index, content)"
            >
              {{ contentName(content) }}
            </div>
          </div>
        </template>

        <div
          class="flex text-white py-1 px-2 mx-4 list-none cursor-pointer absolute right-0"
          @click="changeCurrentLanguage"
        >
          <div
            :class="{
              'font-bold': currentLanguage === 'zh',
              'text-xs': currentLanguage != 'zh',
            }"
          >
            中文
          </div>
          &nbsp; | &nbsp;
          <div
            :class="{
              'font-bold': currentLanguage === 'en',
              'text-xs': currentLanguage != 'en',
            }"
          >
            EN
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
const SELECTCHANGE_EVENT = 'selectChange'
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import type { Content } from '@/components/jt-toolbar/config/contents/Types'
import { useI18n } from 'vue-i18n'
import { setLocaleCache } from '@/i18n'

export default defineComponent({
  name: 'jt-menus',
  props: {
    contents: {
      type: Object as PropType<Array<Content>>,
      required: true,
    },
  },
  setup(props, context) {
    const currentIndex = ref(0)

    watch(currentIndex, () => {
      context.emit(SELECTCHANGE_EVENT, currentIndex.value)
    })

    const setCurrent = (index: number, content: Content) => {
      if (!!content.invisible || !!content.disable) {
        return
      }
      currentIndex.value = index
    }

    const i18n = useI18n()

    const currentLanguage = computed<string>((): string => {
      return i18n.locale.value
    })

    const changeCurrentLanguage = () => {
      const locale = i18n.locale.value === 'zh' ? 'en' : 'zh'
      i18n.locale.value = locale
      setLocaleCache(locale)
    }

    const contentName = (content: Content): string => {
      if (content.name instanceof Function) {
        return content.name(i18n.t)
      }
      return content.name as string
    }

    return {
      currentIndex,
      setCurrent,
      currentLanguage,
      changeCurrentLanguage,
      contentName,
    }
  },
  emits: {
    [SELECTCHANGE_EVENT](index: number) {
      return true
    },
  },
})
</script>
