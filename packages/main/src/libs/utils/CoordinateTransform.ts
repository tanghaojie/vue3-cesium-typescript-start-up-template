class CoordinateTransform {
  // 定义一些常量
  // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
  public static x_PI = (3.14159265358979324 * 3000.0) / 180.0
  // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
  public static PI = 3.1415926535897932384626
  public static a = 6378245.0
  // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
  public static ee = 0.00669342162296594323

  public static bd09togcj02(bd_lng: number, bd_lat: number): [number, number] {
    const { x_PI } = CoordinateTransform
    const x = bd_lng - 0.0065
    const y = bd_lat - 0.006
    const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_PI)
    const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_PI)
    const gg_lng = z * Math.cos(theta)
    const gg_lat = z * Math.sin(theta)
    return [gg_lng, gg_lat]
  }

  public static gcj02tobd09(lng: number, lat: number): [number, number] {
    const { x_PI } = CoordinateTransform
    const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * x_PI)
    const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * x_PI)
    const bd_lng = z * Math.cos(theta) + 0.0065
    const bd_lat = z * Math.sin(theta) + 0.006
    return [bd_lng, bd_lat]
  }

  public static wgs84togcj02(lng: number, lat: number): [number, number] {
    const { PI, a, ee, out_of_china, transformlat, transformlng } =
      CoordinateTransform
    if (out_of_china(lng, lat)) {
      return [lng, lat]
    } else {
      let dlat = transformlat(lng - 105.0, lat - 35.0)
      let dlng = transformlng(lng - 105.0, lat - 35.0)
      const radlat = (lat / 180.0) * PI
      let magic = Math.sin(radlat)
      magic = 1 - ee * magic * magic
      const sqrtmagic = Math.sqrt(magic)
      dlat = (dlat * 180.0) / (((a * (1 - ee)) / (magic * sqrtmagic)) * PI)
      dlng = (dlng * 180.0) / ((a / sqrtmagic) * Math.cos(radlat) * PI)
      const mglat = lat + dlat
      const mglng = lng + dlng
      return [mglng, mglat]
    }
  }

  public static gcj02towgs84(lng: number, lat: number): [number, number] {
    const { PI, a, ee, out_of_china, transformlat, transformlng } =
      CoordinateTransform
    if (out_of_china(lng, lat)) {
      return [lng, lat]
    } else {
      let dlat = transformlat(lng - 105.0, lat - 35.0)
      let dlng = transformlng(lng - 105.0, lat - 35.0)
      const radlat = (lat / 180.0) * PI
      let magic = Math.sin(radlat)
      magic = 1 - ee * magic * magic
      const sqrtmagic = Math.sqrt(magic)
      dlat = (dlat * 180.0) / (((a * (1 - ee)) / (magic * sqrtmagic)) * PI)
      dlng = (dlng * 180.0) / ((a / sqrtmagic) * Math.cos(radlat) * PI)
      const mglat = lat + dlat
      const mglng = lng + dlng
      return [lng * 2 - mglng, lat * 2 - mglat]
    }
  }

  public static transformlat(lng: number, lat: number): number {
    const { PI } = CoordinateTransform
    let ret =
      -100.0 +
      2.0 * lng +
      3.0 * lat +
      0.2 * lat * lat +
      0.1 * lng * lat +
      0.2 * Math.sqrt(Math.abs(lng))
    ret +=
      ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) *
        2.0) /
      3.0
    ret +=
      ((20.0 * Math.sin(lat * PI) + 40.0 * Math.sin((lat / 3.0) * PI)) * 2.0) /
      3.0
    ret +=
      ((160.0 * Math.sin((lat / 12.0) * PI) +
        320 * Math.sin((lat * PI) / 30.0)) *
        2.0) /
      3.0
    return ret
  }

  public static transformlng(lng: number, lat: number): number {
    const { PI } = CoordinateTransform
    let ret =
      300.0 +
      lng +
      2.0 * lat +
      0.1 * lng * lng +
      0.1 * lng * lat +
      0.1 * Math.sqrt(Math.abs(lng))
    ret +=
      ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) *
        2.0) /
      3.0
    ret +=
      ((20.0 * Math.sin(lng * PI) + 40.0 * Math.sin((lng / 3.0) * PI)) * 2.0) /
      3.0
    ret +=
      ((150.0 * Math.sin((lng / 12.0) * PI) +
        300.0 * Math.sin((lng / 30.0) * PI)) *
        2.0) /
      3.0
    return ret
  }

  public static out_of_china(lng: number, lat: number): boolean {
    // 纬度 3.86~53.55, 经度 73.66~135.05
    return !(lng > 73.66 && lng < 135.05 && lat > 3.86 && lat < 53.55)
  }
}

export default CoordinateTransform
