import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const city = url.searchParams.get('city')
    const apiKey = process.env.OPENWEATHER_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'Server missing OPENWEATHER_API_KEY' }, { status: 500 })
    }

    if (!city || city.length < 3) {
      return NextResponse.json([])
    }

    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=10&appid=${apiKey}`
    )
    const geoJson = await geoRes.json()

    if (!geoRes.ok || !Array.isArray(geoJson)) {
      // If API returned an empty array — return it
      if (Array.isArray(geoJson) && geoJson.length === 0) {
        return NextResponse.json(geoJson, { status: 200 })
      }

      const message =
        typeof geoJson === 'object' && geoJson !== null && 'message' in geoJson && typeof (geoJson as Record<string, unknown>).message === 'string'
          ? (geoJson as Record<string, string>).message
          : 'Geocoding suggestion failed'

      return NextResponse.json({ error: message }, { status: geoRes.status })
    }

    return NextResponse.json(geoJson, {
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=3600',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
