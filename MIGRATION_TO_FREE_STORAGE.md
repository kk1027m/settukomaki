# 完全無料ストレージへの移行手順

このガイドでは、Vercelバックエンドから **Cloudinary（画像）+ Supabase（DB）** に移行し、完全無料で運用する方法を説明します。

**所要時間**: 1～1.5時間
**費用**: 完全無料（クレジットカード不要）

---

## 📋 事前準備（5分）

### 1. アカウント登録

以下の2つのサービスに無料アカウントを作成してください：

#### Cloudinary（画像ストレージ）
1. https://cloudinary.com/ にアクセス
2. **Sign Up for Free** をクリック
3. メールアドレスで登録
4. ログイン後、**Dashboard** に移動
5. 以下の情報をメモ：
   - **Cloud Name**: `dxxxxxxxxx` のような文字列
   - **API Key**: 数字の羅列
   - **API Secret**: 英数字の文字列

#### Supabase（データベース）
1. https://supabase.com/ にアクセス
2. **Start your project** をクリック
3. GitHubアカウントでサインアップ
4. **New Project** をクリック
   - Name: `sets-carton-maintenance`
   - Database Password: 強力なパスワードを設定（メモする）
   - Region: Northeast Asia (Tokyo)
   - **Create new project** をクリック（数分かかります）
5. プロジェクトが作成されたら、**Settings** → **Database** に移動
6. **Connection string** の **URI** タブをクリック
7. 表示された接続文字列をメモ（`postgresql://postgres:[PASSWORD]@...`）

---

## 🗄️ STEP 1: Supabaseデータベース移行（20分）

### 1.1 データベーススキーマのエクスポート

```bash
cd C:/Users/user/Desktop/sets-carton-maintenance/packages/backend

# 現在のデータベーススキーマを確認
# schema.sqlファイルを確認
```

### 1.2 Supabaseにスキーマをインポート

1. Supabaseダッシュボードで **SQL Editor** を開く
2. **+ New query** をクリック
3. `packages/backend/src/database/schema.sql` の内容をコピー＆ペースト
4. **Run** をクリック
5. エラーがないか確認

### 1.3 初期データ（シード）のインポート

1. SQL Editorで新しいクエリを作成
2. `packages/backend/src/database/seed.sql` の内容をコピー＆ペースト
3. **Run** をクリック

### 1.4 バックエンドの環境変数を更新

```bash
cd packages/backend
```

`.env` ファイルを編集：

```env
# Supabaseの接続文字列に置き換え
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres

# 既存の設定
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=https://settukomaki-frontend.vercel.app
NODE_ENV=production
```

### 1.5 Vercelバックエンドの環境変数を更新

1. https://vercel.com/ にアクセス
2. `settukomaki-backend` プロジェクトを開く
3. **Settings** → **Environment Variables**
4. `DATABASE_URL` を探して **Edit**
5. Supabaseの接続文字列に変更
6. **Save**

---

## 📸 STEP 2: Cloudinary画像ストレージ統合（45分）

### 2.1 Cloudinary SDKのインストール

```bash
cd packages/backend
npm install cloudinary multer-storage-cloudinary
```

### 2.2 Cloudinary設定ファイルの作成

`packages/backend/src/config/cloudinary.ts` を作成：

```typescript
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sets-carton-maintenance',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    transformation: [{ width: 1920, height: 1920, crop: 'limit' }],
  } as any,
});

export default cloudinary;
```

### 2.3 アップロードハンドラーの更新

`packages/backend/src/middleware/uploadHandler.ts` を編集：

**変更前:**
```typescript
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storageConfig } from '../config/storage';

// 既存のローカルストレージ設定...
```

**変更後:**
```typescript
import multer from 'multer';
import { storage } from '../config/cloudinary';

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and PDF are allowed.'));
    }
  },
});
```

### 2.4 アップロードコントローラーの更新

`packages/backend/src/controllers/uploadController.ts` を編集：

**uploadFile関数を変更:**
```typescript
export const uploadFile = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { entity_type, entity_id } = req.params;

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    // Validate entity_type
    if (!['lubrication_point', 'replacement_schedule', 'part', 'maintenance_procedure', 'topic'].includes(entity_type)) {
      throw new AppError('Invalid entity type', 400);
    }

    // Cloudinaryの場合、req.fileの構造が異なる
    const fileName = req.file.originalname;
    const cloudinaryUrl = (req.file as any).path; // CloudinaryのURL
    const publicId = (req.file as any).filename; // Cloudinary Public ID

    // Insert attachment record
    const result = await query(
      `INSERT INTO attachments (entity_type, entity_id, file_name, file_path, file_size, mime_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        entity_type,
        entity_id,
        fileName,
        cloudinaryUrl, // CloudinaryのURLを保存
        req.file.size,
        req.file.mimetype,
        req.user?.id,
      ]
    );

    const attachment = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        ...attachment,
        url: cloudinaryUrl, // 直接CloudinaryのURLを返す
      },
    });
  } catch (error) {
    next(error);
  }
};
```

**getFile関数を変更:**
```typescript
export const getFile = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM attachments WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('File not found', 404);
    }

    const attachment = result.rows[0];

    // CloudinaryのURLにリダイレクト
    res.redirect(attachment.file_path);
  } catch (error) {
    next(error);
  }
};
```

**deleteFile関数を変更:**
```typescript
import cloudinary from '../config/cloudinary';

