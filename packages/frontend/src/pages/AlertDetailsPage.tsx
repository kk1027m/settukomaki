import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

type AlertType = '緊急給油' | '給油予定' | '緊急部品交換' | '部品交換予定' | '在庫不足・発注依頼';

export default function AlertDetailsPage() {
  const { type } = useParams<{ type: AlertType }>();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlertItems();
  }, [type]);

  const loadAlertItems = async () => {
    try {
      setLoading(true);

      switch (type) {
        case '緊急給油': {
          const res = await api.get('/lubrication/alerts');
          const filtered = res.data.data.filter(
            (item: any) => item.status === 'overdue' || item.status === 'due_soon'
          );
          setItems(filtered);
          break;
        }

        case '給油予定': {
          const res = await api.get('/lubrication/alerts');
          const filtered = res.data.data.filter(
            (item: any) => item.status === 'upcoming'
          );
          setItems(filtered);
          break;
        }

        case '緊急部品交換': {
          const res = await api.get('/replacements/alerts');
          const filtered = res.data.data.filter(
            (item: any) => item.days_until_due <= 3
          );
          setItems(filtered);
          break;
        }

        case '部品交換予定': {
          const res = await api.get('/replacements/alerts');
          const filtered = res.data.data.filter(
            (item: any) => item.days_until_due > 3 && item.days_until_due <= 7
          );
          setItems(filtered);
          break;
        }

        case '在庫不足・発注依頼': {
          const [partsRes, ordersRes] = await Promise.all([
            api.get('/parts/low-stock'),
            api.get('/parts/order-requests'),
          ]);
          // 在庫不足と発注依頼を結合
          const lowStock = partsRes.data.data.map((p: any) => ({ ...p, type: 'low_stock' }));
          const orders = ordersRes.data.data.map((o: any) => ({ ...o, type: 'order' }));
          setItems([...lowStock, ...orders]);
          break;
        }
      }
    } catch (error: any) {
      toast.error('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getNavigationPath = () => {
    if (type === '緊急給油' || type === '給油予定') return '/lubrication';
    if (type === '緊急部品交換' || type === '部品交換予定') return '/replacements';
    return '/parts';
  };

  const handleItemClick = () => {
    navigate(getNavigationPath());
  };

  const renderItem = (item: any) => {
    // 給油アラート
    if (type === '緊急給油' || type === '給油予定') {
      return (
        <Card key={item.id} className="mb-3 hover:shadow-lg transition cursor-pointer" onClick={handleItemClick}>
          <div className="p-4">
            <h3 className="font-semibold mb-2">{item.machine_name}</h3>
            {item.unit_name && <p className="text-sm text-gray-600">ユニット: {item.unit_name}</p>}
            <p className="text-sm text-gray-600">箇所: {item.location}</p>
            <p className="text-sm text-gray-600">次回予定: {item.next_due_date || '未設定'}</p>
            <div className="mt-2 flex items-center text-blue-600 text-sm">
              <span>詳細を見る</span>
              <ExternalLink size={14} className="ml-1" />
            </div>
          </div>
        </Card>
      );
    }

    // 部品交換アラート
    if (type === '緊急部品交換' || type === '部品交換予定') {
      return (
        <Card key={item.id} className="mb-3 hover:shadow-lg transition cursor-pointer" onClick={handleItemClick}>
          <div className="p-4">
            <h3 className="font-semibold mb-2">{item.machine_name}</h3>
            {item.unit_name && <p className="text-sm text-gray-600">ユニット: {item.unit_name}</p>}
            <p className="text-sm text-gray-600">部品: {item.part_name}</p>
            <p className="text-sm text-gray-600">次回予定: {item.next_due_date || '未設定'}</p>
            <p className="text-sm text-gray-600">残り日数: {item.days_until_due}日</p>
            <div className="mt-2 flex items-center text-blue-600 text-sm">
              <span>詳細を見る</span>
              <ExternalLink size={14} className="ml-1" />
            </div>
          </div>
        </Card>
      );
    }

    // 在庫不足・発注依頼
    if (item.type === 'low_stock') {
      return (
        <Card key={item.id} className="mb-3 hover:shadow-lg transition cursor-pointer" onClick={handleItemClick}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{item.part_name}</h3>
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">在庫不足</span>
            </div>
            <p className="text-sm text-gray-600">部品番号: {item.part_number}</p>
            <p className="text-sm text-gray-600">現在在庫: {item.current_stock} {item.unit}</p>
            <p className="text-sm text-gray-600">最小在庫: {item.min_stock} {item.unit}</p>
            <div className="mt-2 flex items-center text-blue-600 text-sm">
              <span>詳細を見る</span>
              <ExternalLink size={14} className="ml-1" />
            </div>
          </div>
        </Card>
      );
    }

    // 発注依頼
    return (
      <Card key={item.id} className="mb-3 hover:shadow-lg transition cursor-pointer" onClick={handleItemClick}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{item.part_name}</h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">発注依頼</span>
          </div>
          <p className="text-sm text-gray-600">部品番号: {item.part_number}</p>
          <p className="text-sm text-gray-600">依頼数量: {item.quantity} {item.unit}</p>
          <p className="text-sm text-gray-600">依頼者: {item.requested_by_full_name || item.requested_by_username}</p>
          <p className="text-sm text-gray-600">依頼日: {new Date(item.created_at).toLocaleDateString('ja-JP')}</p>
          {item.notes && <p className="text-sm text-gray-600 mt-1">備考: {item.notes}</p>}
          <div className="mt-2 flex items-center text-blue-600 text-sm">
            <span>詳細を見る</span>
            <ExternalLink size={14} className="ml-1" />
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="mr-4"
          >
            <ChevronLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">{type}</h1>
        </div>
        <p className="text-gray-600">全 {items.length} 件</p>
      </div>

      {items.length === 0 ? (
        <Card>
          <p className="text-center text-gray-600 py-8">該当する項目がありません</p>
        </Card>
      ) : (
        <div>
          {items.map(renderItem)}
        </div>
      )}
    </div>
  );
}
