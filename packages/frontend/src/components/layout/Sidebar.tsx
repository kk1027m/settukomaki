import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Droplet, Wrench, Package, Users, Settings, FileText, Mail, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { isAdmin } = useAuth();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'トップ' },
    { to: '/lubrication', icon: Droplet, label: '給油管理' },
    { to: '/replacements', icon: Wrench, label: '部品交換管理' },
    { to: '/parts', icon: Package, label: '部品在庫' },
    { to: '/maintenance-procedures', icon: FileText, label: '作業標準' },
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
    <>
      {/* オーバーレイ（モバイルのみ） */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* サイドバー */}
      <aside
        className={`
          fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto z-50 transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* 閉じるボタン（モバイルのみ） */}
        <div className="md:hidden flex justify-end p-4">
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
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
    </>
  );
}
