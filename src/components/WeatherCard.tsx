'use client'
import React from 'react'

type Props = { data: any }

export default function WeatherCard ({ data }: Props) {
  const { name, sys, weather, main, wind } = data
  const icon = weather?.[0]?.icon
  const desc = weather?.[0]?.description

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
      <div className="flex items-center gap-4">
        {icon && (
          <img
            src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
            alt={desc}
            className="w-20 h-20"
          />
        )}

        <div>
          <h2 className="text-2xl font-bold">
            {name}, {sys?.country}
          </h2>
          <p className="capitalize text-sm">{desc}</p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-4xl font-semibold">{Math.round(main?.temp)}°C</div>
          <div className="text-sm text-gray-500">Feels like {Math.round(main?.feels_like)}°C</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-300">
        <div>Humidity: {main?.humidity}%</div>
        <div>Pressure: {main?.pressure} hPa</div>
        <div>Wind: {wind?.speed} m/s</div>
      </div>
    </div>
  )
}