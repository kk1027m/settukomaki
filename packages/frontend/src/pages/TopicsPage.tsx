import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, MessageSquare } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

interface Topic {
  id: number;
  title: string;
  content: string;
  posted_by: number;
  posted_by_username: string;
  posted_by_full_name: string;
  created_at: string;
  updated_at: string;
}

export default function TopicsPage() {
  const { isAdmin } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [viewingTopic, setViewingTopic] = useState<Topic | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const response = await api.get('/topics');
      setTopics(response.data.data);
    } catch (error) {
      toast.error('トピックの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTopic) {
        await api.put(`/topics/${editingTopic.id}`, formData);
        toast.success('トピックを更新しました');
      } else {
        await api.post('/topics', formData);
        toast.success('トピックを投稿しました');
      }
      setIsModalOpen(false);
      resetForm();
      loadTopics();
    } catch (error: any) {
      toast.error(error.response?.data?.error || '保存に失敗しました');
    }
  };

  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setFormData({
      title: topic.title,
      content: topic.content,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (topicId: number) => {
    if (!confirm('このトピックを削除しますか？')) return;

    try {
      await api.delete(`/topics/${topicId}`);
      toast.success('トピックを削除しました');
      loadTopics();
    } catch (error: any) {
      toast.error(error.response?.data?.error || '削除に失敗しました');
    }
  };

  const handleView = (topic: Topic) => {
    setViewingTopic(topic);
    setIsDetailModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
    });
    setEditingTopic(null);
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">トピック・お知らせ</h1>
        {isAdmin && (
          <Button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
          >
            <Plus size={20} className="mr-2" />
            新規投稿
          </Button>
        )}
      </div>

      {/* Topics list */}
      <div className="space-y-4">
        {topics.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-gray-500">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
              <p>まだトピックがありません</p>
            </div>
          </Card>
        ) : (
          topics.map((topic) => (
            <Card
              key={topic.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleView(topic)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {topic.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {topic.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      投稿者: {topic.posted_by_full_name || topic.posted_by_username}
                    </span>
                    <span>投稿日時: {formatDate(topic.created_at)}</span>
                    {topic.updated_at !== topic.created_at && (
                      <span className="text-blue-600">
                        (編集済み: {formatDate(topic.updated_at)})
                      </span>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEdit(topic)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(topic.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingTopic ? 'トピックを編集' : '新規トピック投稿'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="タイトル"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              内容
            </label>
            <textarea
              className="input w-full min-h-[200px]"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              placeholder="お知らせの内容を入力してください"
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
            <Button type="submit">
              {editingTopic ? '更新' : '投稿'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingTopic(null);
        }}
        title="トピック詳細"
      >
        {viewingTopic && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {viewingTopic.title}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 pb-4 border-b">
                <span>
                  投稿者: {viewingTopic.posted_by_full_name || viewingTopic.posted_by_username}
                </span>
                <span>投稿日時: {formatDate(viewingTopic.created_at)}</span>
                {viewingTopic.updated_at !== viewingTopic.created_at && (
                  <span className="text-blue-600">
                    (編集済み: {formatDate(viewingTopic.updated_at)})
                  </span>
                )}
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {viewingTopic.content}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setViewingTopic(null);
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
