import { useCity } from '../context/CityContext';
export default function CitySelector() {
  const { city, setCity } = useCity();
  return (
    <select value={city} onChange={e => setCity(e.target.value)} className="text-sm border rounded px-2 py-1">
      <option>All</option>
      <option>New York</option>
      <option>Los Angeles</option>
      <option>Chicago</option>
    </select>
  );
}
