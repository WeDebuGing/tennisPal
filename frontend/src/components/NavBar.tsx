import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', icon: '🏠', label: 'Home' },
  { to: '/matchmaking', icon: '🎯', label: 'Matchmaking' },
  { to: '/profile', icon: '👤', label: 'Profile' },
];

export default function NavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 flex justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] z-50">
      {tabs.map(t => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) =>
          `flex flex-col items-center justify-center min-w-[4rem] py-1 px-3 rounded-lg transition-colors ${isActive ? 'text-green-600 font-bold' : 'text-gray-400 active:text-gray-600'}`
        }>
          <span className="text-xl leading-none">{t.icon}</span>
          <span className="text-[11px] mt-0.5">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
