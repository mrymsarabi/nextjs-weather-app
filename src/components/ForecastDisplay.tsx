// components/ForecastDisplay.tsx
'use client'
import React from 'react'
import { Sunrise, Sunset } from 'lucide-react';

type ForecastItem = {
    dt: number;
    main: { temp_min: number; temp_max: number; };
    weather: { icon: string; description: string; }[];
};

type ForecastData = {
    city: { name: string; country: string; sunrise: number; sunset: number; };
    list: ForecastItem[];
};

type Props = { data: ForecastData }

// Helper function to extract daily min/max data from the 3-hour list
const getDailyForecasts = (list: ForecastItem[]) => {
    const dailyData: { [key: string]: { temps: number[], icons: string[], descriptions: string[] } } = {};

    list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toISOString().split('T')[0];

        if (!dailyData[dateKey]) {
            dailyData[dateKey] = { temps: [], icons: [], descriptions: [] };
        }
        // Collect all min/max temps for the day
        dailyData[dateKey].temps.push(item.main.temp_min, item.main.temp_max);
        
        // Grab the forecast icon/description around noon (or the first available)
        if (date.getHours() >= 10 && date.getHours() <= 14) { 
             if (dailyData[dateKey].icons.length === 0) {
                dailyData[dateKey].icons.push(item.weather[0].icon);
                dailyData[dateKey].descriptions.push(item.weather[0].description);
             }
        }
    });

    return Object.keys(dailyData).map(dateKey => {
        const data = dailyData[dateKey];
        const day = new Date(dateKey);

        return {
            date: day,
            dayName: day.toLocaleDateString('en-US', { weekday: 'short' }),
            minTemp: Math.min(...data.temps),
            maxTemp: Math.max(...data.temps),
            // Use the collected icon/description, fallback to the first item if needed
            icon: data.icons[0] || list[0].weather[0].icon, 
            description: data.descriptions[0] || list[0].weather[0].description,
        };
    }).slice(0, 5); // Limit to the next 5 days
};

// Define the type for a single daily forecast item for TypeScript
type DailyForecast = ReturnType<typeof getDailyForecasts>[number];

export default function ForecastDisplay ({ data }: Props) {
    const { city, list } = data;
    // FIX: Corrected function name
    const dailyForecasts = getDailyForecasts(list); 
    
    const sunriseTime = new Date(city.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const sunsetTime = new Date(city.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700/50">
            
            {/* Location Header */}
            <div className="flex items-center justify-between mb-6 border-b pb-4 border-gray-100 dark:border-gray-700">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    {city.name}, {city.country}
                </h2>
                <div className="flex text-sm text-gray-500 dark:text-gray-400 gap-4">
                    <div className="flex items-center gap-1"><Sunrise className="w-4 h-4 text-orange-500" /> {sunriseTime}</div>
                    <div className="flex items-center gap-1"><Sunset className="w-4 h-4 text-orange-500" /> {sunsetTime}</div>
                </div>
            </div>

            {/* Daily Forecast Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {dailyForecasts.map((day: DailyForecast, index: number) => (
                    <DailyForecastCard key={index} forecast={day} isToday={index === 0} />
                ))}
            </div>
        </div>
    );
}

// Sub-Component for each day's card
type DailyProps = { forecast: DailyForecast, isToday: boolean };

const DailyForecastCard = ({ forecast, isToday }: DailyProps) => {
    const { dayName, minTemp, maxTemp, icon, description } = forecast;

    return (
        <div className={`p-4 text-center rounded-xl transition-all ${isToday ? 'bg-blue-50 dark:bg-blue-900/40 border-2 border-blue-200 dark:border-blue-700' : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 hover:shadow-lg'}`}>
            <div className={`font-bold text-lg ${isToday ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
                {isToday ? 'Today' : dayName}
            </div>
            
            {icon && (
                <img
                    src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
                    alt={description}
                    className="w-16 h-16 mx-auto my-1"
                />
            )}
            
            <div className="text-sm capitalize text-gray-600 dark:text-gray-400 mb-2">
                {description}
            </div>
            
            <div className="flex justify-center gap-3 text-sm">
                <span className="font-semibold text-gray-900 dark:text-white">{Math.round(maxTemp)}°C</span>
                <span className="text-gray-500 dark:text-gray-400">{Math.round(minTemp)}°C</span>
            </div>
        </div>
    );
}