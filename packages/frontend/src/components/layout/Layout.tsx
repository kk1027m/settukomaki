import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { PullToRefresh } from '../common/PullToRefresh';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleRefresh = useCallback(async () => {
    // カスタムイベントを発火してページにリフレッシュを通知
    window.dispatchEvent(new CustomEvent('pulltorefresh'));
    // 少し待機してUIの更新を見せる
    await new Promise(resolve => setTimeout(resolve, 500));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col h-screen">
      <Header onMenuClick={toggleSidebar} />
      <div className="flex flex-1 pt-16 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        <PullToRefresh onRefresh={handleRefresh}>
          <main className="flex-1 p-4 md:p-6 md:ml-64 min-h-full">
            <Outlet />
          </main>
        </PullToRefresh>
      </div>
    </div>
  );
}
