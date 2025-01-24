import { Plugin, HtmlTagDescriptor, normalizePath, UserConfig } from 'vite'
import { join, posix } from 'path'
import { copy } from 'fs-extra'
import externalGlobals from 'rollup-plugin-external-globals'
import serveStatic from 'serve-static'

export interface VitePluginCesiumOptions {
  rebuildCesium?: boolean
  devMinifyCesium?: boolean
  cesiumBuildRootPath?: string
  cesiumBuildPath?: string
}

export default function vitePluginCesium(options: VitePluginCesiumOptions = {}): Plugin {
  const {
    rebuildCesium = false,
    devMinifyCesium = false,
    cesiumBuildRootPath = 'node_modules/cesium/Build',
    cesiumBuildPath = 'node_modules/cesium/Build/Cesium/',
  } = options

  let CESIUM_BASE_URL = 'cesium/'
  let outDir = 'dist'
  let base: string = '/'
  let isBuild: boolean = false

  return {
    name: 'vite-plugin-cesium',

    config(c, { command }) {
      isBuild = command === 'build'

      c.base && (base = c.base)
      base === '' && (base = './')
      c.build?.outDir && (outDir = c.build.outDir)

      CESIUM_BASE_URL = posix.join(base, CESIUM_BASE_URL)
      const userConfig: UserConfig = {}
      if (!isBuild) {
        // -----------dev-----------
        userConfig.define = {
          CESIUM_BASE_URL: JSON.stringify(CESIUM_BASE_URL),
        }
      } else {
        // -----------build------------
        if (rebuildCesium) {
          // build 1) rebuild cesium library
          userConfig.build = {
            assetsInlineLimit: 0,
            chunkSizeWarningLimit: 5000,
            rollupOptions: {
              output: {
                intro: `window.CESIUM_BASE_URL = "${CESIUM_BASE_URL}";`,
              },
            },
          }
        } else {
          // build 2) copy Cesium.js later
          userConfig.build = {
            rollupOptions: {
              external: ['cesium'],
              plugins: [externalGlobals({ cesium: 'Cesium' })],
            },
          }
        }
      }
      return userConfig
    },

    configureServer({ middlewares }) {
      const cesiumPath = join(cesiumBuildRootPath, devMinifyCesium ? 'Cesium' : 'CesiumUnminified')
      middlewares.use(posix.join('/', CESIUM_BASE_URL), serveStatic(cesiumPath))
    },

    async closeBundle() {
      if (isBuild) {
        try {
          await copy(join(cesiumBuildPath, 'Assets'), join(outDir, 'cesium/Assets'))
          await copy(join(cesiumBuildPath, 'ThirdParty'), join(outDir, 'cesium/ThirdParty'))
          await copy(join(cesiumBuildPath, 'Workers'), join(outDir, 'cesium/Workers'))
          await copy(join(cesiumBuildPath, 'Widgets'), join(outDir, 'cesium/Widgets'))
          if (!rebuildCesium) {
            await copy(join(cesiumBuildPath, 'Cesium.js'), join(outDir, 'cesium/Cesium.js'))
          }
        } catch (err) {
          console.error('copy failed', err)
        }
      }
    },

    transformIndexHtml() {
      const tags: HtmlTagDescriptor[] = [
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: normalizePath(join(CESIUM_BASE_URL, 'Widgets/widgets.css')),
          },
        },
      ]
      if (isBuild && !rebuildCesium) {
        tags.push({
          tag: 'script',
          attrs: {
            src: normalizePath(join(CESIUM_BASE_URL, 'Cesium.js')),
          },
        })
      }
      return tags
    },
  }
}
