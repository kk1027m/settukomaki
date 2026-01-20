/**
 * 日本時間（JST）で日付を処理するユーティリティ関数
 */

/**
 * 日本時間の現在の日付を取得
 */
export const getJSTNow = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
};

/**
 * DateオブジェクトをYYYY-MM-DD形式の文字列に変換（JST）
 * toISOString()はUTCで出力するため、JSTベースで日付を取得する場合はこの関数を使用
 */
export const getJSTDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 日本時間で今日の日付文字列を取得（YYYY-MM-DD形式）
 */
export const getTodayJSTString = (): string => {
  const now = getJSTNow();
  return getJSTDateString(now);
};

/**
 * 日本時間でN日後の日付文字列を取得（YYYY-MM-DD形式）
 */
export const getJSTDateStringAfterDays = (days: number): string => {
  const now = getJSTNow();
  now.setHours(0, 0, 0, 0);
  now.setDate(now.getDate() + days);
  return getJSTDateString(now);
};
