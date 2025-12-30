import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src="/logo.png"
            alt="セッツカートンロゴ"
            className="h-20 w-auto object-contain"
          />
          <div className="border-l border-gray-300 pl-4">
            <h1 className="text-sm font-medium text-gray-600 leading-tight">
              セッツカートン製造用アプリ
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
          >
            <Bell size={24} />
          </button>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.full_name || user?.username}
              </p>
              <p className="text-xs text-gray-500">
                {user?.role === 'admin' ? '管理者' : '一般ユーザー'}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-red-600 rounded-full hover:bg-gray-100"
              title="ログアウト"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
