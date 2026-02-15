import { createContext, useContext, useState, ReactNode } from 'react';
const CityContext = createContext<any>({ city: 'All', setCity: () => {} });
export const useCity = () => useContext(CityContext);
export function CityProvider({ children }: { children: ReactNode }) {
  const [city, setCity] = useState('All');
  return <CityContext.Provider value={{ city, setCity }}>{children}</CityContext.Provider>;
}
