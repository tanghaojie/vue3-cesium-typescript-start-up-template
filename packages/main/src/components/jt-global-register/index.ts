import { App, Component } from 'vue'

const components = import.meta.glob('./components/**/*.vue', { eager: true })

const register = (app: App<Element>): void => {
  for (const key in components) {
    const comp = (components[key] as any).default as Component
    if (!comp.name) {
      throw new Error(`Component name needed.`)
    }
    app.component(comp.name, comp)
  }
}

export default register
