import { Primitive } from '@/libs/cesium/libs/primitive-manager/PrimitiveManager'

export type PrimitiveState = {
  primitives: Primitive[]
}

export const defaultState = (): PrimitiveState => {
  return {
    primitives: [],
  }
}

export const state: PrimitiveState = defaultState()
