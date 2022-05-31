**English | [简体中文](#简介)**

# Vue3 Cesium Typescipt Start up template

# Introduction

This is a project template for Vue3 + Cesium + Typescript apps with lots of sample datas. Preview:
[https://vue3-cesium-typescript-start-up-template.vercel.app/](https://vue3-cesium-typescript-start-up-template.vercel.app/)

## How to use

_Note that you will need to have [Node.js](https://nodejs.org) installed._

Fork or clone this repository. then:

```bash
pnpm install
```

### Compiles and hot-reloads for development

```bash
pnpm run vite
```

### Compiles and minifies for production

```bash
pnpm run build
```

## Dependencies

- [Vue3](https://v3.vuejs.org/)
- [cesium](https://cesium.com/)
- [typescript](https://www.typescriptlang.org/)
- option
  - [Element plus](https://element-plus.org/) for convenient components
  - [tailwindcss](https://tailwindcss.com/) for rapid UI development.
  - [ECharts](https://echarts.apache.org/)

## Features

- View
- Status bar
- Natural environment control
- Earth setting
- 3D tile operate
- Draw
- Measure
- Sampling
- Contour
- Settings
- Offset correct
- more is coming ...

## Guide

### Cesium vue

Cesium mounted on both global properties and `provide/inject` on main vue instance, for both composition or options API use.
you can get cesium anywhere in vue instance:

```typescript
import { CesiumRef, CESIUM_REF_KEY} from '@/libs/cesium/cesium-vue'
// global property
const { viewer, viewerContainer } = this.$cesiumRef // type CesiumRef

// provide/inject
// Options API
export default defineComponent({
  inject: [CESIUM_REF_KEY],
  mounted() {
    console.log(this.cesiumRef)
  },
})
// or Composition API
setup() {
  const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    onMounted(() => {
      console.log(cesiumRef?.viewer)
    })
}
```

If you want other properties, you can add anything to `CesiumRef` _(src/@types/shims-cesium-ref.d.ts)_

### Not React

For better performance, `cesium instance` is not reactive! Different as vue data, Even Vue3 use `proxy` instead of `Object.defineProperty` got a lot of performance improvements. Cesium will lose too much FPS, if react cesium.

## Sample Datas

- [Tiled satellite data](https://sample-data-satellite.vercel.app/)
- [Tiled terrain data](https://sample-data-terrain.vercel.app/)
- [3D tile buildings](https://sample-data-jt.vercel.app/cd-buildings/3dtile)
- [3D tile point cloud collected with ipad pro lidar](https://sample-data-jt.vercel.app/my-home/3dtile)

**Datas above are the sample data I made after I obtained them through open channels or collected by myself. If use for test can be directly used, if you want to use for commercial purposes, please contact.**

## Screenshots

![](https://github.com/tanghaojie/vue3-cesium-typescript-start-up-template/blob/master/public/static/imgs/screenshot.png)
![](https://github.com/tanghaojie/vue3-cesium-typescript-start-up-template/blob/master/public/static/imgs/screenshot2_compressed.png)
![](https://github.com/tanghaojie/vue3-cesium-typescript-start-up-template/blob/master/public/static/imgs/screenshot3_compressed.png)

_Note: do not use cesium versions from 1.81.0 to 1.82.1, it exists a [bug](https://github.com/CesiumGS/cesium/issues/9590)._

---

**[English](#Introduction) | 简体中文**

# 简介

本项目是一个整合了 Vue3 + Cesium + Typescript 的启动模板，同时还包含了各种不同类型的示例数据。在线预览地址：
[https://vue3-cesium-typescript-start-up-template.vercel.app/](https://vue3-cesium-typescript-start-up-template.vercel.app/)

_可能需要跨过[墙]才能访问_

## 用法说明

_注意：需要先安装[Node.js](https://nodejs.org)环境_

点击上面的 Fork 到把项目拷贝到你自己的仓库，或者直接`git clone`本仓库，然后:

```bash
pnpm install
```

### 开发环境编译和热重载

```bash
pnpm run vite

```

### 生产环境编译和压缩

```bash
pnpm run build
```

## 相关依赖

- [Vue3](https://v3.vuejs.org/)
- [cesium](https://cesium.com/)
- [typescript](https://www.typescriptlang.org/)
- 可选的
  - [Element plus](https://element-plus.org/) 使用了部分组件以方便开发。
  - [tailwindcss](https://tailwindcss.com/) 快速 UI 样式。
  - [ECharts](https://echarts.apache.org/)

## 功能列表

- 视图切换
- 状态栏
- 环境控制
- 地球控制
- 3D tile 操作
- 绘图
- 测量
- 地形采样
- 等高线
- 设置
- 分屏
- 偏移纠正
- 持续加入中...

## 指南

### Cesium vue

Cesium 实例同时挂载在 vue 实例的全局属性上（vue3 支持多个 vue 实例，你可以自定义选择）和`provide/inject`，以方便 Composition 或者 Options API 语法都可以方便使用，然后就可以在 vue 实例中的任何地方拿到 cesium：

```typescript
import { CesiumRef, CESIUM_REF_KEY} from '@/libs/cesium/cesium-vue'
// global property
const { viewer, viewerContainer } = this.$cesiumRef // type CesiumRef

// provide/inject
// Options API
export default defineComponent({
  inject: [CESIUM_REF_KEY],
  mounted() {
    console.log(this.cesiumRef)
  },
})
// or Composition API
setup() {
  const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    onMounted(() => {
      console.log(cesiumRef?.viewer)
    })
}
```

如果需要附件一些其他的属性，可以添加到`CesiumRef` _(src/@types/shims-cesium-ref.d.ts)_ 上来扩展。

### 非响应式

为了更好的性能, `cesium instance`cesium 实例是非响应式的！

和 Vue 中的 data 等不同，即使 Vue3 使用 `proxy` 代替 `Object.defineProperty` 获得了很大的性能提升，代理所有的 cesium 属性以实现响应式，还是会极大的丢失性能和降低 FPS。

如何取舍：

- 如果只需要使用 cesium 的基础功能，例如只做一些基础的可视化、简单交互、数据加载展示等等这些比较常规的操作，其实可以使用其他的一些用 vue 对 cesium 进行了封装的库，这样可以很大程度上提升项目的构建速度。唯一需要注意的问题是，所需的功能是否已经实现。

- 但如果你要深层的进入 cesium 内部，例如自定义 shader、高级空间分析、复杂的交互操作等等，把这些功能点和 vue 绑定就是一件不合算，也不合理的事情了。

- 另一种情况，当项目很庞大，需要用到 cesium 各个模块时，随着用 vue 封装 cesium 的组件越来越多以后，你会发现，其本质上又回到了代理整个 cesium 实例来实现响应式的模式，这个时候，性能又是不得不考虑的问题。

## 示例数据

- [Tiled satellite data](https://sample-data-satellite.vercel.app/)
- [Tiled terrain data](https://sample-data-terrain.vercel.app/)
- [3D tile buildings](https://sample-data-jt.vercel.app/cd-buildings/3dtile)
- [3D tile point cloud collected with ipad pro lidar](https://sample-data-jt.vercel.app/my-home/3dtile)

**以上数据都是本人通过公开渠道获取或者自己采集后，制作的示例数据。如果用于测试可以直接使用，如果用于商业用途请联系告知。谢谢。**

_注意: 不要使用 1.81.0 - 1.82.1 版本的 cesium, 它包含一个已知的[bug](https://github.com/CesiumGS/cesium/issues/9590)._

---
