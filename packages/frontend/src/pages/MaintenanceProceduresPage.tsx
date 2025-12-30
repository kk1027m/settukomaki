import { useEffect, useState, useRef } from 'react';
import { Plus, Edit, Trash2, Search, FileText, MessageCircle, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { FileUpload, Attachment } from '../components/common/FileUpload';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface MaintenanceProcedure {
  id: number;
  title: string;
  content: string;
  category: 'machine' | 'common';
  machine_name?: string;
  unit_name?: string;
  created_by: number;
  created_by_username: string;
  created_by_full_name: string;
  created_at: string;
  updated_at: string;
  comments?: Comment[];
}

interface Comment {
  id: number;
  procedure_id: number;
  content: string;
  commented_by: number;
  commented_by_username: string;
  commented_by_full_name: string;
  created_at: string;
  updated_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  machine: '機械別',
  common: '共通手順',
  unit: 'ユニット別', // 互換性のため残す
};

export default function MaintenanceProceduresPage() {
  const { isAdmin, user } = useAuth();
  const [procedures, setProcedures] = useState<MaintenanceProcedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<MaintenanceProcedure | null>(null);
  const [viewingProcedure, setViewingProcedure] = useState<MaintenanceProcedure | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterMachine, setFilterMachine] = useState<string>('');
  const [filterUnit, setFilterUnit] = useState<string>('');
  const [machineNames, setMachineNames] = useState<string[]>([]);
  const [unitNames, setUnitNames] = useState<string[]>([]);
  const [commentText, setCommentText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedMachines, setExpandedMachines] = useState<Set<string>>(new Set());
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'machine' as 'machine' | 'common',
    machine_name: '',
    unit_name: '',
  });

  useEffect(() => {
    loadProcedures();
    loadFilterOptions();
  }, []);

  const loadProcedures = async () => {
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.append('category', filterCategory);
      if (filterMachine) params.append('machine_name', filterMachine);
      if (filterUnit) params.append('unit_name', filterUnit);
      if (searchQuery) params.append('search', searchQuery);

      const response = await api.get(`/maintenance-procedures?${params.toString()}`);
      setProcedures(response.data.data);
    } catch (error) {
      toast.error('手順の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const [machinesRes, unitsRes] = await Promise.all([
        api.get('/maintenance-procedures/machines'),
        api.get('/maintenance-procedures/units'),
      ]);
      setMachineNames(machinesRes.data.data);
      setUnitNames(unitsRes.data.data);
    } catch (error) {
      console.error('Failed to load filter options', error);
    }
  };

  const loadAttachments = async (procedureId: number) => {
    try {
      const response = await api.get(`/uploads/entity/maintenance_procedure/${procedureId}`);
      setAttachments(response.data.data);
    } catch (error) {
      console.error('Failed to load attachments', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingProcedure) {
        await api.put(`/maintenance-procedures/${editingProcedure.id}`, formData);
        toast.success('手順を更新しました');
      } else {
        const response = await api.post('/maintenance-procedures', formData);
        const newProcedureId = response.data.data.id;

        // Upload pending files if any
        if (pendingFiles.length > 0) {
          for (const file of pendingFiles) {
            const fileFormData = new FormData();
            fileFormData.append('file', file);
            await api.post(`/uploads/maintenance_procedure/${newProcedureId}`, fileFormData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          }
          toast.success('手順とファイルを作成しました');
        } else {
          toast.success('手順を作成しました');
        }
      }
      setIsModalOpen(false);
      resetForm();
      loadProcedures();
    } catch (error: any) {
      toast.error(error.response?.data?.error || '保存に失敗しました');
    }
  };

  const handleEdit = async (procedure: MaintenanceProcedure) => {
    setEditingProcedure(procedure);
    setFormData({
      title: procedure.title,
      content: procedure.content,
      category: procedure.category,
      machine_name: procedure.machine_name || '',
      unit_name: procedure.unit_name || '',
    });
    await loadAttachments(procedure.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (procedureId: number) => {
    if (!confirm('この手順を削除しますか？')) return;

    try {
      await api.delete(`/maintenance-procedures/${procedureId}`);
      toast.success('手順を削除しました');
      loadProcedures();
    } catch (error: any) {
      toast.error(error.response?.data?.error || '削除に失敗しました');
    }
  };

  const handleView = async (procedure: MaintenanceProcedure) => {
    try {
      const response = await api.get(`/maintenance-procedures/${procedure.id}`);
      setViewingProcedure(response.data.data);
      await loadAttachments(procedure.id);
      setIsDetailModalOpen(true);
    } catch (error) {
      toast.error('手順の詳細取得に失敗しました');
    }
  };

  // Load images as blobs for detail modal
  useEffect(() => {
    const loadImageUrls = async () => {
      if (!isDetailModalOpen || attachments.length === 0) return;

      const newImageUrls: Record<number, string> = {};

      for (const attachment of attachments) {
        if (attachment.mime_type?.startsWith('image/') && !imageUrls[attachment.id]) {
          try {
            const response = await axios.get(`http://localhost:3001${attachment.url}`, {
              responseType: 'blob',
              timeout: 10000,
            });
            const blob = response.data;
            const objectUrl = URL.createObjectURL(blob);
            newImageUrls[attachment.id] = objectUrl;
          } catch (error) {
            console.error('Failed to load image:', attachment.id, error);
          }
        }
      }

      if (Object.keys(newImageUrls).length > 0) {
        setImageUrls(prev => ({ ...prev, ...newImageUrls }));
      }
    };

    loadImageUrls();

    // Cleanup: revoke object URLs when modal closes
    return () => {
      if (!isDetailModalOpen) {
        Object.values(imageUrls).forEach(url => {
          if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
        setImageUrls({});
      }
    };
  }, [isDetailModalOpen, attachments]);

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !viewingProcedure) return;

    try {
      await api.post(`/maintenance-procedures/${viewingProcedure.id}/comments`, {
        content: commentText,
      });
      setCommentText('');
      const response = await api.get(`/maintenance-procedures/${viewingProcedure.id}`);
      setViewingProcedure(response.data.data);
      toast.success('コメントを投稿しました');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'コメントの投稿に失敗しました');
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    if (!confirm('このコメントを削除しますか？')) return;

    try {
      await api.delete(`/maintenance-procedures/comments/${commentId}`);
      if (viewingProcedure) {
        const response = await api.get(`/maintenance-procedures/${viewingProcedure.id}`);
        setViewingProcedure(response.data.data);
      }
      toast.success('コメントを削除しました');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'コメントの削除に失敗しました');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'machine',
      machine_name: '',
      unit_name: '',
    });
    setEditingProcedure(null);
    setAttachments([]);
    setPendingFiles([]);
  };

  const handleSearch = () => {
    loadProcedures();
  };

  const handleFilterChange = () => {
    loadProcedures();
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

  const toggleMachine = (machine: string) => {
    setExpandedMachines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(machine)) {
        newSet.delete(machine);
      } else {
        newSet.add(machine);
      }
      return newSet;
    });
  };

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
        <h1 className="text-3xl font-bold">作業手順</h1>
        {isAdmin && (
          <Button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
          >
            <Plus size={20} className="mr-2" />
            新規作成
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="タイトルまたは内容で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch}>
              <Search size={20} className="mr-2" />
              検索
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} className="mr-2" />
              フィルター
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  カテゴリ
                </label>
                <select
                  className="input w-full"
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    handleFilterChange();
                  }}
                >
                  <option value="">すべて</option>
                  <option value="machine">機械別</option>
                  <option value="common">共通手順</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  機械名
                </label>
                <select
                  className="input w-full"
                  value={filterMachine}
                  onChange={(e) => {
                    setFilterMachine(e.target.value);
                    handleFilterChange();
                  }}
                  disabled={filterCategory !== '' && filterCategory !== 'machine'}
                >
                  <option value="">すべて</option>
                  {machineNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ユニット名
                </label>
                <select
                  className="input w-full"
                  value={filterUnit}
                  onChange={(e) => {
                    setFilterUnit(e.target.value);
                    handleFilterChange();
                  }}
                  disabled={filterCategory !== '' && filterCategory !== 'unit'}
                >
                  <option value="">すべて</option>
                  {unitNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Procedures list grouped by category */}
      <div className="space-y-6">
        {procedures.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-gray-500">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>手順がありません</p>
            </div>
          </Card>
        ) : (
          (() => {
            // Group procedures by machine name, then by unit name
            const proceduresByMachine = procedures.reduce((acc, procedure) => {
              const machineKey = procedure.category === 'common'
                ? '共通手順'
                : procedure.machine_name || '機械名未設定';
              if (!acc[machineKey]) acc[machineKey] = {};

              const unitKey = procedure.unit_name || 'ユニット未設定';
              if (!acc[machineKey][unitKey]) acc[machineKey][unitKey] = [];
              acc[machineKey][unitKey].push(procedure);
              return acc;
            }, {} as Record<string, Record<string, MaintenanceProcedure[]>>);

            return Object.entries(proceduresByMachine).map(([machineName, proceduresByUnit]) => {
              const totalProcedures = Object.values(proceduresByUnit).flat().length;
              return (
                <div key={machineName} className="mb-6">
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
                    <span className="text-sm text-gray-500 ml-2">({totalProcedures}件)</span>
                  </div>
                  {expandedMachines.has(machineName) && (
                    <div className="ml-6 space-y-6">
                      {Object.entries(proceduresByUnit).map(([unitName, unitProcedures]) => {
                        const machineUnitKey = `${machineName}-${unitName}`;
                        return (
                          <div key={machineUnitKey}>
                            <div
                              className="flex items-center gap-2 text-xl font-semibold mb-3 text-gray-600 border-b border-gray-200 pb-2 cursor-pointer hover:text-blue-500 transition-colors"
                              onClick={() => toggleUnit(machineUnitKey)}
                            >
                              {expandedUnits.has(machineUnitKey) ? (
                                <ChevronDown size={24} />
                              ) : (
                                <ChevronRight size={24} />
                              )}
                              <h3>{unitName}</h3>
                              <span className="text-sm text-gray-500 ml-2">({unitProcedures.length}件)</span>
                            </div>
                            {expandedUnits.has(machineUnitKey) && (
                              <div className="space-y-4">
                                {unitProcedures.map((procedure) => (
            <Card
              key={procedure.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleView(procedure)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {CATEGORY_LABELS[procedure.category]}
                    </span>
                    {procedure.machine_name && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {procedure.machine_name}
                      </span>
                    )}
                    {procedure.unit_name && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {procedure.unit_name}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {procedure.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      作成者: {procedure.created_by_full_name || procedure.created_by_username}
                    </span>
                    <span>作成日時: {formatDate(procedure.created_at)}</span>
                    {procedure.updated_at !== procedure.created_at && (
                      <span className="text-blue-600">
                        (編集済み: {formatDate(procedure.updated_at)})
                      </span>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEdit(procedure)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(procedure.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                )}
              </div>
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
            });
          })()
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingProcedure ? '手順を編集' : '新規手順作成'}
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
              カテゴリ
            </label>
            <select
              className="input w-full"
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as 'machine' | 'common',
                })
              }
              required
            >
              <option value="machine">機械別</option>
              <option value="common">共通手順</option>
            </select>
          </div>

          {formData.category === 'machine' && (
            <Input
              label="機械名"
              value={formData.machine_name}
              onChange={(e) =>
                setFormData({ ...formData, machine_name: e.target.value })
              }
              placeholder="例: コルゲータ、貼合機"
            />
          )}

          {(formData.category === 'machine' || formData.category === 'common') && (
            <Input
              label="ユニット名（オプション）"
              value={formData.unit_name}
              onChange={(e) =>
                setFormData({ ...formData, unit_name: e.target.value })
              }
              placeholder="例: モーターユニット、ベアリングユニット"
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              内容
            </label>
            <textarea
              className="input w-full min-h-[300px]"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              required
              placeholder="作業手順を入力してください"
            />
          </div>

          <FileUpload
            entityType="maintenance_procedure"
            entityId={editingProcedure?.id || null}
            files={attachments}
            onFilesChange={setAttachments}
            allowCreate={!editingProcedure}
            onPendingFilesChange={setPendingFiles}
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
            <Button type="submit">
              {editingProcedure ? '更新' : '作成'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingProcedure(null);
          setAttachments([]);
          setCommentText('');
        }}
        title="手順詳細"
      >
        {viewingProcedure && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {CATEGORY_LABELS[viewingProcedure.category]}
                </span>
                {viewingProcedure.machine_name && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {viewingProcedure.machine_name}
                  </span>
                )}
                {viewingProcedure.unit_name && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {viewingProcedure.unit_name}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {viewingProcedure.title}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 pb-4 border-b">
                <span>
                  作成者:{' '}
                  {viewingProcedure.created_by_full_name ||
                    viewingProcedure.created_by_username}
                </span>
                <span>作成日時: {formatDate(viewingProcedure.created_at)}</span>
                {viewingProcedure.updated_at !== viewingProcedure.created_at && (
                  <span className="text-blue-600">
                    (編集済み: {formatDate(viewingProcedure.updated_at)})
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">
                {viewingProcedure.content}
              </p>
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">添付ファイル</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="relative group">
                      {attachment.mime_type?.startsWith('image/') ? (
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                          {imageUrls[attachment.id] ? (
                            <img
                              src={imageUrls[attachment.id]}
                              alt={attachment.file_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                          )}
                        </div>
                      ) : attachment.mime_type === 'application/pdf' ? (
                        <a
                          href={`http://localhost:3001${attachment.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                          <div className="text-center">
                            <FileText size={48} className="text-red-500 mx-auto mb-2" />
                            <span className="text-xs text-gray-600">PDFを開く</span>
                          </div>
                        </a>
                      ) : (
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                          <FileText size={32} className="text-gray-400" />
                        </div>
                      )}
                      <p
                        className="text-xs text-gray-600 mt-1 truncate"
                        title={attachment.file_name}
                      >
                        {attachment.file_name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageCircle size={20} />
                コメント ({viewingProcedure.comments?.length || 0})
              </h3>

              {/* Comment input */}
              <div className="mb-4">
                <textarea
                  className="input w-full min-h-[80px]"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="コメントを入力..."
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    onClick={handleCommentSubmit}
                    disabled={!commentText.trim()}
                  >
                    コメントを投稿
                  </Button>
                </div>
              </div>

              {/* Comments list */}
              <div className="space-y-3">
                {viewingProcedure.comments && viewingProcedure.comments.length > 0 ? (
                  viewingProcedure.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-gray-50 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-900">
                            {comment.commented_by_full_name ||
                              comment.commented_by_username}
                          </span>
                          <span className="text-gray-500">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        {(isAdmin || comment.commented_by === user?.id) && (
                          <button
                            onClick={() => handleCommentDelete(comment.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            削除
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    まだコメントがありません
                  </p>
                )}
              </div>
            </div>

            {/* Close button */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setViewingProcedure(null);
                  setAttachments([]);
                  setCommentText('');
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
