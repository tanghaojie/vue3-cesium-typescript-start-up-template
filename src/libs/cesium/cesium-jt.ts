import * as Cesium from 'cesium'
import Draw from '@/libs/cesium/libs/draw/Draw'
import ElevationContour from '@/libs/cesium/libs/elevation-contour/ElevationContour'
import FlyTo from '@/libs/cesium/libs/fly-to/FlyTo'

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
}

export default Jt
