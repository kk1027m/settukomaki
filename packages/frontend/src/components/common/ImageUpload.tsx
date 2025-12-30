import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import axios from 'axios';

interface ImageUploadProps {
  entityType: 'lubrication_point' | 'replacement_schedule' | 'part' | 'maintenance_procedure' | 'topic';
  entityId: number | null;
  images: Attachment[];
  onImagesChange: (images: Attachment[]) => void;
  disabled?: boolean;
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

export function ImageUpload({ entityType, entityId, images, onImagesChange, disabled }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load images as blobs and create object URLs
  useEffect(() => {
    const loadImages = async () => {
      const newImageUrls: Record<number, string> = {};

      for (const image of images) {
        if (!imageUrls[image.id]) {
          try {
            console.log('Fetching image:', image.id, image.url);
            const response = await axios.get(`http://localhost:3001${image.url}`, {
              responseType: 'blob',
              timeout: 10000
            });
            const blob = response.data;
            const objectUrl = URL.createObjectURL(blob);
            newImageUrls[image.id] = objectUrl;
            console.log('Successfully loaded image:', image.id, 'Object URL:', objectUrl);
          } catch (error) {
            console.error('Failed to load image:', image.id, error);
          }
        }
      }

      if (Object.keys(newImageUrls).length > 0) {
        setImageUrls(prev => ({ ...prev, ...newImageUrls }));
      }
    };

    loadImages();

    // Cleanup: revoke object URLs when component unmounts
    return () => {
      Object.values(imageUrls).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [images]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!entityId) {
      toast.error('先に項目を保存してから画像をアップロードしてください');
      return;
    }

    setUploading(true);

    try {
      const file = files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('画像ファイルのみアップロード可能です');
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

      onImagesChange([...images, response.data.data]);
      toast.success('画像をアップロードしました');
    } catch (error: any) {
      toast.error(error.response?.data?.error || '画像のアップロードに失敗しました');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (imageId: number) => {
    if (!confirm('この画像を削除しますか？')) return;

    try {
      await api.delete(`/uploads/${imageId}`);
      onImagesChange(images.filter(img => img.id !== imageId));
      toast.success('画像を削除しました');
    } catch (error: any) {
      toast.error(error.response?.data?.error || '画像の削除に失敗しました');
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        画像 <span className="text-xs text-gray-500">（図面や写真）</span>
      </label>

      {/* Upload button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading || !entityId}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || !entityId}
          className="w-full sm:w-auto"
        >
          <Upload size={16} className="mr-2" />
          {uploading ? 'アップロード中...' : '画像を追加'}
        </Button>
        {!entityId && (
          <p className="text-xs text-gray-500 mt-1">
            ※ 画像は項目の保存後にアップロード可能です
          </p>
        )}
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                {imageUrls[image.id] ? (
                  <img
                    src={imageUrls[image.id]}
                    alt={image.file_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Image render error for:', image.id, imageUrls[image.id]);
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"%3EError%3C/text%3E%3C/svg%3E';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(image.id)}
                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={disabled}
              >
                <X size={14} />
              </button>
              <p className="text-xs text-gray-600 mt-1 truncate" title={image.file_name}>
                {image.file_name}
              </p>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
          <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">画像がありません</p>
        </div>
      )}
    </div>
  );
}
