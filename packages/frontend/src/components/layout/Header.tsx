import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-30">
      <div className="px-3 md:px-6 py-2 md:py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          {/* ハンバーガーメニューボタン（モバイルのみ） */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            aria-label="メニュー"
          >
            <Menu size={24} />
          </button>

          <Link to="/dashboard" className="cursor-pointer hover:opacity-80 transition-opacity">
            <img
              src="/logo.png"
              alt="セッツカートンロゴ"
              className="h-12 md:h-20 w-auto object-contain"
            />
          </Link>
        </div>

        <div className="flex items-center gap-1 md:gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.full_name || user?.username}
              </p>
              <p className="text-xs text-gray-500">
                {user?.role === 'admin' ? '管理者' : '一般ユーザー'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 hover:text-red-600 rounded-full hover:bg-gray-100"
            title="ログアウト"
            aria-label="ログアウト"
          >
            <LogOut size={18} className="md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
