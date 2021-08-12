<template>
  <div
    ref="el"
    :style="style"
    class="v3dr"
    @mousedown="elementMouseDown"
    @touchstart="elementTouchDown"
  >
    <div
      v-for="handle in actualHandles"
      :key="handle"
      :class="['handle', 'handle-' + handle]"
      @mousedown.stop.prevent="handleDown(handle, $event)"
      @touchstart.stop.prevent="handleTouchDown(handle, $event)"
    ></div>
    <slot></slot>
  </div>
</template>

<script lang="ts">
function addEvent(
  el: HTMLElement | Window | undefined,
  event: string,
  handler: any
) {
  if (!el) {
    return
  }
  if ((el as any).attachEvent) {
    ;(el as any).attachEvent('on' + event, handler)
  } else if (el.addEventListener) {
    el.addEventListener(event, handler, true)
  } else {
    ;(el as any)['on' + event] = handler
  }
}

function removeEvent(
  el: HTMLElement | Window | undefined,
  event: string,
  handler: any
) {
  if (!el) {
    return
  }
  if ((el as any).attachEvent) {
    ;(el as any).detachEvent('on' + event, handler)
  } else if (el.removeEventListener) {
    el.removeEventListener(event, handler, true)
  } else {
    ;(el as any)['on' + event] = null
  }
}

function getComputedSize(el: HTMLElement) {
  const style = window.getComputedStyle(el)
  return [
    parseFloat(style.getPropertyValue('width')),
    parseFloat(style.getPropertyValue('height')),
  ]
}

function snapToGrid(
  grid: number[],
  pendingX: number,
  pendingY: number
): number[] {
  const x = Math.round(pendingX / grid[0]) * grid[0]
  const y = Math.round(pendingY / grid[1]) * grid[1]
  return [x, y]
}

function restrictToBounds(
  value: number,
  min: number | null,
  max: number | null
) {
  if (min !== null && value < min) {
    return min
  }
  if (max !== null && max < value) {
    return max
  }
  return value
}

function computeWidth(
  parentWidth: number,
  left: number,
  right: number
): number {
  return parentWidth - left - right
}

function computeHeight(
  parentHeight: number,
  top: number,
  bottom: number
): number {
  return parentHeight - top - bottom
}

function isFunction(func: any): boolean {
  return (
    typeof func === 'function' ||
    Object.prototype.toString.call(func) === '[object Function]'
  )
}

function matchesSelectorToParentElements(
  el: HTMLElement,
  selector: string,
  baseNode: HTMLElement
) {
  let node: Node | null = el

  const matchesSelectorFunc = [
    'matches',
    'webkitMatchesSelector',
    'mozMatchesSelector',
    'msMatchesSelector',
    'oMatchesSelector',
  ].find((func) => isFunction((node as any)[func]))
  if (!matchesSelectorFunc || !isFunction((node as any)[matchesSelectorFunc])) {
    return false
  }
  do {
    if ((node as any)[matchesSelectorFunc](selector)) {
      return true
    }
    if (node === baseNode) {
      return false
    }
    node = node.parentNode
  } while (node)

  return false
}

const events = {
  mouse: {
    start: 'mousedown',
    move: 'mousemove',
    stop: 'mouseup',
  },
  touch: {
    start: 'touchstart',
    move: 'touchmove',
    stop: 'touchend',
  },
}

const userSelectNone = {
  userSelect: 'none',
  MozUserSelect: 'none',
  WebkitUserSelect: 'none',
  MsUserSelect: 'none',
}

const userSelectAuto = {
  userSelect: 'auto',
  MozUserSelect: 'auto',
  WebkitUserSelect: 'auto',
  MsUserSelect: 'auto',
}

let eventsFor = events.mouse

type Bounds = {
  minLeft: number | null
  maxLeft: number | null
  minRight: number | null
  maxRight: number | null
  minTop: number | null
  maxTop: number | null
  minBottom: number | null
  maxBottom: number | null
}

type OnDragStartHandler = (e: MouseEvent | TouchEvent) => boolean

type DragHandler = (left: number, top: number) => boolean

type OnResizeStartHandler = (
  handle: string,
  e: MouseEvent | TouchEvent
) => boolean

