import { NavLink } from 'react-router-dom';
import { useUnreadCount } from '../hooks/useNotifications';

const tabs = [
  { to: '/', icon: '🏠', label: 'Home' },
  { to: '/matchmaking', icon: '🎯', label: 'Matchmaking' },
  { to: '/notifications', icon: '🔔', label: 'Alerts', badge: true },
  { to: '/profile', icon: '👤', label: 'Profile' },
];

export default function NavBar() {
  const { data: unread } = useUnreadCount();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 flex justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] z-50">
      {tabs.map(t => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) =>
          `flex flex-col items-center justify-center min-w-[4rem] py-1 px-3 rounded-lg transition-colors relative ${isActive ? 'text-green-600 font-bold' : 'text-gray-400 active:text-gray-600'}`
        }>
          <span className="text-xl leading-none relative">
            {t.icon}
            {t.badge && !!unread && unread > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </span>
          <span className="text-[11px] mt-0.5">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
