import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const city = url.searchParams.get("city");
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Server missing OPENWEATHER_API_KEY' }, { status: 500 })
    }

    // Require at least 3 characters to start searching
    if (!city || city.length < 3) {
      return NextResponse.json([])
    }

    // Geocoding: convert partial city name -> list of lat/lon options
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
        city
      )}&limit=10&appid=${apiKey}`
    )
    const geoJson = await geoRes.json()

    if (!geoRes.ok || !Array.isArray(geoJson)) {
      // Return a 404 if the API call was successful but returned no array (e.g., city not found)
      if (geoRes.status === 404 && Array.isArray(geoJson) && geoJson.length === 0) {
        return NextResponse.json(geoJson, { status: 200 })
      }
      return NextResponse.json(
        { error: geoJson?.message ?? 'Geocoding suggestion failed' }, 
        { status: geoRes.status }
      )
    }
    
    // Return the array of suggested city objects
    return NextResponse.json(geoJson, {
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=3600' // Cache suggestions for an hour
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown server error' }, { status: 500 })
  }
}