type ResizeHandler = (
  handle: string,
  left: number,
  top: number,
  width: number,
  height: number
) => boolean

const RESIZING_EVNET = 'resizing'
const DRAGGING_EVENT = 'dragging'

import {
  defineComponent,
  onMounted,
  onBeforeUnmount,
  ref,
  reactive,
  computed,
  watch,
  PropType,
} from 'vue'

export default defineComponent({
  name: 'vue3-draggable-resizable',

  props: {
    x: {
      type: Number,
      default: 0,
    },

    y: {
      type: Number,
      default: 0,
    },

    w: {
      type: [Number, String],
      default: 200,
      validator: (val: number | string) => {
        if (typeof val === 'number') {
          return val > 0
        }
        return val === 'auto'
      },
    },

    h: {
      type: [Number, String],
      default: 200,
      validator: (val: number | string) => {
        if (typeof val === 'number') {
          return val > 0
        }
        return val === 'auto'
      },
    },

    parent: {
      type: Boolean,
      default: false,
    },

    axis: {
      type: String,
      default: 'both',
      validator: (val: string) => ['x', 'y', 'both'].includes(val),
    },

    grid: {
      type: Array as PropType<number[]>,
      default: () => [1, 1],
    },

    handles: {
      type: Array as PropType<string[]>,
      default: () => ['tl', 'tm', 'tr', 'mr', 'ml', 'br', 'bm', 'bl'],
      validator: (val: string[]) => {
        const s = new Set(['tl', 'tm', 'tr', 'mr', 'ml', 'br', 'bm', 'bl'])
        return new Set(val.filter((h) => s.has(h))).size === val.length
      },
    },

    draggable: {
      type: Boolean,
      default: true,
    },

    resizable: {
      type: Boolean,
      default: true,
    },

    lockAspectRatio: {
      type: Boolean,
      default: false,
    },

    minWidth: {
      type: Number,
      default: 0,
      validator: (val: number) => val >= 0,
    },

    minHeight: {
      type: Number,
      default: 0,
      validator: (val: number) => val >= 0,
    },

    maxWidth: {
      type: Number,
      default: 0,
      validator: (val: number) => val >= 0,
    },

    maxHeight: {
      type: Number,
      default: 0,
      validator: (val: number) => val >= 0,
    },

    disableUserSelect: {
      type: Boolean,
      default: true,
    },

    onDragStart: {
      type: Function as PropType<OnDragStartHandler>,
      default: () => true,
    },

    onDrag: {
      type: Function as PropType<DragHandler>,
      default: () => true,
    },

    onResizeStart: {
      type: Function as PropType<OnResizeStartHandler>,
      default: () => true,
    },

    onResize: {
      type: Function as PropType<ResizeHandler>,
      default: () => true,
    },

    resizeAreaSize: {
      type: Number,
      default: 5,
    },

    dragHandle: {
      type: String,
      default: '',
    },

    initialPosition: {
      type: String,
      default: '',
      validator: (val: string) =>
        ['', 'tl', 'tm', 'tr', 'ml', 'mm', 'mr', 'bl', 'bm', 'br'].includes(
          val
        ),
    },
  },

  setup(props, context) {
    const el = ref<HTMLElement | null>(null)
    const left = ref(props.x)
    const right = ref(0)
    const top = ref(props.y)
    const bottom = ref(0)
    const width = ref(0)
    const height = ref(0)
    const widthTouched = ref(false)
    const heightTouched = ref(false)
    const resizing = ref(false)
    const dragging = ref(false)
    const aspectFactor = ref<number>(0)
    const parentWidth = ref(0)
    const parentHeight = ref(0)
    const handle = ref('')
    const mouseClickPosition = reactive({
      mouseX: 0,
      mouseY: 0,
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    })
    const bounds = reactive<Bounds>({
      minLeft: null,
      maxLeft: null,
      minRight: null,
      maxRight: null,
      minTop: null,
      maxTop: null,
      minBottom: null,
      maxBottom: null,
    })

    // methods
    const resetBoundsAndMouseState = () => {
      mouseClickPosition.mouseX = 0
      mouseClickPosition.mouseY = 0
      mouseClickPosition.left = 0
      mouseClickPosition.right = 0
      mouseClickPosition.top = 0
      mouseClickPosition.bottom = 0
      bounds.minLeft = null
      bounds.maxLeft = null
      bounds.minRight = null
      bounds.maxRight = null
      bounds.minTop = null
      bounds.maxTop = null
      bounds.minBottom = null
      bounds.maxBottom = null
    }

    const handleUp = () => {
      handle.value = ''
      resetBoundsAndMouseState()

      resizing.value = false
      dragging.value = false

      removeEvent(document.documentElement, eventsFor.move, handleResize)
      removeEvent(document.documentElement, eventsFor.move, handleDrag)
    }

    const checkParentSize = () => {
      if (props.parent) {
        const [newParentWidth, newParentHeight] = getParentSize()
        parentWidth.value = newParentWidth
        parentHeight.value = newParentHeight
        right.value = parentWidth.value - width.value - left.value
        bottom.value = parentHeight.value - height.value - top.value
      }
    }

    const getParentSize = () => {
      if (el.value && props.parent) {
        const style = window.getComputedStyle(
          el.value.parentNode as Element,
          null
        )
        return [
          parseInt(style.getPropertyValue('width'), 10),
          parseInt(style.getPropertyValue('height'), 10),
        ]
      }
      return [0, 0]
    }

    const changeWidth = (val: number): void => {
      const [newWidth, _] = snapToGrid(props.grid, val, 0)
      const r = restrictToBounds(
        parentWidth.value - newWidth - left.value,
        bounds.minRight,
        bounds.maxRight
      )
      let b = bottom.value
      if (props.lockAspectRatio) {
        b = bottom.value - (right.value - r) / aspectFactor.value
      }
      const w = computeWidth(parentWidth.value, left.value, r)
      const h = computeHeight(parentHeight.value, top.value, b)
      right.value = r
      bottom.value = b
      width.value = w
      height.value = h
    }

    const changeHeight = (val: number): void => {
      const [_, newHeight] = snapToGrid(props.grid, 0, val)
      let b = restrictToBounds(
        parentHeight.value - newHeight - top.value,
        bounds.minBottom,
        bounds.maxBottom
      )
      let r = right.value
      if (props.lockAspectRatio) {
        r = right.value - (bottom.value - b) * aspectFactor.value
      }
      const w = computeWidth(parentWidth.value, left.value, r)
      const h = computeHeight(parentHeight.value, top.value, b)
      right.value = r
      bottom.value = b
      width.value = w
      height.value = h
    }

    const moveHorizontally = (val: number) => {
      const [deltaX, _] = snapToGrid(props.grid, val, top.value)
      const l = restrictToBounds(deltaX, bounds.minLeft, bounds.maxLeft)
      left.value = l
      right.value = parentWidth.value - width.value - l
    }

    const moveVertically = (val: number) => {
      const [_, deltaY] = snapToGrid(props.grid, left.value, val)
      const t = restrictToBounds(deltaY, bounds.minTop, bounds.maxTop)
      top.value = t
      bottom.value = parentHeight.value - height.value - t
    }

    // drag
    const elementTouchDown = (e: TouchEvent): void => {
      eventsFor = events.touch
      elementDown(e)
    }

    const elementMouseDown = (e: MouseEvent) => {
      eventsFor = events.mouse
      elementDown(e)
    }

    const elementDown = (e: MouseEvent | TouchEvent) => {
      if (!props.draggable || (e instanceof MouseEvent && e.which !== 1)) {
        return
      }
      const target = e.target || e.srcElement
      if (el.value && target && el.value.contains(target as Node)) {
        if (!props.onDragStart(e)) {
          return
        }
        if (
          props.dragHandle &&
          !matchesSelectorToParentElements(
            target as HTMLElement,
            props.dragHandle,
            el.value
          )
        ) {
          dragging.value = false
          return
        }

        mouseClickPosition.mouseX =
          e instanceof TouchEvent ? e.touches[0].pageX : e.pageX
        mouseClickPosition.mouseY =
          e instanceof TouchEvent ? e.touches[0].pageY : e.pageY
        mouseClickPosition.left = left.value
        mouseClickPosition.right = right.value
        mouseClickPosition.top = top.value
        mouseClickPosition.bottom = bottom.value
        if (props.parent) {
          calcDragLimits()
        }

        addEvent(document.documentElement, eventsFor.move, handleDrag)
        addEvent(document.documentElement, eventsFor.stop, handleUp)
      }
    }

    const handleDrag = (e: MouseEvent | TouchEvent) => {
      const axis = props.axis
      const tmpDeltaX =
        axis && axis !== 'y'
          ? mouseClickPosition.mouseX -
            (e instanceof MouseEvent ? e.pageX : e.touches[0].pageX)
          : 0
      const tmpDeltaY =
        axis && axis !== 'x'
          ? mouseClickPosition.mouseY -
            (e instanceof MouseEvent ? e.pageY : e.touches[0].pageY)
          : 0

      const [deltaX, deltaY] = snapToGrid(props.grid, tmpDeltaX, tmpDeltaY)

      const l = restrictToBounds(
        mouseClickPosition.left - deltaX,
        bounds.minLeft,
        bounds.maxLeft
      )
      const t = restrictToBounds(
        mouseClickPosition.top - deltaY,
        bounds.minTop,
        bounds.maxTop
      )
      if (!props.onDrag(l, t)) {
        return
      }
      const r = restrictToBounds(
        mouseClickPosition.right + deltaX,
        bounds.minRight,
        bounds.maxRight
      )
      const b = restrictToBounds(
        mouseClickPosition.bottom + deltaY,
        bounds.minBottom,
        bounds.maxBottom
      )

      left.value = l
      top.value = t
      right.value = r
      bottom.value = b

      context.emit(DRAGGING_EVENT, l, t)
      dragging.value = true
    }

    const calcDragLimits = (): void => {
      const grid = props.grid
      bounds.minLeft = left.value % grid[0]
      bounds.maxLeft =
        Math.floor((parentWidth.value - width.value - left.value) / grid[0]) *
          grid[0] +
        left.value
      bounds.minRight = right.value % grid[0]
      bounds.maxRight =
        Math.floor((parentWidth.value - width.value - right.value) / grid[0]) *
          grid[0] +
        right.value
      bounds.minTop = top.value % grid[1]
      bounds.maxTop =
        Math.floor((parentHeight.value - height.value - top.value) / grid[1]) *
          grid[0] +
        top.value
      bounds.minBottom = bottom.value % grid[1]
      bounds.maxBottom =
        Math.floor(
          (parentHeight.value - height.value - bottom.value) / grid[1]
        ) *
          grid[0] +
        bottom.value
    }

    // resize
    const handleTouchDown = (h: string, e: TouchEvent) => {
      eventsFor = events.touch
      handleDown(h, e)
    }

    const handleDown = (h: string, e: MouseEvent | TouchEvent) => {
      if (
        !props.resizable ||
        (e instanceof MouseEvent && e.which !== 1) ||
        !props.onResizeStart(h, e)
      ) {
        return
      }
      e.stopPropagation && e.stopPropagation()

      // Here we avoid a dangerous recursion by faking
      // corner handles as middle handles
      if (props.lockAspectRatio && !h.includes('m')) {
        handle.value = 'm' + h.substring(1)
      } else {
        handle.value = h
      }

      mouseClickPosition.mouseX =
        e instanceof MouseEvent ? e.pageX : e.touches[0].pageX
      mouseClickPosition.mouseY =
        e instanceof MouseEvent ? e.pageY : e.touches[0].pageY
      mouseClickPosition.left = left.value
      mouseClickPosition.right = right.value
      mouseClickPosition.top = top.value
      mouseClickPosition.bottom = bottom.value

      calcResizeLimits()

      addEvent(document.documentElement, eventsFor.move, handleResize)
      addEvent(document.documentElement, eventsFor.stop, handleUp)
    }

    const handleResize = (e: MouseEvent | TouchEvent) => {
      let l = left.value
      let t = top.value
      let r = right.value
      let b = bottom.value

      const tmpDeltaX =
        mouseClickPosition.mouseX -
        (e instanceof MouseEvent ? e.pageX : e.touches[0].pageX)
      const tmpDeltaY =
        mouseClickPosition.mouseY -
        (e instanceof MouseEvent ? e.pageY : e.touches[0].pageY)

      if (!widthTouched.value && tmpDeltaX) {
        widthTouched.value = true
      }
      if (!heightTouched.value && tmpDeltaY) {
        heightTouched.value = true
      }

      const [deltaX, deltaY] = snapToGrid(props.grid, tmpDeltaX, tmpDeltaY)

      if (handle.value.includes('b')) {
        b = restrictToBounds(
          mouseClickPosition.bottom + deltaY,
          bounds.minBottom,
          bounds.maxBottom
        )
        if (props.lockAspectRatio && resizingOnY) {
          r = r - (bottom.value - b) * aspectFactor.value
        }
      } else if (handle.value.includes('t')) {
        t = restrictToBounds(
          mouseClickPosition.top - deltaY,
          bounds.minTop,
          bounds.maxTop
        )
        if (props.lockAspectRatio && resizingOnY) {
          l = l - (top.value - t) * aspectFactor.value
        }
      }
      if (handle.value.includes('r')) {
        r = restrictToBounds(
          mouseClickPosition.right + deltaX,
          bounds.minRight,
          bounds.maxRight
        )
        if (props.lockAspectRatio && resizingOnX) {
          b = b - (right.value - r) / aspectFactor.value
        }
      } else if (handle.value.includes('l')) {
        l = restrictToBounds(
          mouseClickPosition.left - deltaX,
          bounds.minLeft,
          bounds.maxLeft
        )
        if (props.lockAspectRatio && resizingOnX) {
          t = t - (left.value - l) / aspectFactor.value
        }
      }

      const cW = computeWidth(parentWidth.value, l, r)
      const cH = computeHeight(parentHeight.value, t, b)

      if (!props.onResize(handle.value, l, t, cW, cH)) {
        return
      }

      left.value = l
      top.value = t
      right.value = r
      bottom.value = b
      width.value = cW
      height.value = cH

      context.emit(RESIZING_EVNET, l, t, cW, cH)

      resizing.value = true
    }

    const calcResizeLimits = () => {
      let minW = props.minWidth
      let minH = props.minHeight
      let maxW = props.maxWidth
      let maxH = props.maxHeight
      const [gridX, gridY] = props.grid
      const w = width.value
      const h = height.value
      const l = left.value
      const t = top.value
      const r = right.value
      const b = bottom.value

      if (props.lockAspectRatio) {
        if (minW / minH > aspectFactor.value) {
          minH = minW / aspectFactor.value
        } else {
          minW = aspectFactor.value * minH
        }
        if (maxW && maxH) {
          maxW = Math.min(maxW, aspectFactor.value * maxH)
          maxH = Math.min(maxH, maxW / aspectFactor.value)
        } else if (maxW) {
          maxH = maxW / aspectFactor.value
        } else if (maxH) {
          maxW = aspectFactor.value * maxH
        }
      }

      maxW = maxW - (maxW % gridX)
      maxH = maxH - (maxH % gridY)
      bounds.minLeft = null
      bounds.maxLeft = null
      bounds.minTop = null
      bounds.maxTop = null
      bounds.minRight = null
      bounds.maxRight = null
      bounds.minBottom = null
      bounds.maxBottom = null

      if (props.parent) {
        bounds.minLeft = l % gridX
        bounds.maxLeft = l + Math.floor((w - minW) / gridX) * gridX
        bounds.minTop = t % gridY
        bounds.maxTop = t + Math.floor((h - minH) / gridY) * gridY
        bounds.minRight = r % gridX
        bounds.maxRight = r + Math.floor((w - minW) / gridX) * gridX
        bounds.minBottom = b % gridY
        bounds.maxBottom = b + Math.floor((h - minH) / gridY) * gridY
        if (maxW) {
          bounds.minLeft = Math.max(
            bounds.minLeft,
            parentWidth.value - r - maxW
          )
          bounds.minRight = Math.max(
            bounds.minRight,
            parentWidth.value - l - maxW
          )
        }
        if (maxH) {
          bounds.minTop = Math.max(bounds.minTop, parentHeight.value - b - maxH)
          bounds.minBottom = Math.max(
            bounds.minBottom,
            parentHeight.value - t - maxH
          )
        }
        if (props.lockAspectRatio) {
          bounds.minLeft = Math.max(bounds.minLeft, l - t * aspectFactor.value)
          bounds.minTop = Math.max(bounds.minTop, t - l / aspectFactor.value)
          bounds.minRight = Math.max(
            bounds.minRight,
            r - b * aspectFactor.value
          )
          bounds.minBottom = Math.max(
            bounds.minBottom,
            b - r / aspectFactor.value
          )
        }
      } else {
        bounds.minLeft = null
        bounds.maxLeft = l + Math.floor((w - minW) / gridX) * gridX
        bounds.minTop = null
        bounds.maxTop = t + Math.floor((h - minH) / gridY) * gridY
        bounds.minRight = null
        bounds.maxRight = r + Math.floor((w - minW) / gridX) * gridX
        bounds.minBottom = null
        bounds.maxBottom = b + Math.floor((h - minH) / gridY) * gridY
        if (maxW) {
          bounds.minLeft = -(r + maxW)
          bounds.minRight = -(l + maxW)
        }
        if (maxH) {
          bounds.minTop = -(b + maxH)
          bounds.minBottom = -(t + maxH)
        }
        if (props.lockAspectRatio && maxW && maxH) {
          bounds.minLeft = Math.min(bounds.minLeft || 0, -(r + maxW))
          bounds.minTop = Math.min(bounds.minTop || 0, -(maxH + b))
          bounds.minRight = Math.min(bounds.minRight || 0, -l - maxW)
          bounds.minBottom = Math.min(bounds.minBottom || 0, -t - maxH)
        }
      }
    }

    // Computed
    const style = computed(() => {
      return {
        transform: `translate(${left.value}px, ${top.value}px)`,
        width: computedWidth.value,
        height: computedHeight.value,
        ...(dragging.value && props.disableUserSelect
          ? userSelectNone
          : userSelectAuto),
        '--resize-area-size': `${props.resizeAreaSize}px`,
      }
    })

    const computedWidth = computed(() => {
      if (props.w === 'auto' && !heightTouched.value) {
        return 'auto'
      }
      return width.value + 'px'
    })

    const computedHeight = computed(() => {
      if (props.h === 'auto' && !widthTouched.value) {
        return 'auto'
      }
      return height.value + 'px'
    })

    const actualHandles = computed(() => {
      if (!props.resizable) {
        return []
      }
      return props.handles
    })

    const resizingOnX = computed(() => {
      return (
        handle.value &&
        (handle.value.includes('l') || handle.value.includes('r'))
      )
    })

    const resizingOnY = computed(() => {
      return (
        handle.value &&
        (handle.value.includes('t') || handle.value.includes('b'))
      )
    })

    // watch
    watch(
      () => props.w,
      (val) => {
        if (resizing.value || dragging.value) {
          return
        }
        if (props.parent) {
          calcResizeLimits()
        }
        changeWidth(val as number)
      }
    )

    watch(
      () => props.h,
      (val) => {
        if (resizing.value || dragging.value) {
          return
        }
        if (props.parent) {
          calcResizeLimits()
        }
        changeHeight(val as number)
      }
    )

    watch(
      () => props.lockAspectRatio,
      (val) => {
        if (val) {
          aspectFactor.value = width.value / height.value
        } else {
          aspectFactor.value = 0
        }
      }
    )

    watch(
      () => props.minWidth,
      (val) => {
        if (val < 0 && val > width.value) {
          console.warn(
            'Invalid prop: minWidth cannot be greater than width or negative'
          )
        }
      }
    )

    watch(
      () => props.minHeight,
      (val) => {
        if (val < 0 && val > height.value) {
          console.warn(
            'Invalid prop: minHeight cannot be greater than height or negative'
          )
        }
      }
    )

    watch(
      () => props.x,
      (val) => {
        if (resizing.value || dragging.value) {
          return
        }
        if (props.parent) {
          calcDragLimits()
        }
        moveHorizontally(val)
      }
    )

    watch(
      () => props.y,
      (val) => {
        if (resizing.value || dragging.value) {
          return
        }
        if (props.parent) {
          calcDragLimits()
        }
        moveVertically(val)
      }
    )

    onMounted(() => {
      if (!el.value) {
        return
      }

      const [pWidth, pHeight] = getParentSize()
      parentWidth.value = pWidth
      parentHeight.value = pHeight

      const [domW, domH] = getComputedSize(el.value)

      const elW = props.w !== 'auto' ? (props.w as number) : domW
      const elH = props.h !== 'auto' ? (props.h as number) : domH

      if (props.initialPosition) {
        const [yAxis, xAxis] = props.initialPosition
        switch (yAxis) {
          case 't':
            break
          case 'm':
            top.value = (pHeight - elH) / 2
            break
          case 'b':
            top.value = pHeight - elH
        }
        switch (xAxis) {
          case 'l':
            break
          case 'm':
            left.value = (pWidth - elW) / 2
            break
          case 'r':
            left.value = pWidth - elW
            break
        }
      }

      aspectFactor.value = elW / elH

      width.value = elW
      height.value = elH

      right.value = parentWidth.value - width.value - left.value
      bottom.value = parentHeight.value - height.value - top.value

      addEvent(window, 'resize', checkParentSize)
    })

    onBeforeUnmount(() => {
      removeEvent(window, events.mouse.stop, handleUp)
      removeEvent(window, events.touch.stop, handleUp)
      removeEvent(window, 'resize', checkParentSize)
    })

    return {
      el,
      left,
      right,
      top,
      bottom,
      width,
      height,
      widthTouched,
      heightTouched,
      resizing,
      dragging,
      aspectFactor,
      parentWidth,
      parentHeight,
      handle,
      mouseClickPosition,
      bounds,

      // methods
      resetBoundsAndMouseState,
      handleUp,
      checkParentSize,
      getParentSize,
      changeWidth,
      changeHeight,
      moveHorizontally,
      moveVertically,

      elementTouchDown,
      elementMouseDown,
      elementDown,
      handleDrag,
      calcDragLimits,

      handleTouchDown,
      handleDown,
      handleResize,
      calcResizeLimits,

      // Computed
      style,
      computedWidth,
      computedHeight,
      actualHandles,
      resizingOnX,
      resizingOnY,
    }
  },

  created() {
    const { minWidth, maxWidth, minHeight, maxHeight } = this
    if (maxWidth && minWidth > maxWidth) {
      console.warn('Invalid prop: minWidth cannot be greater than maxWidth')
    }
    if (maxHeight && minHeight > maxHeight) {
      console.warn('Invalid prop: minHeight cannot be greater than maxHeight')
    }
    this.resetBoundsAndMouseState()
  },

  emits: {
    [RESIZING_EVNET](left: number, top: number, width: number, height: number) {
      return true
    },

    [DRAGGING_EVENT](left: number, top: number) {
      return true
    },
  },
})
</script>

