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

interface ReplacementSchedule {
  id: number;
  machine_name: string;
  unit_name: string | null;
  part_name: string;
  part_number: string | null;
  cycle_days: number;
  description: string | null;
  last_replaced: string | null;
  next_due_date: string | null;
  days_until_due: number | null;
  status: 'overdue' | 'due_soon' | 'upcoming' | 'ok';
  thumbnail?: string | null;
}

export default function ReplacementPage() {
  const { isAdmin } = useAuth();
  const [schedules, setSchedules] = useState<ReplacementSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ReplacementSchedule | null>(null);
  const [viewingSchedule, setViewingSchedule] = useState<ReplacementSchedule | null>(null);
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
    part_name: '',
    part_number: '',
    cycle_days: 90,
    description: '',
  });

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const response = await api.get('/replacements/schedules');
      const schedulesData = response.data.data;

      // Load thumbnail for each schedule and fetch as blob
      const newThumbnailUrls: Record<number, string> = {};

      const schedulesWithThumbnails = await Promise.all(
        schedulesData.map(async (schedule: ReplacementSchedule) => {
          try {
            const attachmentsResponse = await api.get(`/uploads/entity/replacement_schedule/${schedule.id}`);
            const attachments = attachmentsResponse.data.data || [];

            if (attachments.length > 0) {
              const thumbnailUrl = attachments[0].url;

              // Fetch thumbnail as blob
              try {
                console.log('Fetching thumbnail for schedule:', schedule.id, thumbnailUrl);
                const blobResponse = await axios.get(`http://localhost:3001${thumbnailUrl}`, {
                  responseType: 'blob',
                  timeout: 10000
                });
                const objectUrl = URL.createObjectURL(blobResponse.data);
                newThumbnailUrls[schedule.id] = objectUrl;
                console.log('Successfully loaded thumbnail for schedule:', schedule.id);
              } catch (error) {
                console.error('Failed to load thumbnail for schedule:', schedule.id, error);
              }

              return { ...schedule, thumbnail: thumbnailUrl };
            }

            return { ...schedule, thumbnail: null };
          } catch {
            return { ...schedule, thumbnail: null };
          }
        })
      );

      setThumbnailUrls(newThumbnailUrls);
      setSchedules(schedulesWithThumbnails);
    } catch (error) {
      toast.error('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSchedule) {
        await api.put(`/replacements/schedules/${editingSchedule.id}`, formData);
        toast.success('交換予定を更新しました');
        setIsModalOpen(false);
        resetForm();
      } else {
        const response = await api.post('/replacements/schedules', formData);
        const newSchedule = response.data.data;
        setEditingSchedule(newSchedule);
        toast.success('交換予定を追加しました。画像を追加できます。');
      }
      loadSchedules();
    } catch (error: any) {
      toast.error(error.response?.data?.error || '保存に失敗しました');
    }
  };

  const handlePerform = async (scheduleId: number) => {
    if (!confirm('部品を交換しましたか？')) return;

    try {
      await api.post(`/replacements/schedules/${scheduleId}/perform`, {});
      toast.success('交換を記録しました');
      loadSchedules();
    } catch (error) {
      toast.error('記録に失敗しました');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この交換予定を削除しますか？')) return;

    try {
      await api.delete(`/replacements/schedules/${id}`);
      toast.success('削除しました');
      loadSchedules();
    } catch (error) {
      toast.error('削除に失敗しました');
    }
  };

  const handleEdit = async (schedule: ReplacementSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      machine_name: schedule.machine_name,
      unit_name: schedule.unit_name || '',
      part_name: schedule.part_name,
      part_number: schedule.part_number || '',
      cycle_days: schedule.cycle_days,
      description: schedule.description || '',
    });

    // Load images
    try {
      const response = await api.get(`/uploads/entity/replacement_schedule/${schedule.id}`);
      setImages(response.data.data || []);
    } catch (error) {
      setImages([]);
    }

    setIsModalOpen(true);
  };

  const handleView = async (schedule: ReplacementSchedule) => {
    setViewingSchedule(schedule);

    // Load images
    try {
      const response = await api.get(`/uploads/entity/replacement_schedule/${schedule.id}`);
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
    setEditingSchedule(null);
    setImages([]);
    setFormData({
      machine_name: '',
      unit_name: '',
      part_name: '',
      part_number: '',
      cycle_days: 90,
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
      due_soon: '7日以内',
      upcoming: '14日以内',
      ok: '正常',
    };
    return <span className={`badge ${badges[status as keyof typeof badges]}`}>{labels[status as keyof typeof labels]}</span>;
  };

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  // Get unique units for filtering
  const units = ['all', ...Array.from(new Set(schedules.map(s => s.unit_name).filter(Boolean)))];

  // Filter schedules by selected unit
  const filteredSchedules = selectedUnit === 'all'
    ? schedules
    : schedules.filter(s => s.unit_name === selectedUnit);

  // Group schedules by machine
  const schedulesByMachine = filteredSchedules.reduce((acc, schedule) => {
    const machine = schedule.machine_name;
    if (!acc[machine]) acc[machine] = [];
    acc[machine].push(schedule);
    return acc;
  }, {} as Record<string, ReplacementSchedule[]>);

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
        <h1 className="text-3xl font-bold">部品交換管理</h1>
        {isAdmin && (
          <Button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
          >
            <Plus size={20} className="mr-2" />
            交換予定を追加
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
      {Object.entries(schedulesByMachine).map(([machineName, machineSchedules]) => {
        // Group schedules by unit within this machine
        const schedulesByUnit = machineSchedules.reduce((acc, schedule) => {
          const unit = schedule.unit_name || '未分類';
          if (!acc[unit]) acc[unit] = [];
          acc[unit].push(schedule);
          return acc;
        }, {} as Record<string, ReplacementSchedule[]>);

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
                {Object.entries(schedulesByUnit).map(([unitName, unitSchedules]) => {
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
                          {unitSchedules.map((schedule) => (
          <Card
            key={schedule.id}
            onClick={() => handleView(schedule)}
            className="cursor-pointer hover:shadow-lg transition-shadow"
          >
            {schedule.thumbnail && (
              <div className="mb-3 rounded-lg overflow-hidden bg-gray-100">
                {thumbnailUrls[schedule.id] ? (
                  <img
                    src={thumbnailUrls[schedule.id]}
                    alt={schedule.part_name}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      console.error('Thumbnail render error for schedule:', schedule.id);
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
                <p className="text-xs text-blue-600 font-medium">{schedule.machine_name}</p>
                {schedule.unit_name && (
                  <h3 className="font-bold text-lg">{schedule.unit_name}</h3>
                )}
                <p className="text-gray-600">{schedule.part_name}</p>
                {schedule.part_number && (
                  <p className="text-xs text-gray-500">型番: {schedule.part_number}</p>
                )}
              </div>
              {getStatusBadge(schedule.status)}
            </div>

            <div className="space-y-2 text-sm mb-4">
              <p>
                <span className="text-gray-600">交換周期:</span> {schedule.cycle_days}日
              </p>
              {schedule.last_replaced && (
                <p>
                  <span className="text-gray-600">前回:</span>{' '}
                  {new Date(schedule.last_replaced).toLocaleDateString()}
                </p>
              )}
              {schedule.next_due_date && (
                <p>
                  <span className="text-gray-600">次回:</span>{' '}
                  {new Date(schedule.next_due_date).toLocaleDateString()}
                  {schedule.days_until_due !== null && (
                    <span className="ml-2">
                      ({schedule.days_until_due >= 0 ? `${schedule.days_until_due}日後` : `${Math.abs(schedule.days_until_due)}日超過`})
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
                  onClick={() => handlePerform(schedule.id)}
                >
                  <Check size={16} className="mr-1" />
                  交換完了
                </Button>
                <Button
                  variant="secondary"
                  className="text-sm"
                  onClick={() => handleEdit(schedule)}
                >
                  <Edit size={16} />
                </Button>
                <Button
                  variant="danger"
                  className="text-sm"
                  onClick={() => handleDelete(schedule.id)}
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

      {filteredSchedules.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-gray-500">交換予定が登録されていません</p>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingSchedule ? '交換予定を編集' : '交換予定を追加'}
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
            label="部品名"
            value={formData.part_name}
            onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
            required
          />
          <Input
            label="部品型番"
            value={formData.part_number}
            onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
            placeholder="任意"
          />
          <Input
            label="交換周期（日数）"
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
            entityType="replacement_schedule"
            entityId={editingSchedule?.id || null}
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
          setViewingSchedule(null);
          setViewImages([]);
        }}
        title="交換予定の詳細"
      >
        {viewingSchedule && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">機械名</label>
              <p className="text-gray-900">{viewingSchedule.machine_name}</p>
            </div>
            {viewingSchedule.unit_name && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ユニット名</label>
                <p className="text-gray-900">{viewingSchedule.unit_name}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">部品名</label>
              <p className="text-gray-900">{viewingSchedule.part_name}</p>
            </div>
            {viewingSchedule.part_number && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">部品型番</label>
                <p className="text-gray-900">{viewingSchedule.part_number}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">交換周期（日数）</label>
              <p className="text-gray-900">{viewingSchedule.cycle_days}日</p>
            </div>
            {viewingSchedule.last_replaced && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">前回交換日</label>
                <p className="text-gray-900">{new Date(viewingSchedule.last_replaced).toLocaleDateString()}</p>
              </div>
            )}
            {viewingSchedule.next_due_date && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">次回交換予定日</label>
                <p className="text-gray-900">
                  {new Date(viewingSchedule.next_due_date).toLocaleDateString()}
                  {viewingSchedule.days_until_due !== null && (
                    <span className="ml-2 text-sm text-gray-600">
                      ({viewingSchedule.days_until_due >= 0 ? `${viewingSchedule.days_until_due}日後` : `${Math.abs(viewingSchedule.days_until_due)}日超過`})
                    </span>
                  )}
                </p>
              </div>
            )}
            {viewingSchedule.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                <p className="text-gray-900 whitespace-pre-wrap">{viewingSchedule.description}</p>
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
                  setViewingSchedule(null);
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
