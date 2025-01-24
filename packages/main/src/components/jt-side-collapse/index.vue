<template>
  <div
    class="jt-side-collapse flex absolute top-0 bottom-0 left-0"
    :style="{ '--j-side-collapse-container-width': width }"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <transition name="container-animate">
      <div
        v-show="visible"
        class="container pointer-events-auto overflow-hidden"
        :style="{ 'background-color': bg }"
      >
        <slot />
      </div>
    </transition>
    <div
      :class="visible ? 'small' : 'big'"
      class="pin pointer-events-auto cursor-pointer"
      :style="{ 'background-color': pinbg }"
      @click="pin = !pin"
    >
      <div class="h-full flex justify-center items-center text-3xl">
        <svg
          v-if="!visible"
          viewBox="64 64 896 896"
          width="1em"
          height="1em"
          fill="white"
          aria-hidden="true"
          focusable="false"
          style="font-size: 32px"
        >
          <path
            d="M408 442h480c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H408c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8zm-8 204c0 4.4 3.6 8 8 8h480c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H408c-4.4 0-8 3.6-8 8v56zm504-486H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zm0 632H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zM142.4 642.1L298.7 519a8.84 8.84 0 0 0 0-13.9L142.4 381.9c-5.8-4.6-14.4-.5-14.4 6.9v246.3a8.9 8.9 0 0 0 14.4 7z"
          ></path>
        </svg>

        <svg
          v-else
          viewBox="64 64 896 896"
          width="1em"
          height="1em"
          fill="white"
          aria-hidden="true"
          focusable="false"
          :style="pin ? 'transform: rotate(-45deg);' : ''"
        >
          <path
            d="M878.3 392.1L631.9 145.7c-6.5-6.5-15-9.7-23.5-9.7s-17 3.2-23.5 9.7L423.8 306.9c-12.2-1.4-24.5-2-36.8-2-73.2 0-146.4 24.1-206.5 72.3a33.23 33.23 0 0 0-2.7 49.4l181.7 181.7-215.4 215.2a15.8 15.8 0 0 0-4.6 9.8l-3.4 37.2c-.9 9.4 6.6 17.4 15.9 17.4.5 0 1 0 1.5-.1l37.2-3.4c3.7-.3 7.2-2 9.8-4.6l215.4-215.4 181.7 181.7c6.5 6.5 15 9.7 23.5 9.7 9.7 0 19.3-4.2 25.9-12.4 56.3-70.3 79.7-158.3 70.2-243.4l161.1-161.1c12.9-12.8 12.9-33.8 0-46.8zM666.2 549.3l-24.5 24.5 3.8 34.4a259.92 259.92 0 0 1-30.4 153.9L262 408.8c12.9-7.1 26.3-13.1 40.3-17.9 27.2-9.4 55.7-14.1 84.7-14.1 9.6 0 19.3.5 28.9 1.6l34.4 3.8 24.5-24.5L608.5 224 800 415.5 666.2 549.3z"
          ></path>
        </svg>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue'

export default defineComponent({
  name: 'jt-side-collapse',
  props: {
    defaultPin: {
      type: Boolean,
      default: true,
    },
    width: {
      type: String,
      default: '300px',
      required: false,
    },
    bg: {
      type: String,
      default: 'rgba(56, 56, 56, 0.8)',
      required: false,
    },
    pinbg: {
      type: String,
      default: 'rgba(50, 50, 50, 0.9)',
      required: false,
    },
  },
  setup(props) {
    const hover = ref<boolean>(false)
    const pin = ref<boolean>(false)

    const visible = computed((): boolean => {
      return pin.value || hover.value
    })

    onMounted(() => {
      pin.value = props.defaultPin
    })

    return {
      hover,
      pin,
      visible,
    }
  },
})
</script>

<style scoped lang="scss">
.jt-side-collapse {
  .container {
    width: var(--j-side-collapse-container-width);
  }

  .container-animate-enter-active,
  .container-animate-leave-active {
    transition: width 0.3s ease-in-out;
  }
  .container-animate-enter-to,
  .container-animate-leave {
    width: var(--j-side-collapse-container-width);
  }
  .container-animate-enter,
  .container-animate-leave-to {
    width: 0;
  }

  --pin-height: 60px;
  .pin {
    height: var(--pin-height);
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
    margin-top: 100px;
    transition: width 0.8s ease;
  }

  .small {
    width: 30px;
  }
  .big {
    width: 50px;
  }
}
</style>
