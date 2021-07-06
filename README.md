# Vue3 Cesium Typescipt Start up template

This is a project template for Vue3 + Cesium + Typescript apps with lots of test datas. It lives at [https://vue3-cesium-typescript-start-up-template.vercel.app/](https://vue3-cesium-typescript-start-up-template.vercel.app/)

## How to use

_Note that you will need to have [Node.js](https://nodejs.org) installed._

fork or clone this repository. then:

```bash
npm install
```

### Compiles and hot-reloads for development

```bash
npm run serve
```

### Compiles and minifies for production

```bash
npm run build
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
- more is coming ...

## Guide

### Cesium vue

cesium is hook on vue global properties, you can get cesium anywhere in vue instance:

```typescript
const { viewer, viewerContainer } = this.$cv // type CesiumVue
```

if you want other properties, you can add anything to `CesiumVue` _(src/libs/cesium/cesium-vue.ts)_

### Not React

For better performance, `cesium instance` is not reactive! Different as vue data, Even Vue3 use `proxy` instead of `Object.defineProperty` got a lot of performance improvements. Cesium will lose too much FPS, if react cesium.

### Data or Event

Unlike Vue's data first, This template use event first:

```
event -> render
event -> data -> render
event -> data -> vue data(or vuex) -> render
```

## Next

- Options API -> Composition API
- Dark mode
- Timeline and time data
- More test data

## Screenshots

![](https://github.com/tanghaojie/vue3-cesium-typescript-start-up-template/blob/master/public/static/imgs/screenshot.png)
![](https://github.com/tanghaojie/vue3-cesium-typescript-start-up-template/blob/master/public/static/imgs/screenshot2_compressed.png)
![](https://github.com/tanghaojie/vue3-cesium-typescript-start-up-template/blob/master/public/static/imgs/screenshot3_compressed.png)

---

_Note: do not use cesium versions from 1.81.0 to 1.82.1, it exists a [bug](https://github.com/CesiumGS/cesium/issues/9590)._
