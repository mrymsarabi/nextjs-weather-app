import WeatherSearch from "@/components/WeatherSearch";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between mb-10 py-3 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">
            Weatherly 🌤️
          </h1>
          <div className="flex items-center gap-3">
            {/* <DarkToggle /> */}
          </div>
        </header>

        <div className="flex justify-center">
            <WeatherSearch />
        </div>
      </div>
    </div>
  );
}