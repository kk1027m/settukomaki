import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

interface TroubleshootingItem {
  id: number;
  machine_name: string;
  unit_name: string | null;
  trouble_title: string;
  trouble_description: string | null;
  solution: string | null;
  created_at: string;
}

export default function TroubleshootingPage() {
  const { canEdit } = useAuth();
  const [items, setItems] = useState<TroubleshootingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [expandedMachines, setExpandedMachines] = useState<Set<string>>(new Set());
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TroubleshootingItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<TroubleshootingItem | null>(null);
  const [formData, setFormData] = useState({
    machine_name: '',
    unit_name: '',
    trouble_title: '',
    trouble_description: '',
    solution: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/troubleshooting/items');
      setItems(response.data.data);
      // 全ての機械を展開
      const machines = new Set<string>(response.data.data.map((item: TroubleshootingItem) => item.machine_name));
      setExpandedMachines(machines);
    } catch (error) {
      toast.error('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // ユニット一覧を取得
  const units = ['all', ...Array.from(new Set(items.map(p => p.unit_name).filter(Boolean))) as string[]];

  // 機械名一覧を取得（入力補完用）
  const machineNames = Array.from(new Set(items.map(p => p.machine_name)));

  // フィルタリング
  const filteredItems = items.filter(item => {
    const matchesUnit = selectedUnit === 'all' || item.unit_name === selectedUnit;
    const matchesSearch = searchQuery === '' ||
      item.machine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.unit_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.trouble_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.trouble_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.solution?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesUnit && matchesSearch;
  });

  // 機械名でグループ化
  const itemsByMachine = filteredItems.reduce((acc, item) => {
    const machine = item.machine_name;
    if (!acc[machine]) acc[machine] = [];
    acc[machine].push(item);
    return acc;
  }, {} as Record<string, TroubleshootingItem[]>);

  const toggleMachine = (machine: string) => {
    const newExpanded = new Set(expandedMachines);
    if (newExpanded.has(machine)) {
      newExpanded.delete(machine);
    } else {
      newExpanded.add(machine);
    }
    setExpandedMachines(newExpanded);
  };

  const toggleUnit = (key: string) => {
    const newExpanded = new Set(expandedUnits);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedUnits(newExpanded);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      machine_name: '',
      unit_name: '',
      trouble_title: '',
      trouble_description: '',
      solution: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: TroubleshootingItem) => {
    setEditingItem(item);
    setFormData({
      machine_name: item.machine_name,
      unit_name: item.unit_name || '',
      trouble_title: item.trouble_title,
      trouble_description: item.trouble_description || '',
      solution: item.solution || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (item: TroubleshootingItem) => {
    if (!confirm('このトラブルシューティングを削除しますか？')) return;

    try {
      await api.delete(`/troubleshooting/items/${item.id}`);
      toast.success('削除しました');
      loadData();
    } catch (error) {
      toast.error('削除に失敗しました');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingItem) {
        await api.put(`/troubleshooting/items/${editingItem.id}`, formData);
        toast.success('更新しました');
      } else {
        await api.post('/troubleshooting/items', formData);
        toast.success('追加しました');
      }
      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || '保存に失敗しました');
    }
  };

  const handleViewDetail = (item: TroubleshootingItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-2">
        <h1 className="text-2xl font-bold">
          <span className="md:hidden">トラブル<br />シューティング</span>
          <span className="hidden md:inline">トラブルシューティング</span>
        </h1>
        {canEdit && (
          <Button onClick={handleAdd} className="flex flex-col items-start gap-1 flex-shrink-0 px-4 py-2">
            <Plus size={20} />
            <span className="text-xs">新規追加</span>
          </Button>
        )}
      </div>

      {/* 検索・フィルター */}
      <Card className="mb-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="検索（機械名、ユニット名、トラブル内容、解決策）"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="input w-full"
            >
              <option value="all">すべてのユニット</option>
              {units.filter(u => u !== 'all').map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* 一覧表示 */}
      {Object.keys(itemsByMachine).length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center py-8">
            {searchQuery || selectedUnit !== 'all'
              ? '条件に一致するトラブルシューティングはありません'
              : 'トラブルシューティングが登録されていません'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(itemsByMachine).sort(([a], [b]) => a.localeCompare(b)).map(([machine, machineItems]) => {
            // ユニットでグループ化
            const itemsByUnit = machineItems.reduce((acc, item) => {
              const unit = item.unit_name || '未分類';
              if (!acc[unit]) acc[unit] = [];
              acc[unit].push(item);
              return acc;
            }, {} as Record<string, TroubleshootingItem[]>);

            return (
              <Card key={machine} className="overflow-hidden">
                {/* 機械名ヘッダー */}
                <div
                  className="flex items-center gap-2 p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleMachine(machine)}
                >
                  {expandedMachines.has(machine) ? (
                    <ChevronDown size={20} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={20} className="text-gray-500" />
                  )}
                  <h2 className="font-bold text-lg">{machine}</h2>
                  <span className="text-sm text-gray-500">({machineItems.length}件)</span>
                </div>

                {/* ユニット別表示 */}
                {expandedMachines.has(machine) && (
                  <div className="divide-y">
                    {Object.entries(itemsByUnit).sort(([a], [b]) => a.localeCompare(b)).map(([unit, unitItems]) => {
                      const unitKey = `${machine}-${unit}`;
                      return (
                        <div key={unitKey}>
                          {/* ユニット名ヘッダー */}
                          <div
                            className="flex items-center gap-2 px-6 py-3 bg-gray-25 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => toggleUnit(unitKey)}
                          >
                            {expandedUnits.has(unitKey) ? (
                              <ChevronDown size={16} className="text-gray-400" />
                            ) : (
                              <ChevronRight size={16} className="text-gray-400" />
                            )}
                            <span className="font-medium text-gray-700">{unit}</span>
                            <span className="text-sm text-gray-400">({unitItems.length}件)</span>
                          </div>

                          {/* トラブルシューティング一覧 */}
                          {expandedUnits.has(unitKey) && (
                            <div className="divide-y bg-white">
                              {unitItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="px-8 py-4 hover:bg-gray-50 cursor-pointer"
                                  onClick={() => handleViewDetail(item)}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-medium text-gray-900 mb-1">{item.trouble_title}</h3>
                                      {item.trouble_description && (
                                        <p className="text-sm text-gray-600 line-clamp-2">{item.trouble_description}</p>
                                      )}
                                      {item.solution && (
                                        <p className="text-sm text-green-600 mt-1 line-clamp-1">
                                          <span className="font-medium">解決策:</span> {item.solution}
                                        </p>
                                      )}
                                    </div>
                                    {canEdit && (
                                      <div className="flex items-center gap-2 ml-4">
                                        <button
                                          className="p-2 hover:bg-gray-200 rounded"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(item);
                                          }}
                                        >
                                          <Edit2 size={16} className="text-gray-500" />
                                        </button>
                                        <button
                                          className="p-2 hover:bg-gray-200 rounded"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(item);
                                          }}
                                        >
                                          <Trash2 size={16} className="text-red-500" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* 追加/編集モーダル */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'トラブルシューティングを編集' : 'トラブルシューティングを追加'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">機械名 *</label>
            <input
              type="text"
              list="machine-names"
              value={formData.machine_name}
              onChange={(e) => setFormData({ ...formData, machine_name: e.target.value })}
              className="input w-full"
              required
            />
            <datalist id="machine-names">
              {machineNames.map(name => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
          <Input
            label="ユニット名"
            value={formData.unit_name}
            onChange={(e) => setFormData({ ...formData, unit_name: e.target.value })}
          />
          <Input
            label="トラブル内容 *"
            value={formData.trouble_title}
            onChange={(e) => setFormData({ ...formData, trouble_title: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">トラブル詳細</label>
            <textarea
              value={formData.trouble_description}
              onChange={(e) => setFormData({ ...formData, trouble_description: e.target.value })}
              className="input w-full"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">解決策</label>
            <textarea
              value={formData.solution}
              onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
              className="input w-full"
              rows={4}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              キャンセル
            </Button>
            <Button type="submit">保存</Button>
          </div>
        </form>
      </Modal>

      {/* 詳細表示モーダル */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="トラブルシューティング詳細"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">機械名</label>
              <p className="text-gray-900">{selectedItem.machine_name}</p>
            </div>
            {selectedItem.unit_name && (
              <div>
                <label className="text-sm font-medium text-gray-500">ユニット名</label>
                <p className="text-gray-900">{selectedItem.unit_name}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">トラブル内容</label>
              <p className="text-gray-900 font-medium">{selectedItem.trouble_title}</p>
            </div>
            {selectedItem.trouble_description && (
              <div>
                <label className="text-sm font-medium text-gray-500">トラブル詳細</label>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedItem.trouble_description}</p>
              </div>
            )}
            {selectedItem.solution && (
              <div>
                <label className="text-sm font-medium text-gray-500">解決策</label>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-green-800 whitespace-pre-wrap">{selectedItem.solution}</p>
                </div>
              </div>
            )}
            <div className="pt-4 border-t flex justify-end gap-2">
              {canEdit && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleEdit(selectedItem);
                  }}
                >
                  編集
                </Button>
              )}
              <Button onClick={() => setIsDetailModalOpen(false)}>閉じる</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
