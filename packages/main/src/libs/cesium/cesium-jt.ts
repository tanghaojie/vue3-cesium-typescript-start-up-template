import * as Cesium from 'cesium'
import Draw from '@/libs/cesium/libs/draw/Draw'
import Measure from '@/libs/cesium/libs/measure/Measure'
import ElevationContour from '@/libs/cesium/libs/elevation-contour/ElevationContour'
import FlyTo from '@/libs/cesium/libs/fly-to/FlyTo'
import Highlight from '@/libs/cesium/libs/highlight/Highlight'
import Light from '@/libs/cesium/libs/light/Light'
import TerrainSampling from '@/libs/cesium/libs/terrain-sampling/TerrainSampling'
import Classification from '@/libs/cesium/libs/classification/Classification'
import PercentageChange from '@/libs/cesium/libs/percentage-change/PercentageChange'
import FloodAnalysis from '@/libs/cesium/libs/flood-analysis/FloodAnalysis'
import ImageryManager from '@/libs/cesium/libs/imagery-manager/ImageryManager'
import PrimitiveManager from '@/libs/cesium/libs/primitive-manager/PrimitiveManager'
import ClippingPlane from '@/libs/cesium/libs/clipping-plane/ClippingPlane'
import Viewshed from '@/libs/cesium/libs/viewshed/Viewshed'
import type { Option } from '@/libs/cesium/libs/viewshed/Viewshed'

class Jt {
  protected viewer: Cesium.Viewer
  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
  }

  private _draw?: Draw
  public get draw(): Draw {
    if (!this._draw) {
      this._draw = new Draw(this.viewer)
    }
    return this._draw
  }

  private _elevationContour?: ElevationContour
  public get elevationContour(): ElevationContour {
    if (!this._elevationContour) {
      this._elevationContour = new ElevationContour(this.viewer)
    }
    return this._elevationContour
  }

  private _flyTo?: FlyTo
  public get flyTo(): FlyTo {
    if (!this._flyTo) {
      this._flyTo = new FlyTo(this.viewer)
    }
    return this._flyTo
  }

  private _highlight?: Highlight
  public get highlight(): Highlight {
    if (!this._highlight) {
      this._highlight = new Highlight(this.viewer)
    }
    return this._highlight
  }

  private _light?: Light
  public get light(): Light {
    if (!this._light) {
      this._light = new Light(this.viewer)
    }
    return this._light
  }

  private _terrainSampling?: TerrainSampling
  public get terrainSampling(): TerrainSampling {
    if (!this._terrainSampling) {
      this._terrainSampling = new TerrainSampling(this.viewer)
    }
    return this._terrainSampling
  }

  private _classification?: Classification
  public get classification(): Classification {
    if (!this._classification) {
      this._classification = new Classification(this.viewer)
    }
    return this._classification
  }

  private _percentageChange?: PercentageChange
  public get percentageChange(): PercentageChange {
    if (!this._percentageChange) {
      this._percentageChange = new PercentageChange(this.viewer)
    }
    return this._percentageChange
  }

  private _measure?: Measure
  public get measure(): Measure {
    if (!this._measure) {
      this._measure = new Measure(this.viewer)
    }
    return this._measure
  }

  private _floodAnalysis?: FloodAnalysis
  public get floodAnalysis(): FloodAnalysis {
    if (!this._floodAnalysis) {
      this._floodAnalysis = new FloodAnalysis(this.viewer)
    }
    return this._floodAnalysis
  }

  private _imageryManager?: ImageryManager
  public get imageryManager(): ImageryManager {
    if (!this._imageryManager) {
      this._imageryManager = new ImageryManager(this.viewer)
    }
    return this._imageryManager
  }

  private _primitiveManager?: PrimitiveManager
  public get primitiveManager(): PrimitiveManager {
    if (!this._primitiveManager) {
      this._primitiveManager = new PrimitiveManager(this.viewer)
    }
    return this._primitiveManager
  }

  private _clippingPlane?: ClippingPlane
  public get clippingPlane(): ClippingPlane {
    if (!this._clippingPlane) {
      this._clippingPlane = new ClippingPlane(this.viewer)
    }
    return this._clippingPlane
  }

  private _viewshed?: Viewshed
  public get viewshed(): Viewshed {
    if (!this._viewshed) {
      this._viewshed = new Viewshed(this.viewer)
    }
    return this._viewshed
  }
}

export default Jt
