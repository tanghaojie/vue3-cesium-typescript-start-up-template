import { Group } from '../../../Types'
import type { OnMountedOption } from '@/components/jt-cesium-vue/toolbar/config/contents/Types'

const view: Group = {
  name: '地球颜色',
  items: [
    {
      name: '无覆盖时颜色',
      icon: 'earth',
      disable: false,
      dropdown: {
        componentName: 'earth-surface-color-picker',
      },
      onMounted: (options: OnMountedOption | undefined): void => {
        if (options) {
          const { viewer, iconEl } = options
          if (viewer && iconEl) {
            const c = viewer.scene.globe.baseColor
            iconEl.style.color = `rgba(${c.red * 255},${c.green * 255},${
              c.blue * 255
            },${c.alpha})`
          }
        }
      },
    },
  ],
}

export default view
