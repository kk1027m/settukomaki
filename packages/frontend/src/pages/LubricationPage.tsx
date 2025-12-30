import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Check, ChevronDown, ChevronRight, Eye } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { ImageUpload, Attachment } from '../components/common/ImageUpload';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface LubricationPoint {
  id: number;
  machine_name: string;
  unit_name: string | null;
  location: string;
  cycle_days: number;
  description: string | null;
  last_performed: string | null;
  next_due_date: string | null;
  days_until_due: number | null;
  status: 'overdue' | 'due_soon' | 'upcoming' | 'ok';
  thumbnail?: string | null;
}

export default function LubricationPage() {
  const { isAdmin } = useAuth();
  const [points, setPoints] = useState<LubricationPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<LubricationPoint | null>(null);
  const [viewingPoint, setViewingPoint] = useState<LubricationPoint | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [expandedMachines, setExpandedMachines] = useState<Set<string>>(new Set());
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [images, setImages] = useState<Attachment[]>([]);
  const [viewImages, setViewImages] = useState<Attachment[]>([]);
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<number, string>>({});
  const [detailImageUrls, setDetailImageUrls] = useState<Record<number, string>>({});
  const [formData, setFormData] = useState({
    machine_name: '',
    unit_name: '',
    location: '',
    cycle_days: 30,
    description: '',
  });

  useEffect(() => {
    loadPoints();
  }, []);

  const loadPoints = async () => {
    try {
      const response = await api.get('/lubrication/points');
      const pointsData = response.data.data;

      // Load thumbnail for each point and fetch as blob
      const newThumbnailUrls: Record<number, string> = {};

      const pointsWithThumbnails = await Promise.all(
        pointsData.map(async (point: LubricationPoint) => {
          try {
            const attachmentsResponse = await api.get(`/uploads/entity/lubrication_point/${point.id}`);
            const attachments = attachmentsResponse.data.data || [];

            if (attachments.length > 0) {
              const thumbnailUrl = attachments[0].url;

              // Fetch thumbnail as blob
              try {
                console.log('Fetching thumbnail for point:', point.id, thumbnailUrl);
                const blobResponse = await axios.get(`http://localhost:3001${thumbnailUrl}`, {
                  responseType: 'blob',
                  timeout: 10000
                });
                const objectUrl = URL.createObjectURL(blobResponse.data);
                newThumbnailUrls[point.id] = objectUrl;
                console.log('Successfully loaded thumbnail for point:', point.id);
              } catch (error) {
                console.error('Failed to load thumbnail for point:', point.id, error);
              }

              return { ...point, thumbnail: thumbnailUrl };
            }

            return { ...point, thumbnail: null };
          } catch {
            return { ...point, thumbnail: null };
          }
        })
      );

      setThumbnailUrls(newThumbnailUrls);
      setPoints(pointsWithThumbnails);
    } catch (error) {
      toast.error('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPoint) {
        await api.put(`/lubrication/points/${editingPoint.id}`, formData);
        toast.success('給油箇所を更新しました');
        setIsModalOpen(false);
        resetForm();
      } else {
        const response = await api.post('/lubrication/points', formData);
        const newPoint = response.data.data;
        setEditingPoint(newPoint);
        toast.success('給油箇所を追加しました。画像を追加できます。');
      }
      loadPoints();
    } catch (error: any) {
      toast.error(error.response?.data?.error || '保存に失敗しました');
    }
  };

  const handlePerform = async (pointId: number) => {
    if (!confirm('給油を実施しましたか？')) return;

    try {
      await api.post(`/lubrication/points/${pointId}/perform`, {});
      toast.success('給油を記録しました');
      loadPoints();
    } catch (error) {
      toast.error('記録に失敗しました');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この給油箇所を削除しますか？')) return;

    try {
      await api.delete(`/lubrication/points/${id}`);
      toast.success('削除しました');
      loadPoints();
    } catch (error) {
      toast.error('削除に失敗しました');
    }
  };

  const handleEdit = async (point: LubricationPoint) => {
    setEditingPoint(point);
    setFormData({
      machine_name: point.machine_name,
      unit_name: point.unit_name || '',
      location: point.location,
      cycle_days: point.cycle_days,
      description: point.description || '',
    });

    // Load images
    try {
      const response = await api.get(`/uploads/entity/lubrication_point/${point.id}`);
      setImages(response.data.data || []);
    } catch (error) {
      setImages([]);
    }

    setIsModalOpen(true);
  };

  const handleView = async (point: LubricationPoint) => {
    setViewingPoint(point);

    // Load images
    try {
      const response = await api.get(`/uploads/entity/lubrication_point/${point.id}`);
      setViewImages(response.data.data || []);
    } catch (error) {
      setViewImages([]);
    }

    setIsDetailModalOpen(true);
  };

  // Load detail images as blobs when detail modal is open
  useEffect(() => {
    const loadDetailImageUrls = async () => {
      if (!isDetailModalOpen || viewImages.length === 0) return;

      const newImageUrls: Record<number, string> = {};
      for (const image of viewImages) {
        if (image.mime_type?.startsWith('image/') && !detailImageUrls[image.id]) {
          try {
            const response = await axios.get(`http://localhost:3001${image.url}`, {
              responseType: 'blob',
              timeout: 10000,
            });
            const blob = response.data;
            const objectUrl = URL.createObjectURL(blob);
            newImageUrls[image.id] = objectUrl;
          } catch (error) {
            console.error('Failed to load detail image:', image.id, error);
          }
        }
      }

      if (Object.keys(newImageUrls).length > 0) {
        setDetailImageUrls(prev => ({ ...prev, ...newImageUrls }));
      }
    };

    loadDetailImageUrls();

    return () => {
      if (!isDetailModalOpen) {
        Object.values(detailImageUrls).forEach(url => {
          if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
        setDetailImageUrls({});
      }
    };
  }, [isDetailModalOpen, viewImages]);

  const resetForm = () => {
    setEditingPoint(null);
    setImages([]);
    setFormData({
      machine_name: '',
      unit_name: '',
      location: '',
      cycle_days: 30,
      description: '',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      overdue: 'badge-overdue',
      due_soon: 'badge-due-soon',
      upcoming: 'badge-upcoming',
      ok: 'badge-ok',
    };
    const labels = {
      overdue: '期限超過',
      due_soon: '3日以内',
      upcoming: '7日以内',
      ok: '正常',
    };
    return <span className={`badge ${badges[status as keyof typeof badges]}`}>{labels[status as keyof typeof labels]}</span>;
  };

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  // Get unique units for filtering
  const units = ['all', ...Array.from(new Set(points.map(p => p.unit_name).filter(Boolean)))];

  // Filter points by selected unit
  const filteredPoints = selectedUnit === 'all'
    ? points
    : points.filter(p => p.unit_name === selectedUnit);

  // Group points by machine
  const pointsByMachine = filteredPoints.reduce((acc, point) => {
    const machine = point.machine_name;
    if (!acc[machine]) acc[machine] = [];
    acc[machine].push(point);
    return acc;
  }, {} as Record<string, LubricationPoint[]>);

  // Toggle machine expansion
  const toggleMachine = (machineName: string) => {
    setExpandedMachines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(machineName)) {
        newSet.delete(machineName);
      } else {
        newSet.add(machineName);
      }
      return newSet;
    });
  };

  // Toggle unit expansion
  const toggleUnit = (machineUnit: string) => {
    setExpandedUnits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(machineUnit)) {
        newSet.delete(machineUnit);
      } else {
        newSet.add(machineUnit);
      }
      return newSet;
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">給油管理</h1>
        {isAdmin && (
          <Button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
          >
            <Plus size={20} className="mr-2" />
            給油箇所を追加
          </Button>
        )}
      </div>

      {/* Unit filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">ユニットで絞り込み</label>
        <select
          className="input max-w-xs"
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
        >
          <option value="all">すべて表示</option>
          {units.filter(u => u !== 'all').map(unit => (
            <option key={unit} value={unit}>{unit}</option>
          ))}
        </select>
      </div>

      {/* Display grouped by machine, then by unit */}
      {Object.entries(pointsByMachine).map(([machineName, machinePoints]) => {
        // Group points by unit within this machine
        const pointsByUnit = machinePoints.reduce((acc, point) => {
          const unit = point.unit_name || '未分類';
          if (!acc[unit]) acc[unit] = [];
          acc[unit].push(point);
          return acc;
        }, {} as Record<string, LubricationPoint[]>);

        return (
          <div key={machineName} className="mb-8">
            <div
              className="flex items-center gap-2 text-2xl font-semibold mb-4 text-gray-700 border-b-2 border-gray-300 pb-2 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => toggleMachine(machineName)}
            >
              {expandedMachines.has(machineName) ? (
                <ChevronDown size={28} />
              ) : (
                <ChevronRight size={28} />
              )}
              <h2>{machineName}</h2>
            </div>
            {expandedMachines.has(machineName) && (
              <div className="ml-8">
                {Object.entries(pointsByUnit).map(([unitName, unitPoints]) => {
                  const machineUnitKey = `${machineName}-${unitName}`;
                  return (
                    <div key={machineUnitKey} className="mb-6">
                      <div
                        className="flex items-center gap-2 text-xl font-semibold mb-3 text-gray-600 border-b border-gray-200 pb-2 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => toggleUnit(machineUnitKey)}
                      >
                        {expandedUnits.has(machineUnitKey) ? (
                          <ChevronDown size={24} />
                        ) : (
                          <ChevronRight size={24} />
                        )}
                        <h3>{unitName}</h3>
                      </div>
                      {expandedUnits.has(machineUnitKey) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {unitPoints.map((point) => (
          <Card
            key={point.id}
            onClick={() => handleView(point)}
            className="cursor-pointer hover:shadow-lg transition-shadow"
          >
            {point.thumbnail && (
              <div className="mb-3 rounded-lg overflow-hidden bg-gray-100">
                {thumbnailUrls[point.id] ? (
                  <img
                    src={thumbnailUrls[point.id]}
                    alt={point.location}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      console.error('Thumbnail render error for point:', point.id);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-blue-600 font-medium">{point.machine_name}</p>
                {point.unit_name && (
                  <h3 className="font-bold text-lg">{point.unit_name}</h3>
                )}
                <p className="text-gray-600">{point.location}</p>
              </div>
              {getStatusBadge(point.status)}
            </div>

            <div className="space-y-2 text-sm mb-4">
              <p>
                <span className="text-gray-600">周期:</span> {point.cycle_days}日
              </p>
              {point.last_performed && (
                <p>
                  <span className="text-gray-600">前回:</span>{' '}
                  {new Date(point.last_performed).toLocaleDateString()}
                </p>
              )}
              {point.next_due_date && (
                <p>
                  <span className="text-gray-600">次回:</span>{' '}
                  {new Date(point.next_due_date).toLocaleDateString()}
                  {point.days_until_due !== null && (
                    <span className="ml-2">
                      ({point.days_until_due >= 0 ? `${point.days_until_due}日後` : `${Math.abs(point.days_until_due)}日超過`})
                    </span>
                  )}
                </p>
              )}
            </div>

            {isAdmin && (
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="primary"
                  className="flex-1 text-sm"
                  onClick={() => handlePerform(point.id)}
                >
                  <Check size={16} className="mr-1" />
                  給油完了
                </Button>
                <Button
                  variant="secondary"
                  className="text-sm"
                  onClick={() => handleEdit(point)}
                >
                  <Edit size={16} />
                </Button>
                <Button
                  variant="danger"
                  className="text-sm"
                  onClick={() => handleDelete(point.id)}
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
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {filteredPoints.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-gray-500">給油箇所が登録されていません</p>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingPoint ? '給油箇所を編集' : '給油箇所を追加'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="機械名"
            value={formData.machine_name}
            onChange={(e) => setFormData({ ...formData, machine_name: e.target.value })}
            required
          />
          <Input
            label="ユニット名"
            value={formData.unit_name}
            onChange={(e) => setFormData({ ...formData, unit_name: e.target.value })}
            placeholder="例: ユニット1、ユニット2"
          />
          <Input
            label="給油箇所"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
          <Input
            label="周期（日数）"
            type="number"
            value={formData.cycle_days}
            onChange={(e) => setFormData({ ...formData, cycle_days: parseInt(e.target.value) })}
            required
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
          <ImageUpload
            entityType="lubrication_point"
            entityId={editingPoint?.id || null}
            images={images}
            onImagesChange={setImages}
          />
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

      {/* Detail View Modal (Read-only) */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingPoint(null);
          setViewImages([]);
        }}
        title="給油箇所の詳細"
      >
        {viewingPoint && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">機械名</label>
              <p className="text-gray-900">{viewingPoint.machine_name}</p>
            </div>
            {viewingPoint.unit_name && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ユニット名</label>
                <p className="text-gray-900">{viewingPoint.unit_name}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">給油箇所</label>
              <p className="text-gray-900">{viewingPoint.location}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">周期（日数）</label>
              <p className="text-gray-900">{viewingPoint.cycle_days}日</p>
            </div>
            {viewingPoint.last_performed && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">前回給油日</label>
                <p className="text-gray-900">{new Date(viewingPoint.last_performed).toLocaleDateString()}</p>
              </div>
            )}
            {viewingPoint.next_due_date && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">次回給油予定日</label>
                <p className="text-gray-900">
                  {new Date(viewingPoint.next_due_date).toLocaleDateString()}
                  {viewingPoint.days_until_due !== null && (
                    <span className="ml-2 text-sm text-gray-600">
                      ({viewingPoint.days_until_due >= 0 ? `${viewingPoint.days_until_due}日後` : `${Math.abs(viewingPoint.days_until_due)}日超過`})
                    </span>
                  )}
                </p>
              </div>
            )}
            {viewingPoint.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                <p className="text-gray-900 whitespace-pre-wrap">{viewingPoint.description}</p>
              </div>
            )}
            {viewImages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">画像</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {viewImages.map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        {detailImageUrls[image.id] ? (
                          <img
                            src={detailImageUrls[image.id]}
                            alt={image.file_name}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => window.open(detailImageUrls[image.id], '_blank')}
                            onError={(e) => {
                              console.error('Detail image render error:', image.id);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1 truncate" title={image.file_name}>
                        {image.file_name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setViewingPoint(null);
                  setViewImages([]);
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
