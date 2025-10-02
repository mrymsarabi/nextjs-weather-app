'use client'

import React, { useState, useEffect, useMemo } from 'react'
import ForecastDisplay from './ForecastDisplay'
import type { ForecastData, GeoResult } from '@/types/weather'

// Generic debounce that keeps the argument types (no `any`)
// Args is inferred from the function you pass (e.g. [string])
function debounce<Args extends unknown[], R = void | Promise<void>>(
  func: (...args: Args) => R,
  delay: number
) {
  let timeout: ReturnType<typeof setTimeout> | null = null

  const debounced = (...args: Args): void => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      void func(...args) // ignore returned Promise if async
      timeout = null
    }, delay)
  }

  const cancel = (): void => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  }

  return Object.assign(debounced, { cancel }) as ((...args: Args) => void) & {
    cancel: () => void
  }
}

export default function WeatherSearch() {
  const [city, setCity] = useState('')
  const [data, setData] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState<GeoResult[]>([])

  // Debounced suggestions fetch — args inferred (string)
  const fetchSuggestions = useMemo(
    () =>
      debounce(async (searchCity: string) => {
        if (searchCity.length < 3) {
          setSuggestions([])
          return
        }

        try {
          const res = await fetch(`/api/geocoding?city=${encodeURIComponent(searchCity)}`)
          const json = await res.json()

          if (res.ok && Array.isArray(json)) {
            // Normalize result items conservatively to GeoResult
            const parsed = (json as unknown[]).map((item) => {
              const rec = item as Record<string, unknown>
              return {
                name: typeof rec.name === 'string' ? rec.name : '',
                country: typeof rec.country === 'string' ? rec.country : '',
                lat:
                  typeof rec.lat === 'number'
                    ? rec.lat
                    : typeof rec.lat === 'string'
                    ? Number(rec.lat)
                    : NaN,
                lon:
                  typeof rec.lon === 'number'
                    ? rec.lon
                    : typeof rec.lon === 'string'
                    ? Number(rec.lon)
                    : NaN,
                state: typeof rec.state === 'string' ? rec.state : undefined,
              } as GeoResult
            }).filter((g) => g.name && g.country && !Number.isNaN(g.lat) && !Number.isNaN(g.lon))

            setSuggestions(parsed)
          } else {
            setSuggestions([])
          }
        } catch (err) {
          console.error(err)
          setSuggestions([])
        }
      }, 300),
    [setSuggestions]
  )

  useEffect(() => {
    fetchSuggestions(city)
    return () => {
      // cleanup pending debounce
      fetchSuggestions.cancel()
    }
  }, [city, fetchSuggestions])

  // Main search handler
  async function handleSearch(e?: React.FormEvent, selectedCity?: GeoResult) {
    e?.preventDefault()
    setError('')

    const searchName = selectedCity ? selectedCity.name : city.trim()

    if (!searchName && !selectedCity) {
      setError('Please enter a city name.')
      return
    }

    setLoading(true)
    setSuggestions([])

    try {
      let url = `/api/forecast?`

      if (selectedCity) {
        url += `lat=${selectedCity.lat}&lon=${selectedCity.lon}`
      } else {
        url += `city=${encodeURIComponent(searchName)}`
      }

      const res = await fetch(url)
      const json = await res.json()

      // If the API returned an error shape
      if (!res.ok) {
        const message =
          typeof json === 'object' && json !== null && 'message' in json && typeof (json as Record<string, unknown>).message === 'string'
            ? (json as Record<string, string>).message
            : undefined
        throw new Error(message ?? 'Failed to fetch weather data')
      }

      // Basic structural validation before casting
      if (
        typeof json !== 'object' ||
        json === null ||
        !('city' in json) ||
        !('list' in json) ||
        !Array.isArray((json as Record<string, unknown>).list)
      ) {
        throw new Error('Invalid forecast response from API')
      }

      setData(json as ForecastData)

      if ((json as ForecastData).city?.name && (json as ForecastData).city?.country) {
        const cd = (json as ForecastData).city
        setCity(`${cd.name}, ${cd.country}`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: GeoResult) => {
    const displayCity = `${suggestion.name}${suggestion.state ? ', ' + suggestion.state : ''}, ${suggestion.country}`
    setCity(displayCity)
    void handleSearch(undefined, suggestion)
  }

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={(e) => handleSearch(e)} className="flex relative shadow-lg rounded-2xl">
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Search for a city, e.g., London..."
          className="flex-1 px-5 py-3 text-lg rounded-l-2xl border-2 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 dark:focus:ring-blue-600/50 transition-all bg-white dark:bg-gray-800"
          disabled={loading}
          autoComplete="off"
        />

        <button
          type="submit"
          className="px-8 py-3 bg-blue-600 text-white font-semibold text-lg rounded-r-2xl hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
          disabled={loading}
        >
          {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Search'}
        </button>

        {suggestions.length > 0 && (
          <ul className="absolute z-10 w-[calc(100%-120px)] top-full mt-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
            {suggestions.map((s, index) => (
              <li
                key={`${s.lat}-${s.lon}-${index}`}
                onClick={() => handleSuggestionClick(s)}
                className="p-3 px-5 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/40 text-base transition-colors border-b dark:border-gray-600 last:border-b-0"
              >
                <span className="font-bold text-gray-800 dark:text-gray-100">{s.name}</span>
                {s.state && <span className="text-sm text-gray-500 dark:text-gray-400"> ({s.state})</span>}
                , <span className="text-gray-500 dark:text-gray-400 text-sm">{s.country}</span>
              </li>
            ))}
          </ul>
        )}
      </form>

      {error && <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium rounded-xl border border-red-300 dark:border-red-700 shadow-md">{error}</div>}

      {data && <ForecastDisplay data={data} />}

      {!data && !error && <div className="text-base text-gray-500 dark:text-gray-400 p-8 text-center mt-6">Enter a city above to see the 5-day weather forecast 👆</div>}
    </div>
  )
}
