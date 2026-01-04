import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const mainRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // プルトゥリフレッシュのロジック
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // ページが一番上にスクロールされているかチェック
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // ページが一番上にスクロールされている場合のみ処理
      if (window.scrollY === 0 && startY.current > 0) {
        const currentY = e.touches[0].clientY;
        const distance = currentY - startY.current;

        // 下方向にスワイプしている場合
        if (distance > 0 && distance < 150) {
          e.preventDefault();
          setPullDistance(distance);
          setIsPulling(true);
        }
      }
    };

    const handleTouchEnd = () => {
      if (isPulling && pullDistance > 80) {
        // Refresh by navigating to current path
        navigate(location.pathname, { replace: true });
        // Force a small delay to ensure refresh
        setTimeout(() => {
          navigate(0); // This refreshes the route
        }, 10);
      }

      // 状態をリセット
      setIsPulling(false);
      setPullDistance(0);
      startY.current = 0;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div 
        className={'pull-to-refresh ' + (isPulling && pullDistance > 50 ? 'visible' : '') + ' ' + (pullDistance > 80 ? 'spinning' : '')}
        style={{
          transform: isPulling 
            ? 'translateX(-50%) translateY(' + Math.min(pullDistance - 40, 16) + 'px)'
            : 'translateX(-50%) translateY(-100%)'
        }}
      >
        <RefreshCw />
      </div>

      <Header onMenuClick={toggleSidebar} />
      <div className="flex pt-16">
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        <main ref={mainRef} className="flex-1 p-4 md:p-6 md:ml-64">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
