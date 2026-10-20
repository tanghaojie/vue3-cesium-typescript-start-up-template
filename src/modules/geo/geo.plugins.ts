import type { GeoPluginDefinition } from './core/geo-plugin'
import { comparePlugin } from './plugins/compare/compare.plugin'
import { geoDataPlugin } from './plugins/data/data.plugin'
import { drawingPlugin } from './plugins/drawing/drawing.plugin'
import { geoFlightPlugin } from './plugins/flight/flight.plugin'
import { measurementPlugin } from './plugins/measurement/measurement.plugin'
import { modelPlugin } from './plugins/model/model.plugin'
import { geoScenePlugin } from './plugins/scene/scene.plugin'
import { terrainPlugin } from './plugins/terrain/terrain.plugin'
import { geoTimePlugin } from './plugins/time/time.plugin'
import { geoViewPlugin } from './plugins/view/view.plugin'
import { geoCapturePlugin } from './plugins/capture/capture.plugin'

export const geoPlugins: readonly GeoPluginDefinition[] = [
  geoDataPlugin,
  geoViewPlugin,
  geoScenePlugin,
  geoTimePlugin,
  geoCapturePlugin,
  geoFlightPlugin,
  drawingPlugin,
  measurementPlugin,
  modelPlugin,
  terrainPlugin,
  comparePlugin,
]
