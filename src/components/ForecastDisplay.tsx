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
    const dailyForecasts = getDailyForecasts(list); 
    
    // Format times for display
    const sunriseTime = new Date(city.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const sunsetTime = new Date(city.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Separate today's forecast from the rest
    const todayForecast = dailyForecasts[0];
    const upcomingForecasts = dailyForecasts.slice(1);

    return (
        <div className="mt-6">
            
            {/* Main Container - Added a slight shadow for elevation */}
            <div className="p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700/50">
                
                {/* Location Header and Today's Summary */}
                <div className="mb-8">
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-2">
                        {city.name}, <span className="text-blue-600 dark:text-blue-400">{city.country}</span>
                    </h2>
                    
                    {/* Current Day / Today's Large Card */}
                    {todayForecast && (
                        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 p-6 bg-blue-50 dark:bg-blue-900/40 rounded-2xl border border-blue-200 dark:border-blue-700">
                            <div className="flex items-center gap-4">
                                <img
                                    src={`https://openweathermap.org/img/wn/${todayForecast.icon}@4x.png`} // Use 4x for a large icon
                                    alt={todayForecast.description}
                                    className="w-24 h-24 sm:w-32 sm:h-32"
                                />
                                <div className='text-center sm:text-left'>
                                    <div className="text-xl font-semibold text-blue-700 dark:text-blue-300">Today</div>
                                    <div className="text-4xl font-bold text-gray-900 dark:text-white my-1">
                                        {Math.round(todayForecast.maxTemp)}°C
                                    </div>
                                    <div className="text-lg capitalize text-gray-600 dark:text-gray-400">
                                        {todayForecast.description}
                                    </div>
                                </div>
                            </div>

                            {/* Sunrise/Sunset - placed on the right */}
                            <div className="mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 sm:border-l border-blue-200 dark:border-blue-700/50 sm:pl-6 text-center sm:text-right">
                                <div className="flex items-center justify-center sm:justify-end gap-2 text-md mb-2 text-gray-700 dark:text-gray-300">
                                    <Sunrise className="w-5 h-5 text-orange-500" /> 
                                    <span className='font-medium'>Sunrise:</span> {sunriseTime}
                                </div>
                                <div className="flex items-center justify-center sm:justify-end gap-2 text-md text-gray-700 dark:text-gray-300">
                                    <Sunset className="w-5 h-5 text-orange-500" /> 
                                    <span className='font-medium'>Sunset:</span> {sunsetTime}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Upcoming Days Header */}
                <h3 className="text-2xl font-bold mb-4 mt-6 border-b pb-2 border-gray-100 dark:border-gray-700">
                    5-Day Forecast
                </h3>

                {/* Upcoming Forecast Grid (starts from Day 2) */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                    {upcomingForecasts.map((day: DailyForecast, index: number) => (
                        <DailyForecastCard key={index} forecast={day} />
                    ))}
                </div>
            </div>
        </div>
    );
}

// Sub-Component for each day's card (simplified, as 'isToday' logic is moved up)
type DailyProps = { forecast: DailyForecast };

const DailyForecastCard = ({ forecast }: DailyProps) => {
    const { dayName, minTemp, maxTemp, icon, description } = forecast;

    return (
        <div className={`p-4 text-center rounded-2xl transition-all bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600`}>
            <div className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-1">
                {dayName}
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
            
            <div className="flex justify-center gap-3 text-base">
                <span className="font-extrabold text-xl text-gray-900 dark:text-white">{Math.round(maxTemp)}°C</span>
                <span className="text-gray-500 dark:text-gray-400 mt-0.5">{Math.round(minTemp)}°C</span>
            </div>
        </div>
    );
}