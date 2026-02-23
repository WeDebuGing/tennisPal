import { createContext, useContext, useState, ReactNode } from 'react';

interface CityCtx {
  city: string;
  setCity: (city: string) => void;
}

const CityContext = createContext<CityCtx>({ city: 'Pittsburgh', setCity: () => {} });
export const useCity = () => useContext(CityContext);

export function CityProvider({ children }: { children: ReactNode }) {
  const [city, setCity] = useState(() => localStorage.getItem('city') || 'Pittsburgh');

  const update = (c: string) => {
    setCity(c);
    localStorage.setItem('city', c);
  };

  return <CityContext.Provider value={{ city, setCity: update }}>{children}</CityContext.Provider>;
}
