import { App } from 'vue'

const components = import.meta.globEager('./components/**/*.vue')

const register = (app: App<Element>): void => {
  for (const key in components) {
    const comp = components[key].default
    app.component(comp.name, comp)
  }
}

export default register
