import { App } from 'vue'

const requireComponent = require.context('./components', true, /index.vue$/)

const register = (app: App<Element>): void => {
  requireComponent.keys().forEach((fullpath) => {
    const componentConfig = requireComponent(fullpath)
    const pathArr = fullpath.split('/')
    pathArr.pop() // pop filename(index.vue)
    let componentName = ''
    if (pathArr) {
      componentName = pathArr.pop() as string
    }
    if (!componentName) {
      return
    }
    app.component(componentName, componentConfig.default || componentConfig)
  })
}

export default register
