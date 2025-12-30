import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(username, password);
      toast.success('ログインしました');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <img
              src="/logo.png"
              alt="セッツカートンロゴ"
              className="h-32 w-auto object-contain"
            />
          </div>
          <h1 className="text-sm font-medium text-gray-600 mb-3">
            セッツカートン製造用アプリ
          </h1>
          <p className="text-gray-600">ログインしてください</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="ユーザー名"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ユーザー名を入力"
            required
          />

          <Input
            label="パスワード"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワードを入力"
            required
          />

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>初期ユーザー:</p>
          <p>管理者: admin / admin123</p>
          <p>一般: user1 / user123</p>
        </div>
      </div>
    </div>
  );
}
