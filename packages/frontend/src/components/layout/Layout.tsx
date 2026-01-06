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
    window.dispatchEvent(new CustomEvent('pulltorefresh'));
    await new Promise(resolve => setTimeout(resolve, 500));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col h-screen">
      <Header onMenuClick={toggleSidebar} />
      <div className="flex flex-1 pt-16 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        <div className="flex-1 md:ml-64 overflow-hidden">
          <PullToRefresh onRefresh={handleRefresh}>
            <main className="p-4 md:p-6 min-h-full">
              <Outlet />
            </main>
          </PullToRefresh>
        </div>
      </div>
    </div>
  );
}
