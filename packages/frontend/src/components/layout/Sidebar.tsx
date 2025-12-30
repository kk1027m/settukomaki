import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Droplet, Wrench, Package, MessageSquare, Bell, Users, Settings, FileText, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { isAdmin } = useAuth();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'トップ' },
    { to: '/lubrication', icon: Droplet, label: '給油管理' },
    { to: '/replacements', icon: Wrench, label: '部品交換管理' },
    { to: '/parts', icon: Package, label: '部品在庫' },
    { to: '/maintenance-procedures', icon: FileText, label: '作業手順' },
  ];

  // 問い合わせは一般ユーザーのみに表示
  if (!isAdmin) {
    navItems.push({ to: '/inquiries', icon: Mail, label: '問い合わせ' });
  }

  // 管理者専用メニュー
  if (isAdmin) {
    navItems.push({ to: '/users', icon: Users, label: 'ユーザー管理' });
    navItems.push({ to: '/settings', icon: Settings, label: '設定' });
  }

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
