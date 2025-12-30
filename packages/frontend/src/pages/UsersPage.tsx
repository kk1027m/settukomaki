import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

export default function UsersPage() {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    full_name: '',
  });

  useEffect(() => {
    if (!isAdmin) {
      toast.error('管理者権限が必要です');
      return;
    }
    loadUsers();
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data);
    } catch (error) {
      toast.error('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        const updateData: any = {
          email: formData.email,
          role: formData.role,
          full_name: formData.full_name,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await api.put(`/users/${editingUser.id}`, updateData);
        toast.success('ユーザー情報を更新しました');
      } else {
        await api.post('/users', formData);
        toast.success('ユーザーを追加しました');
      }
      setIsModalOpen(false);
      resetForm();
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || '保存に失敗しました');
    }
  };

  const handleDelete = async (id: number) => {
    if (id === currentUser?.id) {
      toast.error('自分自身のアカウントは削除できません');
      return;
    }

    if (!confirm('このユーザーを削除しますか？')) return;

    try {
      await api.delete(`/users/${id}`);
      toast.success('ユーザーを削除しました');
      loadUsers();
    } catch (error) {
      toast.error('削除に失敗しました');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      full_name: user.full_name || '',
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'user',
      full_name: '',
    });
  };

  if (!isAdmin) {
    return (
      <Card className="text-center py-12">
        <p className="text-gray-500">この画面にアクセスする権限がありません</p>
      </Card>
    );
  }

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">ユーザー管理</h1>
        <Button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          <Plus size={20} className="mr-2" />
          ユーザーを追加
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">ユーザー名</th>
                <th className="text-left py-3 px-4">メールアドレス</th>
                <th className="text-left py-3 px-4">氏名</th>
                <th className="text-left py-3 px-4">権限</th>
                <th className="text-left py-3 px-4">状態</th>
                <th className="text-left py-3 px-4">登録日</th>
                <th className="text-center py-3 px-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{user.username}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">{user.full_name || '-'}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`badge ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {user.role === 'admin' ? '管理者' : '一般'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`badge ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.is_active ? '有効' : '無効'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(user.created_at).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="secondary"
                        className="text-sm"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="danger"
                        className="text-sm"
                        onClick={() => handleDelete(user.id)}
                        disabled={user.id === currentUser?.id}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingUser ? 'ユーザーを編集' : 'ユーザーを追加'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="ユーザー名"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            disabled={!!editingUser}
          />
          <Input
            label="メールアドレス"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            label={editingUser ? 'パスワード（変更する場合のみ）' : 'パスワード'}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!editingUser}
          />
          <Input
            label="氏名"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">権限</label>
            <select
              className="input"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
            >
              <option value="user">一般ユーザー</option>
              <option value="admin">管理者</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              キャンセル
            </Button>
            <Button type="submit">保存</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
