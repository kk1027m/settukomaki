const CACHE_NAME = 'sets-carton-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/logo.png'
];

// インストール時：静的リソースをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: キャッシュを開きました');
        return cache.addAll(urlsToCache);
      })
  );
  // 新しいService Workerを即座にアクティブ化
  self.skipWaiting();
});

// アクティベート時：古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: 古いキャッシュを削除します', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 既存のクライアントをすぐに制御
  return self.clients.claim();
});

// フェッチ時：ネットワーク優先、失敗時はキャッシュ
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // APIリクエストの場合：常にネットワークから取得
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // API呼び出し失敗時は何もしない（エラーをアプリ側で処理）
          return new Response(JSON.stringify({ error: 'オフラインです' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // 静的リソース：ネットワーク優先、失敗時はキャッシュ
  event.respondWith(
    fetch(request)
      .then((response) => {
        // 正常なレスポンスの場合、キャッシュを更新
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // ネットワークエラー時はキャッシュから返す
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // キャッシュにもない場合
          return new Response('オフラインです', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});
