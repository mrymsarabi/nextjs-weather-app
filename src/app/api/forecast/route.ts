import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const city = url.searchParams.get('city')
    const latParam = url.searchParams.get('lat')
    const lonParam = url.searchParams.get('lon')
    const apiKey = process.env.OPENWEATHER_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'Server missing OPENWEATHER_API_KEY' }, { status: 500 })
    }

    let lat: string | undefined = latParam ?? undefined
    let lon: string | undefined = lonParam ?? undefined

    // Geocoding: if lat/lon are missing, convert city -> lat/lon
    if (!lat || !lon) {
      if (!city) {
        return NextResponse.json({ error: 'Please provide `city` or both `lat` and `lon` query params' }, { status: 400 })
      }

      const geoRes = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`
      )
      const geoJson = await geoRes.json()

      if (!geoRes.ok || !Array.isArray(geoJson) || geoJson.length === 0) {
        return NextResponse.json({ error: 'City not found (geocoding failed)' }, { status: 404 })
      }

      const first = geoJson[0] as Record<string, unknown>
      if (!first || (!('lat' in first) && !('lon' in first))) {
        return NextResponse.json({ error: 'Geocoding returned unexpected shape' }, { status: 500 })
      }

      lat = String(first.lat ?? '')
      lon = String(first.lon ?? '')
    }

    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`

    const fcRes = await fetch(forecastUrl)
    const fcJson = await fcRes.json()

    if (!fcRes.ok) {
      const message =
        typeof fcJson === 'object' && fcJson !== null && 'message' in fcJson && typeof (fcJson as Record<string, unknown>).message === 'string'
          ? (fcJson as Record<string, string>).message
          : undefined

      return NextResponse.json({ error: message ?? 'Forecast API returned an error', details: fcJson }, { status: fcRes.status })
    }

    return NextResponse.json(fcJson, {
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=600, stale-while-revalidate=60',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
