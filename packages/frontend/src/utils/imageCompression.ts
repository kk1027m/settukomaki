/**
 * 画像を圧縮・リサイズする関数
 * @param file 圧縮する画像ファイル
 * @param maxWidth 最大幅（デフォルト: 1920px）
 * @param maxHeight 最大高さ（デフォルト: 1920px）
 * @param quality 圧縮品質 0-1（デフォルト: 0.8）
 * @returns 圧縮された画像ファイル
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // 元の画像サイズ
        let width = img.width;
        let height = img.height;
        
        // アスペクト比を維持しながらリサイズ
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        // Canvasで画像をリサイズ・圧縮
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        // 画像を描画
        ctx.drawImage(img, 0, 0, width, height);
        
        // Blobに変換
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            // 元のファイル名と拡張子を保持
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            console.log('Image compression:', {
              original: (file.size / 1024 / 1024).toFixed(2) + 'MB',
              compressed: (compressedFile.size / 1024 / 1024).toFixed(2) + 'MB',
              reduction: ((1 - compressedFile.size / file.size) * 100).toFixed(1) + '%'
            });
            
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * ファイルが画像かどうかをチェック
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * ファイルサイズをMB単位で取得
 */
export function getFileSizeMB(file: File): number {
  return file.size / 1024 / 1024;
}
