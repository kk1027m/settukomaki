import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

interface Part {
  id: number;
  part_number: string | null;
  part_name: string;
  current_stock: number;
  min_stock: number;
  unit: string;
  unit_name: string | null;
  location: string | null;
  shelf_box_name: string | null;
  description: string | null;
  stock_status: 'sufficient' | 'low' | 'out';
  needs_order: boolean;
}

export default function PartsPage() {
  const { isAdmin } = useAuth();
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [viewingPart, setViewingPart] = useState<Part | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    part_number: '',
    part_name: '',
    current_stock: 0,
    min_stock: 0,
    unit: '個',
    unit_name: '',
    location: '',
    shelf_box_name: '',
    description: '',
  });
  const [adjustData, setAdjustData] = useState({
    action_type: '入庫' as '入庫' | '出庫' | '調整',
    quantity: 1,
    notes: '',
  });
  const [orderData, setOrderData] = useState({
    quantity: 1,
    urgency: 'normal' as 'normal' | 'urgent',
    notes: '',
  });

  useEffect(() => {
    loadParts();
  }, []);

  const loadParts = async () => {
    try {
      const response = await api.get('/parts');
      setParts(response.data.data);
    } catch (error) {
      toast.error('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPart) {
        await api.put(`/parts/${editingPart.id}`, formData);
        toast.success('部品情報を更新しました');
      } else {
        await api.post('/parts', formData);
        toast.success('部品を追加しました');
      }
      setIsModalOpen(false);
      resetForm();
      loadParts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || '保存に失敗しました');
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart) return;

    try {
      await api.post(`/parts/${selectedPart.id}/adjust`, adjustData);
      toast.success('在庫を調整しました');
      setIsAdjustModalOpen(false);
      setAdjustData({ action_type: '入庫', quantity: 1, notes: '' });
      loadParts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || '在庫調整に失敗しました');
    }
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart) return;

    try {
      await api.post(`/parts/${selectedPart.id}/order`, orderData);
      toast.success('発注依頼を送信しました');
      setIsOrderModalOpen(false);
      setOrderData({ quantity: 1, urgency: 'normal', notes: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.error || '発注依頼に失敗しました');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この部品を削除しますか？')) return;

    try {
      await api.delete(`/parts/${id}`);
      toast.success('削除しました');
      loadParts();
    } catch (error) {
      toast.error('削除に失敗しました');
    }
  };

  const handleEdit = (part: Part) => {
    setEditingPart(part);
    setFormData({
      part_number: part.part_number || '',
      part_name: part.part_name,
      current_stock: part.current_stock,
      min_stock: part.min_stock,
      unit: part.unit,
      unit_name: part.unit_name || '',
      location: part.location || '',
      shelf_box_name: part.shelf_box_name || '',
      description: part.description || '',
    });
    setIsModalOpen(true);
  };

  const handleView = (part: Part) => {
    setViewingPart(part);
    setIsDetailModalOpen(true);
  };

  const resetForm = () => {
    setEditingPart(null);
    setFormData({
      part_number: '',
      part_name: '',
      current_stock: 0,
      min_stock: 0,
      unit: '個',
      unit_name: '',
      location: '',
      shelf_box_name: '',
      description: '',
    });
  };

  const toggleLocation = (location: string) => {
    setExpandedLocations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(location)) {
        newSet.delete(location);
      } else {
        newSet.add(location);
      }
      return newSet;
    });
  };

  const quickAdjust = async (partId: number, amount: number) => {
    try {
      await api.post(`/parts/${partId}/adjust`, {
        action_type: amount > 0 ? '入庫' : '出庫',
        quantity: Math.abs(amount),
      });
      toast.success('在庫を調整しました');
      loadParts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || '在庫調整に失敗しました');
    }
  };

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  // Get unique locations for filtering
  const locations = ['all', ...Array.from(new Set(parts.map(p => p.location).filter(Boolean)))];

  // Filter parts by selected location and search query
  const filteredParts = parts.filter(part => {
    const matchesLocation = selectedUnit === 'all' || part.location === selectedUnit;
    const matchesSearch = !searchQuery ||
      part.part_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (part.part_number && part.part_number.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLocation && matchesSearch;
  });

  // Group parts by location
  const partsByLocation = filteredParts.reduce((acc, part) => {
    const location = part.location || '未分類';
    if (!acc[location]) acc[location] = [];
    acc[location].push(part);
    return acc;
  }, {} as Record<string, Part[]>);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">部品在庫管理</h1>
        {isAdmin && (
          <Button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
          >
            <Plus size={20} className="mr-2" />
            部品を追加
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">検索（型番・部品名）</label>
          <input
            type="text"
            className="input w-full"
            placeholder="検索ワードを入力..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">保管場所で絞り込み</label>
          <select
            className="input w-full"
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
          >
            <option value="all">すべて表示</option>
            {locations.filter(l => l !== 'all').map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Display grouped by location */}
      {Object.entries(partsByLocation).map(([locationName, locationParts]) => (
        <div key={locationName} className="mb-8">
          <div
            className="flex items-center gap-2 text-2xl font-semibold mb-4 text-gray-700 border-b-2 border-gray-300 pb-2 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => toggleLocation(locationName)}
          >
            {expandedLocations.has(locationName) ? (
              <ChevronDown size={28} />
            ) : (
              <ChevronRight size={28} />
            )}
            <h2>{locationName}</h2>
            <span className="text-sm text-gray-500 ml-2">({locationParts.length}件)</span>
          </div>
          {expandedLocations.has(locationName) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {locationParts.map((part) => (
          <Card
            key={part.id}
            onClick={() => handleView(part)}
            className={`cursor-pointer hover:shadow-lg transition-shadow ${part.needs_order ? 'border-2 border-orange-300' : ''}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                {part.unit_name && (
                  <p className="text-xs text-blue-600 font-medium">{part.unit_name}</p>
                )}
                <h3 className="font-bold text-lg">{part.part_name}</h3>
                {part.part_number && (
                  <p className="text-sm text-gray-600">{part.part_number}</p>
                )}
                {part.shelf_box_name && (
                  <p className="text-xs text-gray-500 mt-1">📦 {part.shelf_box_name}</p>
                )}
              </div>
              {part.needs_order && (
                <span className="badge bg-orange-100 text-orange-800">在庫不足</span>
              )}
            </div>

            <div className="bg-gray-50 rounded p-3 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">現在庫:</span>
                <span className="text-2xl font-bold">
                  {part.current_stock} {part.unit}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">発注点:</span>
                <span className="text-sm">{part.min_stock} {part.unit}</span>
              </div>
            </div>

            {isAdmin && (
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="primary"
                  className="flex-1 text-sm"
                  onClick={() => {
                    setSelectedPart(part);
                    setIsAdjustModalOpen(true);
                  }}
                >
                  <TrendingUp size={16} className="mr-1" />
                  在庫調整
                </Button>
                <Button
                  variant="secondary"
                  className="text-sm"
                  onClick={() => {
                    setSelectedPart(part);
                    setIsOrderModalOpen(true);
                  }}
                >
                  <FileText size={16} />
                </Button>
                <Button
                  variant="secondary"
                  className="text-sm"
                  onClick={() => handleEdit(part)}
                >
                  <Edit size={16} />
                </Button>
                <Button
                  variant="danger"
                  className="text-sm"
                  onClick={() => handleDelete(part.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            )}
          </Card>
            ))}
            </div>
          )}
        </div>
      ))}

      {filteredParts.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-gray-500">部品が登録されていません</p>
        </Card>
      )}

      {/* 部品追加/編集モーダル */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingPart ? '部品を編集' : '部品を追加'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="部品番号"
            value={formData.part_number}
            onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
          />
          <Input
            label="ユニット名"
            value={formData.unit_name}
            onChange={(e) => setFormData({ ...formData, unit_name: e.target.value })}
            placeholder="例: ユニット1、ユニット2"
          />
          <Input
            label="部品名"
            value={formData.part_name}
            onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="現在庫"
              type="number"
              value={formData.current_stock}
              onChange={(e) => setFormData({ ...formData, current_stock: parseInt(e.target.value) })}
              required
            />
            <Input
              label="発注点"
              type="number"
              value={formData.min_stock}
              onChange={(e) => setFormData({ ...formData, min_stock: parseInt(e.target.value) })}
              required
            />
          </div>
          <Input
            label="単位"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            required
          />
          <Input
            label="保管場所"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
          <Input
            label="棚、ボックス名"
            value={formData.shelf_box_name}
            onChange={(e) => setFormData({ ...formData, shelf_box_name: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
            <textarea
              className="input"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
            <Button type="submit">保存</Button>
          </div>
        </form>
      </Modal>

      {/* 在庫調整モーダル */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="在庫調整"
      >
        <form onSubmit={handleAdjust} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">操作種別</label>
            <select
              className="input"
              value={adjustData.action_type}
              onChange={(e) => setAdjustData({ ...adjustData, action_type: e.target.value as any })}
            >
              <option value="入庫">入庫</option>
              <option value="出庫">出庫</option>
              <option value="調整">調整</option>
            </select>
          </div>
          <Input
            label="数量"
            type="number"
            min="1"
            value={adjustData.quantity}
            onChange={(e) => setAdjustData({ ...adjustData, quantity: parseInt(e.target.value) })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
            <textarea
              className="input"
              rows={3}
              value={adjustData.notes}
              onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAdjustModalOpen(false)}
            >
              キャンセル
            </Button>
            <Button type="submit">実行</Button>
          </div>
        </form>
      </Modal>

      {/* 発注依頼モーダル */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="発注依頼"
      >
        <form onSubmit={handleOrder} className="space-y-4">
          <Input
            label="発注数量"
            type="number"
            min="1"
            value={orderData.quantity}
            onChange={(e) => setOrderData({ ...orderData, quantity: parseInt(e.target.value) })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">緊急度</label>
            <select
              className="input"
              value={orderData.urgency}
              onChange={(e) => setOrderData({ ...orderData, urgency: e.target.value as any })}
            >
              <option value="normal">通常</option>
              <option value="urgent">緊急</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
            <textarea
              className="input"
              rows={3}
              value={orderData.notes}
              onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsOrderModalOpen(false)}
            >
              キャンセル
            </Button>
            <Button type="submit">送信</Button>
          </div>
        </form>
      </Modal>

      {/* Detail View Modal (Read-only) */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingPart(null);
        }}
        title="部品詳細"
      >
        {viewingPart && (
          <div className="space-y-4">
            {viewingPart.unit_name && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ユニット名</label>
                <p className="text-gray-900">{viewingPart.unit_name}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">部品名</label>
              <p className="text-gray-900">{viewingPart.part_name}</p>
            </div>
            {viewingPart.part_number && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">部品番号</label>
                <p className="text-gray-900">{viewingPart.part_number}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">現在庫</label>
                <p className="text-gray-900 text-xl font-bold">{viewingPart.current_stock} {viewingPart.unit}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">発注点</label>
                <p className="text-gray-900">{viewingPart.min_stock} {viewingPart.unit}</p>
              </div>
            </div>
            {viewingPart.location && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">保管場所</label>
                <p className="text-gray-900">{viewingPart.location}</p>
              </div>
            )}
            {viewingPart.shelf_box_name && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">棚、ボックス名</label>
                <p className="text-gray-900">{viewingPart.shelf_box_name}</p>
              </div>
            )}
            {viewingPart.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                <p className="text-gray-900 whitespace-pre-wrap">{viewingPart.description}</p>
              </div>
            )}
            {viewingPart.needs_order && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-orange-800 font-medium">在庫不足 - 発注が必要です</p>
              </div>
            )}
            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setViewingPart(null);
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
