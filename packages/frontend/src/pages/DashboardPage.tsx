import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { AlertTriangle, Droplet, Package, Bell, MessageSquare, Mail } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

interface Stats {
  urgent_lubrication: number;
  upcoming_lubrication: number;
  urgent_replacement: number;
  upcoming_replacement: number;
  low_stock_parts: number;
  order_requests: number;
}

interface Topic {
  id: number;
  title: string;
  content: string;
  posted_by_username: string;
  posted_by_full_name: string;
  created_at: string;
}

interface Inquiry {
  id: number;
  subject: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved';
  created_by_username: string;
  created_by_full_name: string | null;
  created_at: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<Stats>({
    urgent_lubrication: 0,
    upcoming_lubrication: 0,
    urgent_replacement: 0,
    upcoming_replacement: 0,
    low_stock_parts: 0,
    order_requests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentTopics, setRecentTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [recentInquiries, setRecentInquiries] = useState<Inquiry[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadRecentTopics();
    if (isAdmin) {
      loadRecentInquiries();
    }
  }, [isAdmin]);

  const loadStats = async () => {
    try {
      const [lubricationAlerts, replacementAlerts, parts, orderRequests] = await Promise.all([
        api.get('/lubrication/alerts'),
        api.get('/replacements/alerts'),
        api.get('/parts/low-stock'),
        api.get('/parts/order-requests'),
      ]);

      const lubricationData = lubricationAlerts.data.data;
      const urgentLubrication = lubricationData.filter((a: any) => a.status === 'overdue' || a.status === 'due_soon').length;
      const upcomingLubrication = lubricationData.filter((a: any) => a.status === 'upcoming').length;

      const replacementData = replacementAlerts.data.data;
      // Urgent: within 3 days (259200000 ms = 3 days)
      const urgentReplacement = replacementData.filter((a: any) => {
        const daysUntilDue = a.days_until_due;
        return daysUntilDue !== null && daysUntilDue <= 3;
      }).length;
      // Upcoming: within 7 days (604800000 ms = 7 days)
      const upcomingReplacement = replacementData.filter((a: any) => {
        const daysUntilDue = a.days_until_due;
        return daysUntilDue !== null && daysUntilDue > 3 && daysUntilDue <= 7;
      }).length;

      setStats({
        urgent_lubrication: urgentLubrication,
        upcoming_lubrication: upcomingLubrication,
        urgent_replacement: urgentReplacement,
        upcoming_replacement: upcomingReplacement,
        low_stock_parts: parts.data.data.length,
        order_requests: orderRequests.data.data.length,
      });
    } catch (error: any) {
      toast.error('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentTopics = async () => {
    try {
      const response = await api.get('/topics');
      setRecentTopics(response.data.data.slice(0, 3));
    } catch (error) {
      console.error('Failed to load topics', error);
    } finally {
      setTopicsLoading(false);
    }
  };

  const loadRecentInquiries = async () => {
    try {
      const response = await api.get('/inquiries');
      setRecentInquiries(response.data.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to load inquiries', error);
    } finally {
      setInquiriesLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">トップ</h1>

      {/* Topics Section */}
      <Card className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare size={20} />
            トピック・お知らせ
          </h2>
          <button
            onClick={() => navigate('/topics')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            すべて見る →
          </button>
        </div>
        {topicsLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : recentTopics.length > 0 ? (
          <div className="space-y-3">
            {recentTopics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => navigate('/topics')}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                  {topic.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {topic.content}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{topic.posted_by_full_name || topic.posted_by_username}</span>
                  <span>•</span>
                  <span>{new Date(topic.created_at).toLocaleDateString('ja-JP')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">トピックがありません</p>
        )}
      </Card>

      {/* Inquiries Section (Admin Only) */}
      {isAdmin && (
        <Card className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Mail size={20} />
              最近の問い合わせ
            </h2>
            <button
              onClick={() => navigate('/inquiries')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              すべて見る →
            </button>
          </div>
          {inquiriesLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : recentInquiries.length > 0 ? (
            <div className="space-y-3">
              {recentInquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  onClick={() => navigate('/inquiries')}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        inquiry.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : inquiry.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {inquiry.status === 'pending'
                        ? '未対応'
                        : inquiry.status === 'in_progress'
                        ? '対応中'
                        : '解決済み'}
                    </span>
                    <h3 className="font-semibold text-gray-900 line-clamp-1">
                      {inquiry.subject}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                    {inquiry.message}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{inquiry.created_by_full_name || inquiry.created_by_username}</span>
                    <span>•</span>
                    <span>{new Date(inquiry.created_at).toLocaleDateString('ja-JP')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">問い合わせがありません</p>
          )}
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div onClick={() => navigate('/alerts/緊急給油')} className="cursor-pointer transform transition hover:scale-105">
          <Card>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="p-3 bg-red-100 rounded-full mb-2">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <p className="text-xs text-gray-600 mb-1">緊急給油</p>
              <p className="text-2xl font-bold text-red-600">{stats.urgent_lubrication}</p>
            </div>
          </Card>
        </div>

        <div onClick={() => navigate('/alerts/給油予定')} className="cursor-pointer transform transition hover:scale-105">
          <Card>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="p-3 bg-yellow-100 rounded-full mb-2">
                <Droplet className="text-yellow-600" size={24} />
              </div>
              <p className="text-xs text-gray-600 mb-1">給油予定</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.upcoming_lubrication}</p>
            </div>
          </Card>
        </div>

        <div onClick={() => navigate('/alerts/緊急部品交換')} className="cursor-pointer transform transition hover:scale-105">
          <Card>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="p-3 bg-red-100 rounded-full mb-2">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <p className="text-xs text-gray-600 mb-1">緊急部品交換</p>
              <p className="text-2xl font-bold text-red-600">{stats.urgent_replacement}</p>
            </div>
          </Card>
        </div>

        <div onClick={() => navigate('/alerts/部品交換予定')} className="cursor-pointer transform transition hover:scale-105">
          <Card>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="p-3 bg-purple-100 rounded-full mb-2">
                <Package className="text-purple-600" size={24} />
              </div>
              <p className="text-xs text-gray-600 mb-1">部品交換予定</p>
              <p className="text-2xl font-bold text-purple-600">{stats.upcoming_replacement}</p>
            </div>
          </Card>
        </div>

        <div onClick={() => navigate('/alerts/在庫不足・発注依頼')} className="cursor-pointer transform transition hover:scale-105">
          <Card>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="p-3 bg-orange-100 rounded-full mb-2">
                <Package className="text-orange-600" size={24} />
              </div>
              <p className="text-xs text-gray-600 mb-1">在庫不足・発注依頼</p>
              <p className="text-2xl font-bold text-orange-600">{stats.low_stock_parts + stats.order_requests}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
