'use client'
import { useState } from 'react';
import WeatherCard from './WeatherCard';

export default function WeatherSearch () {
  const [city, setCity] = useState('');
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setError('');
    if (!city.trim()) {
      setError('Type a city name');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/forecast?city=${encodeURIComponent(city)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch');
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl">
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="London, Tokyo, Cairo..."
          className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div className="text-red-500 mb-4">{error}</div>}
      {data && <WeatherCard data={data} />}
      {!data && !error && (
        <div className="text-sm text-gray-500">Try searching for a city above ✨</div>
      )}
    </div>
  )
}