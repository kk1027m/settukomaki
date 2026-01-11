import { useEffect, useState } from 'react';
import { Plus, Mail, CheckCircle, Clock, AlertCircle, Send } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

interface Reply {
  id: number;
  inquiry_id: number;
  message: string;
  created_by_id: number;
  created_by_username: string;
  created_by_full_name: string | null;
  created_at: string;
}

interface Inquiry {
  id: number;
  subject: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved';
  created_by_id: number;
  created_by_username: string;
  created_by_full_name: string | null;
  created_at: string;
  updated_at: string;
  replies?: Reply[];
}

export default function InquiriesPage() {
  const { canEdit } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingInquiry, setViewingInquiry] = useState<Inquiry | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });

  useEffect(() => {
    loadInquiries();
  }, []);

  const loadInquiries = async () => {
    try {
      const response = await api.get('/inquiries');
      setInquiries(response.data.data);
    } catch (error) {
      toast.error('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post('/inquiries', formData);
      toast.success('問い合わせを送信しました');
      setIsModalOpen(false);
      resetForm();
      loadInquiries();
    } catch (error: any) {
      toast.error(error.response?.data?.error || '送信に失敗しました');
    }
  };

  const handleView = async (inquiry: Inquiry) => {
    try {
      const response = await api.get('/inquiries/' + inquiry.id);
      setViewingInquiry(response.data.data);
      setIsDetailModalOpen(true);
    } catch (error) {
      toast.error('詳細の読み込みに失敗しました');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!viewingInquiry) return;

    try {
      await api.put('/inquiries/' + viewingInquiry.id + '/status', { status: newStatus });
      toast.success('ステータスを更新しました');
      setViewingInquiry({ ...viewingInquiry, status: newStatus as Inquiry['status'] });
      loadInquiries();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ステータス更新に失敗しました');
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingInquiry || !replyMessage.trim()) return;

    setSubmittingReply(true);
    try {
      const response = await api.post('/inquiries/' + viewingInquiry.id + '/replies', {
        message: replyMessage,
      });
      toast.success('返信を送信しました');
      setReplyMessage('');
      const newReply = response.data.data;
      setViewingInquiry({
        ...viewingInquiry,
        status: viewingInquiry.status === 'pending' ? 'in_progress' : viewingInquiry.status,
        replies: [...(viewingInquiry.replies || []), newReply],
      });
      loadInquiries();
    } catch (error: any) {
      toast.error(error.response?.data?.error || '返信の送信に失敗しました');
    } finally {
      setSubmittingReply(false);
    }
  };

  const resetForm = () => {
    setFormData({
      subject: '',
      message: '',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { className: 'bg-yellow-100 text-yellow-800', icon: Clock, label: '未対応' },
      in_progress: { className: 'bg-blue-100 text-blue-800', icon: AlertCircle, label: '対応中' },
      resolved: { className: 'bg-green-100 text-green-800', icon: CheckCircle, label: '解決済み' },
    };
    const badge = badges[status as keyof typeof badges];
    const Icon = badge.icon;
    return (
      <span className={"inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm " + badge.className}>
        <Icon size={14} />
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">問い合わせ</h1>
        <Button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          <Plus size={20} className="mr-2" />
          新規問い合わせ
        </Button>
      </div>

      <div className="space-y-4">
        {inquiries.length === 0 ? (
          <Card className="text-center py-12">
            <Mail size={48} className="mx-auto mb-4 opacity-50 text-gray-400" />
            <p className="text-gray-500">問い合わせがありません</p>
          </Card>
        ) : (
          inquiries.map((inquiry) => (
            <Card
              key={inquiry.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleView(inquiry)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(inquiry.status)}
                    <h3 className="font-bold text-lg">{inquiry.subject}</h3>
                  </div>
                  <p className="text-gray-600 mb-2 line-clamp-2">{inquiry.message}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      送信者: {inquiry.created_by_full_name || inquiry.created_by_username}
                    </span>
                    <span>作成日時: {formatDate(inquiry.created_at)}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title="新規問い合わせ"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="件名"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
            <textarea
              className="input"
              rows={5}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
            />
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
            <Button type="submit">送信</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingInquiry(null);
          setReplyMessage('');
        }}
        title="問い合わせ詳細"
      >
        {viewingInquiry && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusBadge(viewingInquiry.status)}
              </div>
              {canEdit && (
                <select
                  className="input text-sm py-1 px-2"
                  value={viewingInquiry.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="pending">未対応</option>
                  <option value="in_progress">対応中</option>
                  <option value="resolved">解決済み</option>
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">件名</label>
              <p className="text-gray-900 font-semibold">{viewingInquiry.subject}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
              <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded">{viewingInquiry.message}</p>
            </div>
            <div className="flex gap-4 text-sm text-gray-600">
              <span>
                送信者: {viewingInquiry.created_by_full_name || viewingInquiry.created_by_username}
              </span>
              <span>作成日時: {formatDate(viewingInquiry.created_at)}</span>
            </div>

            {viewingInquiry.replies && viewingInquiry.replies.length > 0 && (
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">返信履歴</label>
                <div className="space-y-3">
                  {viewingInquiry.replies.map((reply) => (
                    <div key={reply.id} className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-gray-900 whitespace-pre-wrap">{reply.message}</p>
                      <div className="flex gap-2 mt-2 text-xs text-gray-500">
                        <span>{reply.created_by_full_name || reply.created_by_username}</span>
                        <span>・</span>
                        <span>{formatDate(reply.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {canEdit && (
              <div className="border-t pt-4">
                <form onSubmit={handleReplySubmit} className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">返信を追加</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="返信内容を入力..."
                    required
                  />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={submittingReply || !replyMessage.trim()}>
                      <Send size={16} className="mr-1" />
                      {submittingReply ? '送信中...' : '返信を送信'}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            <div className="flex justify-end border-t pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setViewingInquiry(null);
                  setReplyMessage('');
                }}
              >
                閉じる
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
