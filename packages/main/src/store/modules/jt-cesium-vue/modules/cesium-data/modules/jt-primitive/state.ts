import { JTPrimitive } from '@/libs/cesium/libs/primitive-manager/PrimitiveManager'

export type JTPrimitiveState = {
  jtPrimitives: JTPrimitive[]
}

export const defaultState = (): JTPrimitiveState => {
  return {
    jtPrimitives: [],
  }
}

export const state: JTPrimitiveState = defaultState()
