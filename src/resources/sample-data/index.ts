type SampleDataConfig = {
  terrain: string
  'satellite-base': string
  'sample-data-base': string
}

const sampleDataConfigDefault: SampleDataConfig = {
  terrain: 'https://sample-data-terrain.vercel.app/',
  'satellite-base': 'https://sample-data-satellite.vercel.app/',
  'sample-data-base': 'https://sample-data-jt.vercel.app/',
}

const sampleDataConfigStr = process.env.VUE_APP_SAMPLE_DATA_CONFIG as string
let sampleDataConfig: SampleDataConfig
try {
  sampleDataConfig = JSON.parse(sampleDataConfigStr) as SampleDataConfig
} catch (e) {
  console.warn('Sample data config error.', e)
  sampleDataConfig = sampleDataConfigDefault
}

export default {
  satellite: `${sampleDataConfig['satellite-base']}{z}/{x}/{y}.png`,
  terrain: sampleDataConfig.terrain,
  'my-home': `${sampleDataConfig['sample-data-base']}my-home/3dtile/tileset.json`,
  'cd-buildings': `${sampleDataConfig['sample-data-base']}cd-buildings/3dtile/tileset.json`,
  'shp-factory': `${sampleDataConfig['sample-data-base']}shp-factory/tileset.json`,
  apartment: `${sampleDataConfig['sample-data-base']}apartment/tileset.json`,
  rc: `${sampleDataConfig['sample-data-base']}rc/rc.gltf`,
}
