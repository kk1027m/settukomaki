import { useEffect, useState } from 'react';
import { Send, CheckCircle, XCircle, Users, User, Trash2 } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface LineRecipient {
  id: string;
  displayId: string;
  type: string;
  name: string | null;
}

interface LineStatusData {
  hasToken: boolean;
  hasGroupId: boolean;
  recipientCount: number;
  recipients: LineRecipient[];
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [lineStatus, setLineStatus] = useState<LineStatusData | null>(null);
  const [testingLine, setTestingLine] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadLineStatus();
  }, []);

  const loadLineStatus = async () => {
    try {
      const response = await api.get('/line/status');
      setLineStatus(response.data.data);
    } catch (error) {
      console.error('Failed to load LINE status');
    } finally {
      setLoading(false);
    }
  };

  const testLineNotification = async () => {
    setTestingLine(true);
    try {
      const response = await api.post('/line/test');
      if (response.data.success) {
        toast.success('テスト通知を送信しました！LINEを確認してください');
      } else {
        toast.error('送信に失敗しました: ' + response.data.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'LINE通知の送信に失敗しました');
    } finally {
      setTestingLine(false);
    }
  };

  const triggerManualNotification = async () => {
    setTestingLine(true);
    try {
      const response = await api.post('/line/trigger');
      if (response.data.success) {
        toast.success('通知を送信しました！');
      } else {
        toast.error(response.data.message || '送信対象がありませんでした');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || '通知の送信に失敗しました');
    } finally {
      setTestingLine(false);
    }
  };

  const deleteRecipient = async (recipientId: string) => {
    if (!confirm('この送信先を削除しますか？')) return;
    
    setDeletingId(recipientId);
    try {
      await api.delete('/line/recipients/' + encodeURIComponent(recipientId));
      toast.success('送信先を削除しました');
      loadLineStatus();
    } catch (error: any) {
      toast.error(error.response?.data?.error || '削除に失敗しました');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">システム設定</h1>
        <p className="text-gray-600 mt-2">管理者のみが設定を変更できます</p>
      </div>

      <Card>
        <h2 className="text-xl font-semibold mb-4">LINE通知設定</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="font-medium w-40">Channel Access Token:</span>
            {lineStatus?.hasToken ? (
              <span className="flex items-center text-green-600">
                <CheckCircle size={16} className="mr-1" /> 設定済み
              </span>
            ) : (
              <span className="flex items-center text-red-600">
                <XCircle size={16} className="mr-1" /> 未設定
              </span>
            )}
          </div>
          <div className="flex items-start gap-4">
            <span className="font-medium w-40">送信先:</span>
            <div className="flex-1">
              {lineStatus?.recipientCount && lineStatus.recipientCount > 0 ? (
                <div className="space-y-2">
                  <span className="flex items-center text-green-600">
                    <CheckCircle size={16} className="mr-1" /> {lineStatus.recipientCount}件の送信先
                  </span>
                  <div className="space-y-2 mt-2">
                    {lineStatus.recipients.map((recipient) => (
                      <div key={recipient.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex items-center text-sm text-gray-600">
                          {recipient.type === 'group' ? (
                            <Users size={14} className="mr-2" />
                          ) : (
                            <User size={14} className="mr-2" />
                          )}
                          <span>
                            {recipient.type === 'group' ? 'グループ' : '個人'}: ...{recipient.displayId}
                            {recipient.name && ` (${recipient.name})`}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteRecipient(recipient.id)}
                          disabled={deletingId === recipient.id}
                          className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50"
                          title="削除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <span className="flex items-center text-red-600">
                  <XCircle size={16} className="mr-1" /> 未設定
                </span>
              )}
            </div>
          </div>
          <div className="pt-4 border-t flex gap-4">
            <Button type="button" onClick={testLineNotification} disabled={testingLine || !lineStatus?.hasToken || !lineStatus?.hasGroupId}>
              <Send size={16} className="mr-2" />
              {testingLine ? '送信中...' : 'テスト通知を送信'}
            </Button>
            <Button type="button" variant="secondary" onClick={triggerManualNotification} disabled={testingLine || !lineStatus?.hasToken || !lineStatus?.hasGroupId}>
              {testingLine ? '送信中...' : '今すぐ通知を実行'}
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">※ 平日の朝8時（日本時間）に自動で通知が送信されます</p>
          <p className="text-sm text-gray-500">※ グループや個人チャットでBotにメッセージを送ると、自動的に送信先として登録されます</p>
        </div>
      </Card>
    </div>
  );
}
