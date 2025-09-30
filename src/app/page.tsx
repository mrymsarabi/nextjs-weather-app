import DarkToggle from "@/components/DarkToggle";
import WeatherSearch from "@/components/WeatherSearch";

export default function Home() {
  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Weatherly</h1>
        <div className="flex items-center gap-3">
          <DarkToggle />
        </div>
      </header>

      <WeatherSearch />
    </div>
  );
}