export const deleteFile = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM attachments WHERE id = $1 RETURNING file_path',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('File not found', 404);
    }

    const cloudinaryUrl = result.rows[0].file_path;

    // CloudinaryのURLからPublic IDを抽出
    // 例: https://res.cloudinary.com/xxx/image/upload/v123/sets-carton-maintenance/abc.jpg
    // → sets-carton-maintenance/abc
    const urlParts = cloudinaryUrl.split('/');
    const filename = urlParts[urlParts.length - 1].split('.')[0];
    const folder = urlParts[urlParts.length - 2];
    const publicId = `${folder}/${filename}`;

    // Cloudinaryから削除
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.warn('Failed to delete from Cloudinary:', err);
    }

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
```

### 2.5 バックエンドの環境変数を更新

`packages/backend/.env` に追加：

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 2.6 Vercelバックエンドの環境変数を更新

1. Vercelダッシュボード → `settukomaki-backend`
2. **Settings** → **Environment Variables**
3. 以下を追加（3つすべての環境にチェック）：
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

---

## 🎨 STEP 3: フロントエンドの更新（10分）

### 3.1 画像URL処理の更新

フロントエンドでは、画像URLが既にCloudinaryの完全なURLになっているため、特に変更は不要です。

ただし、念のため確認：

`packages/frontend/src/components/common/ImageUpload.tsx` の40-46行目あたり：

```typescript
// CloudinaryのURLは直接使えるので、API_URLを付ける必要がない
const response = await axios.get(image.url, {  // ${API_URL}は不要
  responseType: 'blob',
  timeout: 10000
});
```

**しかし**、現在のコードは `${API_URL}${attachment.url}` の形式なので、これを調整する必要があります。

#### 修正方法

`ImageUpload.tsx`, `FileUpload.tsx`, `LubricationPage.tsx`, `ReplacementPage.tsx`, `MaintenanceProceduresPage.tsx` の画像読み込み部分を修正：

**変更前:**
```typescript
const response = await axios.get(`${API_URL}${image.url}`, {
  responseType: 'blob',
  timeout: 10000
});
```

**変更後:**
```typescript
// URLが完全なURL（http/httpsで始まる）かチェック
const imageUrl = image.url.startsWith('http')
  ? image.url  // Cloudinaryの完全なURL
  : `${API_URL}${image.url}`;  // 古いローカルファイルの場合

const response = await axios.get(imageUrl, {
  responseType: 'blob',
  timeout: 10000
});
```

---

## 🚀 STEP 4: デプロイとテスト（10分）

### 4.1 バックエンドをデプロイ

```bash
cd packages/backend
git add .
git commit -m "Migrate to Cloudinary and Supabase"
git push origin main
```

Vercelで自動デプロイが開始されます。

### 4.2 フロントエンドをデプロイ

```bash
cd packages/frontend
git add .
git commit -m "Update image URL handling for Cloudinary"
git push origin main
```

### 4.3 動作確認

1. https://settukomaki-frontend.vercel.app にアクセス
2. ログイン
3. 新しい画像をアップロード
4. 画像が表示されるか確認
5. ページをリロードして、画像がまだ表示されるか確認

---

## ✅ チェックリスト

移行が完了したか確認：

- [ ] Cloudinaryアカウント作成完了
- [ ] Supabaseアカウント作成完了
- [ ] Supabaseにスキーマとシードデータをインポート
- [ ] バックエンドにCloudinary SDKをインストール
- [ ] バックエンドのコード変更完了
- [ ] 環境変数の設定完了（ローカルとVercel）
- [ ] フロントエンドのコード変更完了
- [ ] デプロイ完了
- [ ] 画像アップロード・表示のテスト成功

---

## 🎉 完了！

これで完全無料で画像アップロードと表示ができるようになりました！

### 今後のメンテナンス

- **Cloudinary**: 月10GBまで無料（10人で3か月なら十分）
- **Supabase**: データベース500MB、ストレージ1GB無料（永続的）
- **課金の心配**: なし（無料枠を超えたら警告が来るだけ）

### トラブルシューティング

#### 画像がアップロードできない
1. Cloudinaryの環境変数が正しいか確認
2. Vercelのログを確認（Dashboard → Logs）

#### 画像が表示されない
1. ブラウザの開発者ツールでネットワークエラーを確認
2. Cloudinaryのダッシュボードでファイルがアップロードされているか確認

#### データベース接続エラー
1. Supabaseの接続文字列が正しいか確認
2. Supabaseプロジェクトがアクティブか確認（ダッシュボードで確認）

---

## 📞 サポート

問題が発生したら、以下を確認してください：
- Vercelのデプロイログ
- ブラウザの開発者ツール（Console、Network）
- Cloudinaryのダッシュボード（アップロードされたファイル）
- Supabaseのログ（Logs & Reports）
