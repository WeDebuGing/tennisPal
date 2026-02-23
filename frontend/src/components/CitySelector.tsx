import { useCity } from '../context/CityContext';

const CITIES = ['Pittsburgh', 'San Francisco', 'New York', 'Los Angeles', 'Chicago'];

export default function CitySelector() {
  const { city, setCity } = useCity();

  return (
    <select
      value={city}
      onChange={e => setCity(e.target.value)}
      className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
    >
      {CITIES.map(c => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  );
}
