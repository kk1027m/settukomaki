# Vercel + Fly.io 無料デプロイ手順

このガイドでは、セッツカートン製造用アプリを **Vercel（フロントエンド）+ Fly.io（バックエンド + DB）** で無料デプロイする方法を説明します。

## 前提条件

1. **GitHubアカウント** - コードをホスト
2. **Vercelアカウント（無料）** - https://vercel.com/
3. **Fly.ioアカウント（無料）** - https://fly.io/
4. **flyctl CLI** - Fly.ioのコマンドラインツール

## ステップ1: Fly.io CLIのインストール

### Windows (PowerShell)
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

### 確認
```bash
flyctl version
```

## ステップ2: Fly.ioにログイン

```bash
flyctl auth login
```

ブラウザが開くので、GitHubアカウントでログインしてください。

## ステップ3: PostgreSQLデータベースを作成

```bash
cd packages/backend
flyctl postgres create --name sets-carton-db --region nrt
```

- **リージョン**: `nrt` (東京) を選択
- **構成**: Developmentを選択（無料枠）
- **VM size**: shared-cpu-1x を選択
- **Volume size**: 1GB を選択

データベースの接続情報が表示されるので、**必ずメモしてください**。

## ステップ4: バックエンドアプリを作成

```bash
# packages/backend ディレクトリにいることを確認
flyctl launch

# 質問に答える:
# - App name: sets-carton-backend (または任意の名前)
# - Region: Tokyo, Japan (nrt)
# - PostgreSQL: No (既に作成済み)
# - Deploy now: No (環境変数を設定してから)
```

## ステップ5: データベースを接続

```bash
flyctl postgres attach sets-carton-db --app sets-carton-backend
```

これで `DATABASE_URL` 環境変数が自動的に設定されます。

## ステップ6: バックエンドの環境変数を設定

```bash
# JWT Secret (ランダムな文字列を生成)
flyctl secrets set JWT_SECRET="your-super-secret-jwt-key-here" --app sets-carton-backend

# CORS設定（後でVercelのURLに更新します）
flyctl secrets set CORS_ORIGIN="*" --app sets-carton-backend

# 環境
flyctl secrets set NODE_ENV="production" --app sets-carton-backend
```

## ステップ7: データベースマイグレーション

```bash
# ローカルでマイグレーションスクリプトを実行
# まず、DATABASE_URLを一時的に設定
flyctl proxy 5432 -a sets-carton-db

# 別のターミナルで:
export DATABASE_URL="postgres://postgres:PASSWORD@localhost:5432/sets_carton_maintenance"
npm run migrate
npm run seed
```

または、バックエンドデプロイ後にFly.io上で実行:
```bash
flyctl ssh console -a sets-carton-backend
cd /app
npm run migrate
npm run seed
exit
```

## ステップ8: バックエンドをデプロイ

```bash
flyctl deploy --app sets-carton-backend
```

デプロイ完了後、URLが表示されます（例: `https://sets-carton-backend.fly.dev`）

### 動作確認
```bash
curl https://sets-carton-backend.fly.dev/health
```

## ステップ9: Vercelにフロントエンドをデプロイ

### 9.1 Vercelにログイン

1. https://vercel.com/ にアクセス
2. GitHubアカウントでサインアップ/ログイン

### 9.2 プロジェクトをインポート

1. **New Project** をクリック
2. GitHubリポジトリ `kk1027m/settukomaki` を選択
3. **Import** をクリック

### 9.3 ビルド設定

- **Framework Preset**: Vite
- **Root Directory**: `packages/frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 9.4 環境変数を設定

- **VITE_API_URL**: `https://sets-carton-backend.fly.dev` (Fly.ioのバックエンドURL)

### 9.5 デプロイ

**Deploy** をクリック

デプロイ完了後、URLが表示されます（例: `https://sets-carton.vercel.app`）

## ステップ10: CORS設定を更新

バックエンドのCORS設定をVercelのURLに更新:

```bash
flyctl secrets set CORS_ORIGIN="https://sets-carton.vercel.app" --app sets-carton-backend
```

## ステップ11: 動作確認

1. Vercelの URL（例: https://sets-carton.vercel.app）にアクセス
2. 初期ユーザーでログイン:
   - **管理者**: `admin` / `admin123`
   - **一般ユーザー**: `user1` / `user123`
3. スマホからもアクセスしてみてください！

## PWAとしてホーム画面に追加

### iPhone/iPad
1. Safariでアプリを開く
2. 共有ボタン（□↑）をタップ
3. 「ホーム画面に追加」をタップ

### Android
1. Chromeでアプリを開く
2. メニュー（⋮）をタップ
3. 「ホーム画面に追加」をタップ

## トラブルシューティング

### バックエンドが起動しない

```bash
# ログを確認
flyctl logs -a sets-carton-backend

# マシンの状態を確認
flyctl status -a sets-carton-backend
```

### データベース接続エラー

```bash
# データベースの状態を確認
flyctl postgres list
flyctl postgres connect -a sets-carton-db
```

### フロントエンドがバックエンドに接続できない

1. CORS設定を確認
2. VITE_API_URL が正しいか確認（Vercelの環境変数）
3. バックエンドのヘルスチェックが成功するか確認

## コストについて

### Fly.io 無料枠
- **Compute**: 3 shared-cpu-1x VMs (月2,340時間分)
- **RAM**: 各VM 256MB
- **Storage**: 3GB 永続ボリューム
- **帯域幅**: 月160GB

このアプリは無料枠内で十分動作します！

### Vercel 無料枠
- **帯域幅**: 月100GB
- **ビルド時間**: 無制限
- **デプロイ**: 無制限

## 更新方法

### コードを更新したとき

1. ローカルで開発・テスト
2. Git コミット & プッシュ
3. Vercel: 自動デプロイ（GitHubプッシュで自動）
4. Fly.io: 手動デプロイ
   ```bash
   cd packages/backend
   flyctl deploy --app sets-carton-backend
   ```

## サポート

問題が発生した場合は、ログを確認してください:

- **Fly.io**: `flyctl logs -a sets-carton-backend`
- **Vercel**: Vercelダッシュボード → プロジェクト → Logs
