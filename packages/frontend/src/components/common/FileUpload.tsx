import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, FileText } from 'lucide-react';
import { Button } from './Button';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import axios from 'axios';

interface FileUploadProps {
  entityType: 'lubrication_point' | 'replacement_schedule' | 'part' | 'maintenance_procedure' | 'topic';
  entityId: number | null;
  files: Attachment[];
  onFilesChange: (files: Attachment[]) => void;
  disabled?: boolean;
  allowCreate?: boolean;
  onPendingFilesChange?: (files: File[]) => void;
}

export interface Attachment {
  id: number;
  file_name: string;
  url: string;
  mime_type?: string;
  file_size?: number;
  created_at?: string;
  objectUrl?: string;
}

export function FileUpload({ entityType, entityId, files, onFilesChange, disabled, allowCreate = false, onPendingFilesChange }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [fileUrls, setFileUrls] = useState<Record<number, string>>({});
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load files as blobs and create object URLs
  useEffect(() => {
    const loadFiles = async () => {
      const newFileUrls: Record<number, string> = {};

      for (const file of files) {
        if (!fileUrls[file.id] && file.mime_type?.startsWith('image/')) {
          try {
            console.log('Fetching file:', file.id, file.url);
            const response = await axios.get(`http://localhost:3001${file.url}`, {
              responseType: 'blob',
              timeout: 10000
            });
            const blob = response.data;
            const objectUrl = URL.createObjectURL(blob);
            newFileUrls[file.id] = objectUrl;
            console.log('Successfully loaded file:', file.id, 'Object URL:', objectUrl);
          } catch (error) {
            console.error('Failed to load file:', file.id, error);
          }
        }
      }

      if (Object.keys(newFileUrls).length > 0) {
        setFileUrls(prev => ({ ...prev, ...newFileUrls }));
      }
    };

    loadFiles();

    // Cleanup: revoke object URLs when component unmounts
    return () => {
      Object.values(fileUrls).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [files]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const file = selectedFiles[0];

    // If we can upload immediately (entityId exists)
    if (entityId) {
      await uploadFile(file);
    } else if (allowCreate) {
      // Store file for later upload after entity creation
      const newPendingFiles = [...pendingFiles, file];
      setPendingFiles(newPendingFiles);
      if (onPendingFilesChange) {
        onPendingFilesChange(newPendingFiles);
      }
      toast.success('ファイルを追加しました。保存後にアップロードされます。');
    } else {
      toast.error('先に項目を保存してからファイルをアップロードしてください');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);

    try {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error('画像ファイル（JPG、PNG）またはPDFファイルのみアップロード可能です');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ファイルサイズは5MB以下にしてください');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(
        `/uploads/${entityType}/${entityId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      onFilesChange([...files, response.data.data]);
      toast.success('ファイルをアップロードしました');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ファイルのアップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  // Upload all pending files (called after entity creation)
  const uploadPendingFiles = async (newEntityId: number) => {
    if (pendingFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of pendingFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post(
          `/uploads/${entityType}/${newEntityId}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        onFilesChange(prev => [...prev, response.data.data]);
      }
      setPendingFiles([]);
      toast.success('すべてのファイルをアップロードしました');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ファイルのアップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!confirm('このファイルを削除しますか？')) return;

    try {
      await api.delete(`/uploads/${fileId}`);
      onFilesChange(files.filter(f => f.id !== fileId));
      toast.success('ファイルを削除しました');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ファイルの削除に失敗しました');
    }
  };

  const removePendingFile = (index: number) => {
    const newPendingFiles = pendingFiles.filter((_, i) => i !== index);
    setPendingFiles(newPendingFiles);
    if (onPendingFilesChange) {
      onPendingFilesChange(newPendingFiles);
    }
    toast.success('ファイルを削除しました');
  };

  const getFileIcon = (mimeType?: string) => {
    if (mimeType?.startsWith('image/')) {
      return <ImageIcon size={32} className="text-gray-400" />;
    }
    if (mimeType === 'application/pdf') {
      return <FileText size={32} className="text-red-500" />;
    }
    return <FileText size={32} className="text-gray-400" />;
  };

  const canUpload = entityId || allowCreate;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        ファイル <span className="text-xs text-gray-500">（画像・PDF）</span>
      </label>

      {/* Upload button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading || !canUpload}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || !canUpload}
          className="w-full sm:w-auto"
        >
          <Upload size={16} className="mr-2" />
          {uploading ? 'アップロード中...' : 'ファイルを追加'}
        </Button>
        {!entityId && !allowCreate && (
          <p className="text-xs text-gray-500 mt-1">
            ※ ファイルは項目の保存後にアップロード可能です
          </p>
        )}
      </div>

      {/* Pending files (not yet uploaded) */}
      {pendingFiles.length > 0 && (
        <div className="border-t pt-3">
          <p className="text-sm font-medium text-gray-700 mb-2">アップロード待ちのファイル:</p>
          <div className="space-y-2">
            {pendingFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-yellow-50 p-2 rounded">
                <div className="flex items-center gap-2">
                  {file.type === 'application/pdf' ? (
                    <FileText size={20} className="text-red-500" />
                  ) : (
                    <ImageIcon size={20} className="text-gray-400" />
                  )}
                  <span className="text-sm text-gray-700">{file.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removePendingFile(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {files.map((file) => (
            <div key={file.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                {file.mime_type?.startsWith('image/') ? (
                  fileUrls[file.id] ? (
                    <img
                      src={fileUrls[file.id]}
                      alt={file.file_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Image render error for:', file.id, fileUrls[file.id]);
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"%3EError%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  )
                ) : (
                  <a
                    href={`http://localhost:3001${file.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    {getFileIcon(file.mime_type)}
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(file.id)}
                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={disabled}
              >
                <X size={14} />
              </button>
              <p className="text-xs text-gray-600 mt-1 truncate" title={file.file_name}>
                {file.file_name}
              </p>
            </div>
          ))}
        </div>
      )}

      {files.length === 0 && pendingFiles.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
          <FileText size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">ファイルがありません</p>
        </div>
      )}
    </div>
  );
}

// Expose uploadPendingFiles for external use
export type FileUploadHandle = {
  uploadPendingFiles: (entityId: number) => Promise<void>;
};
