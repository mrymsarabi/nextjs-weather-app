// types/weather.ts
export type ForecastItem = {
  dt: number
  main: { temp_min: number; temp_max: number }
  weather: { icon: string; description: string }[]
}

export type ForecastData = {
  city: { name: string; country: string; sunrise: number; sunset: number }
  list: ForecastItem[]
}

export type GeoResult = {
  name: string
  country: string
  lat: number
  lon: number
  state?: string
}
