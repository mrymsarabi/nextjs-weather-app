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
    <div className="w-full max-w-2xl"> 
      <form onSubmit={(e) => handleSearch(e)} className="flex relative shadow-lg rounded-2xl"> {/* Added shadow and border-radius to form */}
        <input
          value={city}
          onChange={e => setCity(e.target.value)}
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
          {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
              'Search'
          )}
        </button>

        {suggestions.length > 0 && (
          <ul className="absolute z-10 w-[calc(100%-120px)] top-full mt-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
            {suggestions.map((s, index) => (
              <li
                key={`${s.lat}-${s.lon}-${index}`}
                onClick={() => handleSuggestionClick(s)}
                className="p-3 px-5 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/40 text-base transition-colors border-b dark:border-gray-600 last:border-b-0"
              >
                <span className='font-bold text-gray-800 dark:text-gray-100'>{s.name}</span>
                {s.state && <span className='text-sm text-gray-500 dark:text-gray-400'> ({s.state})</span>}
                , <span className='text-gray-500 dark:text-gray-400 text-sm'>{s.country}</span>
              </li>
            ))}
          </ul>
        )}
      </form>

      {error && <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium rounded-xl border border-red-300 dark:border-red-700 shadow-md">{error}</div>}
      
      {data && <ForecastDisplay data={data} />}

      {!data && !error && (
        <div className="text-base text-gray-500 dark:text-gray-400 p-8 text-center mt-6">
          Enter a city above to see the 5-day weather forecast 👆
        </div>
      )}
    </div>
  )
}