<style scoped>
.v3dr {
  box-sizing: border-box;
  touch-action: none;
  position: absolute;
}

.handle {
  opacity: 0;
  z-index: 99999;
  position: absolute;
}

.handle-tl {
  width: var(--resize-area-size);
  height: var(--resize-area-size);
  top: 0;
  left: 0;
  cursor: nw-resize;
  background: red;
}

.handle-tm {
  width: calc(100% - var(--resize-area-size) * 2);
  height: var(--resize-area-size);
  top: 0;
  left: var(--resize-area-size);
  cursor: n-resize;
  background: blue;
}

.handle-tr {
  width: var(--resize-area-size);
  height: var(--resize-area-size);
  top: 0;
  right: 0;
  cursor: ne-resize;
  background: red;
}

.handle-ml {
  width: var(--resize-area-size);
  height: calc(100% - var(--resize-area-size) * 2);
  top: var(--resize-area-size);
  left: 0;
  cursor: w-resize;
  background: blue;
}

.handle-mr {
  width: var(--resize-area-size);
  height: calc(100% - var(--resize-area-size) * 2);
  top: var(--resize-area-size);
  right: 0;
  cursor: e-resize;
  background: blue;
}

.handle-bl {
  width: var(--resize-area-size);
  height: var(--resize-area-size);
  bottom: 0;
  left: 0;
  cursor: sw-resize;
  background: red;
}

.handle-bm {
  width: calc(100% - var(--resize-area-size) * 2);
  height: var(--resize-area-size);
  left: var(--resize-area-size);
  bottom: 0;
  cursor: e-resize;
  cursor: s-resize;
  background: blue;
}

.handle-br {
  width: var(--resize-area-size);
  height: var(--resize-area-size);
  bottom: 0;
  right: 0;
  cursor: se-resize;
  background: red;
}
</style>
