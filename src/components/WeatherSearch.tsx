// components/WeatherSearch.tsx
'use client'
import { useState, useEffect, useCallback, useRef } from 'react';
import ForecastDisplay from './ForecastDisplay'; 


// 1. FIXED UTILITY: Simple Debounce Function with a 'cancel' method
const debounce = (func: Function, delay: number) => {
  let timeout: NodeJS.Timeout;
  
  // The debounced function that calls the main func
  const debounced = function(this: any, ...args: any[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
  
  // The function to clear the timeout
  const cancel = () => {
    clearTimeout(timeout);
  };
  
  // Attach the cancel method to the debounced function object
  (debounced as any).cancel = cancel;
  
  // Return the debounced function with its new cancel property (TypeScript fix)
  return debounced as ((...args: any[]) => void) & { cancel: () => void };
};

// Types
type GeoResult = {
  name: string;
  country: string;
  lat: number;
  lon: number;
  state?: string;
};


export default function WeatherSearch () {
  const [city, setCity] = useState('');
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  
  // Debounced function to fetch suggestions
  const fetchSuggestions = useCallback(
    debounce(async (searchCity: string) => {
      if (searchCity.length < 3) {
        setSuggestions([]);
        return;
      }

      try {
        const res = await fetch(`/api/geocoding?city=${encodeURIComponent(searchCity)}`);
        const json: GeoResult[] = await res.json();
        
        if (res.ok) {
            setSuggestions(json);
        } else {
            setSuggestions([]); 
        }

      } catch (err) {
        setSuggestions([]);
      }
    }, 300), 
    []
  );

  useEffect(() => {
    fetchSuggestions(city);
    // 2. FIXED CALL: This cleanup now works because the debounce utility defines 'cancel'
    return () => (fetchSuggestions as any).cancel();
  }, [city, fetchSuggestions]);


  // Main search handler (uses lat/lon from suggestion if available)
  async function handleSearch(e?: React.FormEvent, selectedCity?: GeoResult) {
    e?.preventDefault();
    setError('');
    
    const searchName = selectedCity ? selectedCity.name : city.trim();
    
    if (!searchName && !selectedCity) {
      setError('Please enter a city name.');
      return;
    }

    setLoading(true);
    setSuggestions([]); // Clear suggestions

    try {
      let url = `/api/forecast?`;

      if (selectedCity) {
        // Use precise lat/lon from selection (most reliable)
        url += `lat=${selectedCity.lat}&lon=${selectedCity.lon}`;
      } else {
        // Fallback to name search
        url += `city=${encodeURIComponent(searchName)}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Failed to fetch weather data');
      setData(json);
      
      // Update input field to the name of the retrieved data for clarity
      if (json.city?.name && json.city?.country) {
          setCity(`${json.city.name}, ${json.city.country}`); 
      }

    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle selection from dropdown
  const handleSuggestionClick = (suggestion: GeoResult) => {
    // Set the input field text to the full, unambiguous location
    const displayCity = `${suggestion.name}${suggestion.state ? ', ' + suggestion.state : ''}, ${suggestion.country}`;
    setCity(displayCity);
    // Run the search using the precise lat/lon
    handleSearch(undefined, suggestion); 
  };
  
  return (
    <div className="w-full max-w-xl">
      <form onSubmit={(e) => handleSearch(e)} className="flex gap-2 mb-4 relative">
        <input
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="Start typing a city name..."
          className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 dark:focus:ring-blue-600/50 transition-all"
          disabled={loading}
          autoComplete="off"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Fetching...' : 'Search'}
        </button>

        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <ul className="absolute z-10 w-[calc(100%-100px)] top-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl max-h-60 overflow-y-auto">
            {suggestions.map((s, index) => (
              <li
                key={`${s.lat}-${s.lon}-${index}`}
                onClick={() => handleSuggestionClick(s)}
                className="p-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/40 text-sm border-b dark:border-gray-600 last:border-b-0"
              >
                <span className='font-semibold'>{s.name}</span>
                {s.state && `, ${s.state}`}
                , <span className='text-gray-500 dark:text-gray-400'>{s.country}</span>
              </li>
            ))}
          </ul>
        )}
      </form>

      {error && <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg mb-4 border border-red-300 dark:border-red-700">{error}</div>}
      {data && <ForecastDisplay data={data} />}
      {!data && !error && (
        <div className="text-sm text-gray-500 dark:text-gray-400 p-4 text-center">Try searching for a city above ✨</div>
      )}
    </div>
  )
}