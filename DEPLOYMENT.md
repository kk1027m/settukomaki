# Render への無料デプロイ手順

このガイドでは、セッツカートン製造用アプリをRenderに無料でデプロイする方法を説明します。

## 前提条件

1. GitHubアカウント
2. Renderアカウント（無料）: https://render.com/

## ステップ1: GitHubにコードをプッシュ

まず、このプロジェクトをGitHubリポジトリにプッシュする必要があります。

```bash
cd /c/Users/user/Desktop/sets-carton-maintenance

# Gitリポジトリを初期化（まだの場合）
git init

# .gitignoreに環境変数ファイルを追加（既に追加済みの場合はスキップ）
echo "node_modules/" >> .gitignore
echo ".env" >> .gitignore
echo "*.log" >> .gitignore

# 変更をコミット
git add .
git commit -m "Initial commit for Render deployment"

# GitHubリポジトリを作成し、リモートを追加
# (GitHubで新しいリポジトリを作成してから実行)
git remote add origin https://github.com/YOUR_USERNAME/sets-carton-maintenance.git
git branch -M main
git push -u origin main
```

## ステップ2: Renderでプロジェクトをセットアップ

### 2.1 Renderにログイン

1. https://render.com にアクセス
2. GitHubアカウントで登録/ログイン

### 2.2 Blueprint からデプロイ

1. Renderダッシュボードで **"New +"** → **"Blueprint"** をクリック
2. GitHubリポジトリを接続
3. `sets-carton-maintenance` リポジトリを選択
4. `render.yaml` が自動的に検出されます
5. **"Apply"** をクリック

これで以下のサービスが自動的に作成されます：
- PostgreSQLデータベース
- バックエンドAPI
- フロントエンド（静的サイト）

## ステップ3: 環境変数を設定

### 3.1 バックエンドの環境変数

Renderダッシュボードで `sets-carton-backend` サービスを開き、以下の環境変数を設定します：

**必須:**
- `CORS_ORIGIN`: フロントエンドのURL（例: `https://sets-carton-frontend.onrender.com`）
  - フロントエンドのデプロイ後に設定

**オプション（Web Push通知を使う場合）:**
- `VAPID_PUBLIC_KEY`: Web Push用の公開鍵
- `VAPID_PRIVATE_KEY`: Web Push用の秘密鍵

VAPID鍵の生成方法:
```bash
npx web-push generate-vapid-keys
```

### 3.2 フロントエンドの環境変数

`sets-carton-frontend` サービスで以下を設定：

- `VITE_API_URL`: バックエンドのURL（例: `https://sets-carton-backend.onrender.com`）
  - バックエンドのデプロイ後に設定

## ステップ4: デプロイの確認と初期設定

### 4.1 デプロイの完了を待つ

各サービスのログで以下を確認：
- データベース: ✓ Running
- バックエンド: ✓ Server is running on port 3001
- フロントエンド: ✓ Build succeeded

### 4.2 初期ユーザーでログイン

フロントエンドのURLにアクセスし、以下の初期ユーザーでログイン：

- **管理者**: `admin` / `admin123`
- **一般ユーザー**: `user1` / `user123`

## トラブルシューティング

### データベース接続エラー

- バックエンドのログを確認
- `DATABASE_URL` 環境変数が正しく設定されているか確認

### CORSエラー

- バックエンドの `CORS_ORIGIN` がフロントエンドのURLと一致しているか確認
- 両方のURLを `https://` で統一

### ビルドエラー

- GitHubリポジトリに `node_modules` がプッシュされていないか確認
- `.gitignore` が正しく設定されているか確認

## 無料プランの制限

Renderの無料プランには以下の制限があります：

- **Web Services**: 15分間アクセスがないとスリープ状態になります（次回アクセス時に起動）
- **PostgreSQL**: 90日後に期限切れ（無料で更新可能）
- **帯域幅**: 月100GB
- **ビルド時間**: 月500分

## 次のステップ

1. 本番環境用に強力なJWTシークレットを設定
2. 定期的にデータベースをバックアップ
3. セキュリティアップデートを適用
4. カスタムドメインの設定（オプション）

## サポート

問題が発生した場合は、Renderのログを確認してください：
- Dashboard → Service → Logs タブ
