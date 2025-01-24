import { resolve } from 'path'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'

export default function svg() {
  return createSvgIconsPlugin({
    iconDirs: [resolve(process.cwd(), 'src/components/jt-global-register/components/jt-icon/svgs')],
    symbolId: '[name]',
    inject: 'body-last',
    customDomId: '__jt__svg__icons__dom__',
  })
}
