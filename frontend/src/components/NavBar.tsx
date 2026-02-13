import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', icon: '🏠', label: 'Home' },
  { to: '/players', icon: '👥', label: 'Players' },
  { to: '/matchmaking', icon: '🎯', label: 'Match' },
  { to: '/matches', icon: '🎾', label: 'Matches' },
  { to: '/profile', icon: '👤', label: 'Profile' },
];

export default function NavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50">
      {tabs.map(t => (
        <NavLink key={t.to} to={t.to} end className={({ isActive }) =>
          `flex flex-col items-center text-xs ${isActive ? 'text-green-600 font-bold' : 'text-gray-500'}`
        }>
          <span className="text-xl">{t.icon}</span>
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
