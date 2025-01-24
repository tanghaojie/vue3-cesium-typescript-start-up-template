import { Group, T } from '../../../Types'
import type { OnMountedOption } from '@/components/jt-toolbar/config/contents/Types'

const view: Group = {
  name: (t: T): string => {
    return t('toolbar.effect.earthColor', '地球颜色')
  },
  items: [
    {
      name: (t: T): string => {
        return t('toolbar.effect.uncoverColor', '无覆盖时颜色')
      },
      icon: 'earth',
      disable: false,
      dropdownOnClick: true,
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
