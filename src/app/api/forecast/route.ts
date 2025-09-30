import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const city = url.searchParams.get("city");
    const latParam = url.searchParams.get("lat");
    const lonParam = url.searchParams.get("lon");
    const cntParam = url.searchParams.get("cnt") ?? '7'; //default = 7 days
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Server missing OPENWEATHER_API_KEY' }, { status: 500 })
    }

    let lat: string | undefined = latParam ?? undefined
    let lon: string | undefined = lonParam ?? undefined

    console.log("city", city)
    if(!lat || !lon) {
      if (!city) {
        return NextResponse.json(
          { error: 'Please provide `city` or both `lat` and `lon` query params' },
          { status: 400 }
        );
      };

      // Geocoding: convert city -> lat/lon
      const geoRes = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
          city
        )}&limit=1&appid=${apiKey}`
      )
      const geoJson = await geoRes.json()
      if (!geoRes.ok || !Array.isArray(geoJson) || geoJson.length === 0) {
        return NextResponse.json({ error: 'City not found (geocoding failed)' }, { status: 404 })
      }
      lat = String(geoJson[0].lat)
      lon = String(geoJson[0].lon)
    };

    // Build the daily forecast URL
    const cnt = encodeURIComponent(cntParam)
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast/daily?lat=${lat}&lon=${lon}&cnt=${cnt}&units=metric&appid=${apiKey}`

    const fcRes = await fetch(forecastUrl)
    const fcJson = await fcRes.json()

    if (!fcRes.ok) {
      // forward the API error message if present
      return NextResponse.json(
        { error: fcJson?.message ?? 'Forecast API returned an error', details: fcJson },
        { status: fcRes.status }
      )
    }

    // Cache for 10 minutes on the CDN to reduce API usage
    return NextResponse.json(fcJson, {
      status: 200,
      headers: {
        // allow CDN caching and stale-while-revalidate pattern
        'Cache-Control': 's-maxage=600, stale-while-revalidate=60'
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown server error' }, { status: 500 })
  }
}