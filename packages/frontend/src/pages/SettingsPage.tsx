import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface Setting {
  id: number;
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/settings');
      const settingsData = response.data.data;
      setSettings(settingsData);

      // Initialize form data
      const initialData: Record<string, string> = {};
      settingsData.forEach((setting: Setting) => {
        initialData[setting.key] = setting.value;
      });
      setFormData(initialData);
    } catch (error) {
      toast.error('設定の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Prepare settings array for update
      const settingsToUpdate = Object.entries(formData).map(([key, value]) => ({
        key,
        value,
      }));

      await api.put('/settings', { settings: settingsToUpdate });
      toast.success('設定を保存しました。スケジューラーが再起動されます。');
      loadSettings();
    } catch (error: any) {
      toast.error(error.response?.data?.error || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  // Group settings by category
  const notificationSettings = settings.filter(s => s.key.startsWith('notification_'));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">システム設定</h1>
        <p className="text-gray-600 mt-2">管理者のみが設定を変更できます</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">通知スケジュール</h2>
          <p className="text-sm text-gray-600 mb-4">
            各チェックを実行する時間を設定してください（24時間形式: HH:MM）
          </p>

          <div className="space-y-4">
            {notificationSettings.map(setting => {
              let label = '';
              if (setting.key === 'notification_lubrication_time') {
                label = '給油チェック時刻';
              } else if (setting.key === 'notification_replacement_time') {
                label = '部品交換チェック時刻';
              } else if (setting.key === 'notification_stock_time') {
                label = '在庫チェック時刻';
              }

              return (
                <div key={setting.key}>
                  <Input
                    label={label}
                    type="time"
                    value={formData[setting.key] || ''}
                    onChange={(e) => handleChange(setting.key, e.target.value)}
                    required
                  />
                  {setting.description && (
                    <p className="text-xs text-gray-500 mt-1">{setting.description}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">注意事項</h3>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>時間を変更すると、スケジューラーが自動的に再起動されます</li>
                <li>変更は即座に反映され、次回の指定時刻から新しいスケジュールで実行されます</li>
                <li>通知は毎日指定された時刻に自動実行されます</li>
              </ul>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  loadSettings();
                  toast.success('変更を破棄しました');
                }}
              >
                リセット
              </Button>
              <Button type="submit" disabled={saving}>
                <Save size={20} className="mr-2" />
                {saving ? '保存中...' : '設定を保存'}
              </Button>
            </div>
          </div>
        </Card>
      </form>

      <Card>
        <h2 className="text-xl font-semibold mb-4">現在のスケジュール</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">給油チェック:</span>
            <span className="text-gray-600">毎日 {formData['notification_lubrication_time']}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">部品交換チェック:</span>
            <span className="text-gray-600">毎日 {formData['notification_replacement_time']}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">在庫チェック:</span>
            <span className="text-gray-600">毎日 {formData['notification_stock_time']}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="font-medium">プッシュ通知送信:</span>
            <span className="text-gray-600">5分ごと</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
