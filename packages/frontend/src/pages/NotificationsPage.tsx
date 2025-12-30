import { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface Notification {
  id: number;
  type: 'lubrication_due' | 'lubrication_overdue' | 'low_stock' | 'order_request';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.data);
    } catch (error) {
      toast.error('通知の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      loadNotifications();
    } catch (error) {
      toast.error('既読にできませんでした');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      toast.success('全ての通知を既読にしました');
      loadNotifications();
    } catch (error) {
      toast.error('操作に失敗しました');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/notifications/${id}`);
      toast.success('通知を削除しました');
      loadNotifications();
    } catch (error) {
      toast.error('削除に失敗しました');
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: any = {
      lubrication_due: '🔔',
      lubrication_overdue: '⚠️',
      low_stock: '📦',
      order_request: '📋',
    };
    return icons[type] || '🔔';
  };

  const getTypeLabel = (type: string) => {
    const labels: any = {
      lubrication_due: '給油予定',
      lubrication_overdue: '給油超過',
      low_stock: '在庫不足',
      order_request: '発注依頼',
    };
    return labels[type] || '通知';
  };

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">通知</h1>
        {notifications.some(n => !n.is_read) && (
          <Button onClick={handleMarkAllAsRead}>
            <CheckCheck size={20} className="mr-2" />
            全て既読にする
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={`${!notification.is_read ? 'border-l-4 border-l-primary-500' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold">{notification.title}</h3>
                    <span className="badge badge-upcoming text-xs">
                      {getTypeLabel(notification.type)}
                    </span>
                    {!notification.is_read && (
                      <span className="badge bg-blue-100 text-blue-800 text-xs">未読</span>
                    )}
                  </div>
                  <p className="text-gray-700">{notification.message}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(notification.created_at).toLocaleString('ja-JP')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                {!notification.is_read && (
                  <Button
                    variant="secondary"
                    className="text-sm"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <Check size={16} />
                  </Button>
                )}
                <Button
                  variant="danger"
                  className="text-sm"
                  onClick={() => handleDelete(notification.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {notifications.length === 0 && (
        <Card className="text-center py-12">
          <Bell size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">通知はありません</p>
        </Card>
      )}
    </div>
  );
}
