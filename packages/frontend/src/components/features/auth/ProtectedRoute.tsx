import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
