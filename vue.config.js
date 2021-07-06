const CopyWebpackPlugin = require('copy-webpack-plugin')
const webpack = require('webpack')

const debug = process.env.NODE_ENV !== 'production'
// use CesiumUnminified when debug
const cesiumSource = debug
  ? './node_modules/cesium/Build/CesiumUnminified'
  : './node_modules/cesium/Build/Cesium'

module.exports = {
  publicPath: './',
  assetsDir: './',
  chainWebpack: (config) => {
    config.module
      .rule('svg')
      .exclude.add(function () {
        return 'src/components/base-icon/svgs'
      })
      .end()

    config.module
      .rule('jtsvgicon')
      .test(/\.svg$/)
      .include.add(function () {
        return 'src/components/base-icon/svgs'
      })
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
  },
  configureWebpack: {
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: cesiumSource,
            to: './js/Cesium',
          },
          // {
          //   from: 'node_modules/cesium/Build/Cesium/Workers',
          //   to: './js/Cesium/Workers',
          // },
          // {
          //   from: 'node_modules/cesium/Build/Cesium/ThirdParty',
          //   to: './js/Cesium/ThirdParty',
          // },
          // {
          //   from: 'node_modules/cesium/Build/Cesium/Assets',
          //   to: './js/Cesium/Assets',
          // },
          // {
          //   from: 'node_modules/cesium/Build/Cesium/Widgets',
          //   to: './js/Cesium/Widgets',
          // },
        ],
      }),
      new webpack.DefinePlugin({
        // Define relative base path in cesium for loading assets
        CESIUM_BASE_URL: JSON.stringify('./js/Cesium'),
      }),
    ],
    module: {
      unknownContextCritical: false,
    },
  },
}
