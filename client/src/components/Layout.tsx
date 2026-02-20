import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/feed', label: '피드', icon: '🏠' },
  { to: '/my-links', label: '내 링크', icon: '🔗' },
  { to: '/credits', label: '크레딧', icon: '💰' },
  { to: '/profile', label: '프로필', icon: '👤' },
];

export default function Layout() {
  const { user } = useAuth();

  if (!user) return <Outlet />;

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-indigo-600">클릭품앗이</h1>
          <span className="text-sm text-slate-500">
            💰 {user.credits} 크레딧
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="sticky bottom-0 bg-white border-t border-slate-200">
        <div className="flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                  isActive ? 'text-indigo-600 font-semibold' : 'text-slate-400'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
