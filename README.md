# セッツカートン製造用アプリ

給油管理と部品在庫管理を統合した設備メンテナンス管理システム

## 機能

### 1. 給油管理
- 給油箇所と周期の登録・編集・削除
- 周期が近づいたらプッシュ通知
- 図面や画像の添付
- 給油実施後の周期自動リセット
- アラート表示（期限超過、3日以内、7日以内、14日以内）

### 2. 部品在庫管理
- 部品情報の登録（部品名、在庫数、発注数）
- 図面や画像の添付
- 在庫調整（入庫・出庫）
- 在庫不足アラート
- 発注依頼通知（管理者へ）

### 3. ユーザー管理
- 複数ユーザー対応
- 権限管理（管理者・一般ユーザー）
- JWT認証

## 技術スタック

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (開発用) / PostgreSQL (本番用)
- **Authentication**: JWT
- **Notifications**: Web Push API

## セットアップ

### 必要な環境

- Node.js 20以上
- PostgreSQL 15以上
- Git

### 1. 依存関係のインストール

```bash
cd C:\Users\user\Desktop\sets-carton-maintenance
npm install
```

### 2. PostgreSQLデータベースの作成

1. **pgAdmin** または **psql** を使用してデータベースを作成:

```bash
# psqlの場合
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
CREATE DATABASE sets_carton_maintenance;
\q
```

または **pgAdmin** で:
- PostgreSQL 18 → Databases を右クリック
- Create → Database...
- Database名: `sets_carton_maintenance`
- Save

### 3. 環境変数の設定

Backend の `.env` ファイルを編集:

```bash
# packages/backend/.env を開いて、PostgreSQLのパスワードを設定
DB_PASSWORD=あなたのPostgreSQLパスワード
```

### 4. データベースのマイグレーションとシード

```bash
cd packages/backend
npm run migrate
npm run seed
```

### 5. 開発サーバーの起動

**方法1: 一括起動（推奨）**

ルートディレクトリで:
```bash
npm run dev
```

**方法2: 個別起動**

ターミナル1（Backend）:
```bash
cd packages/backend
npm run dev
```

ターミナル2（Frontend）:
```bash
cd packages/frontend
npm run dev
```

## アクセス

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 初期ユーザー

- **管理者**
  - Username: `admin`
  - Password: `admin123`

- **一般ユーザー**
  - Username: `user1`
  - Password: `user123`

## トラブルシューティング

### データベース接続エラーが出る場合

1. PostgreSQLが起動しているか確認
2. `packages/backend/.env` のDB_PASSWORDが正しいか確認
3. データベース `sets_carton_maintenance` が作成されているか確認

### ポートが使用中のエラーが出る場合

- Backend（3001）またはFrontend（5173）のポートが既に使われている場合、他のアプリを終了してください

### npm install でエラーが出る場合

- Node.js 20以上がインストールされているか確認してください

## プロジェクト構造

```
sets-carton-maintenance/
├── packages/
│   ├── shared/          # 共有型定義・ユーティリティ
│   ├── backend/         # Node.js + Express API
│   └── frontend/        # React SPA
├── package.json         # ルートpackage.json
└── README.md
```

## ライセンス

MIT
