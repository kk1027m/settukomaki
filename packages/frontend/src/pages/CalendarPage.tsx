import { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

interface CalendarEvent {
  id: number;
  date: string;
  title: string;
  description: string | null;
  color: string;
  created_by_name: string;
}

interface DayColor {
  id: number;
  date: string;
  color: string;
}

const EVENT_COLORS = [
  { value: 'blue', label: '青', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  { value: 'green', label: '緑', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  { value: 'yellow', label: '黄', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  { value: 'red', label: '赤', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  { value: 'purple', label: '紫', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  { value: 'pink', label: 'ピンク', bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
  { value: 'orange', label: 'オレンジ', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  { value: 'gray', label: 'グレー', bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
];

const DAY_COLORS = [
  { value: '', label: 'なし', bg: '' },
  { value: 'red', label: '赤', bg: 'bg-red-50' },
  { value: 'blue', label: '青', bg: 'bg-blue-50' },
  { value: 'green', label: '緑', bg: 'bg-green-50' },
  { value: 'yellow', label: '黄', bg: 'bg-yellow-50' },
  { value: 'purple', label: '紫', bg: 'bg-purple-50' },
  { value: 'pink', label: 'ピンク', bg: 'bg-pink-50' },
  { value: 'orange', label: 'オレンジ', bg: 'bg-orange-50' },
];

export default function CalendarPage() {
  const { canEdit } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [dayColors, setDayColors] = useState<DayColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isDayColorModalOpen, setIsDayColorModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [eventFormData, setEventFormData] = useState({
    date: '',
    title: '',
    description: '',
    color: 'blue',
  });
  const [selectedDayColor, setSelectedDayColor] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkEndDate, setBulkEndDate] = useState('');

  // 長押し検出用
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const [eventsRes, colorsRes] = await Promise.all([
        api.get(`/calendar/events?year=${year}&month=${month}`),
        api.get(`/calendar/day-colors?year=${year}&month=${month}`),
      ]);

      setEvents(eventsRes.data.data);
      setDayColors(colorsRes.data.data);
    } catch (error) {
      toast.error('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // 前月の日
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // 当月の日
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // 翌月の日
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const formatDateString = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getEventsForDate = (dateStr: string) => {
    return events.filter((event) => event.date.split('T')[0] === dateStr);
  };

  const getDayColorForDate = (dateStr: string) => {
    const dayColor = dayColors.find((dc) => dc.date.split('T')[0] === dateStr);
    return dayColor?.color || '';
  };

  const getColorClasses = (color: string) => {
    return EVENT_COLORS.find((c) => c.value === color) || EVENT_COLORS[0];
  };

  const getDayBgClass = (color: string) => {
    return DAY_COLORS.find((c) => c.value === color)?.bg || '';
  };

  const handleDateClick = (date: Date) => {
    if (!canEdit) return;
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    const dateStr = formatDateString(date);
    setSelectedDate(dateStr);
    setEventFormData({
      date: dateStr,
      title: '',
      description: '',
      color: 'blue',
    });
    setEditingEvent(null);
    setIsEventModalOpen(true);
  };

  const handleDateLongPress = (date: Date) => {
    if (!canEdit) return;
    const dateStr = formatDateString(date);
    setSelectedDate(dateStr);
    setBulkStartDate(dateStr);
    setBulkEndDate(dateStr);
    const currentColor = getDayColorForDate(dateStr);
    setSelectedDayColor(currentColor);
    setIsBulkMode(false);
    setIsDayColorModalOpen(true);
  };

  // タッチ開始（長押し検出用）
  const handleTouchStart = (date: Date) => {
    if (!canEdit) return;
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      handleDateLongPress(date);
    }, 500);
  };

  // タッチ終了
  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleEditEvent = (event: CalendarEvent, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!canEdit) return;
    setEditingEvent(event);
    setEventFormData({
      date: event.date.split('T')[0],
      title: event.title,
      description: event.description || '',
      color: event.color,
    });
    setIsEventModalOpen(true);
  };

  const handleDeleteEvent = async (event: CalendarEvent, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!canEdit) return;
    if (!confirm('この予定を削除しますか？')) return;

    try {
      await api.delete(`/calendar/events/${event.id}`);
      toast.success('予定を削除しました');
      loadData();
    } catch (error) {
      toast.error('削除に失敗しました');
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingEvent) {
        await api.put(`/calendar/events/${editingEvent.id}`, eventFormData);
        toast.success('予定を更新しました');
      } else {
        await api.post('/calendar/events', eventFormData);
        toast.success('予定を追加しました');
      }
      setIsEventModalOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || '保存に失敗しました');
    }
  };

  const handleDayColorSubmit = async () => {
    try {
      if (isBulkMode && bulkStartDate && bulkEndDate) {
        // Bulk update
        const start = new Date(bulkStartDate);
        const end = new Date(bulkEndDate);
        if (start > end) {
          toast.error('開始日は終了日より前に設定してください');
          return;
        }
        const dates: string[] = [];
        const current = new Date(start);
        while (current <= end) {
          dates.push(formatDateString(current));
          current.setDate(current.getDate() + 1);
        }
        await Promise.all(
          dates.map(date => 
            api.post('/calendar/day-colors', {
              date,
              color: selectedDayColor || null,
            })
          )
        );
        toast.success(`${dates.length}日分の色を設定しました`);
      } else {
        await api.post('/calendar/day-colors', {
          date: selectedDate,
          color: selectedDayColor || null,
        });
        toast.success('日付の色を設定しました');
      }
      setIsDayColorModalOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || '設定に失敗しました');
    }
  };

  const days = getDaysInMonth();
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  const today = formatDateString(new Date());

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">カレンダー</h1>
      </div>

      <Card>
        {/* ヘッダー */}
        <div className="flex items-center mb-4">
          <div className="flex items-center gap-1">
            <Button variant="secondary" className="px-2 py-1" onClick={handlePrevMonth}>
              <ChevronLeft size={16} />
            </Button>
            <Button variant="secondary" className="px-2 py-1 text-xs" onClick={handleToday}>
              今日
            </Button>
            <Button variant="secondary" className="px-2 py-1" onClick={handleNextMonth}>
              <ChevronRight size={16} />
            </Button>
          </div>
          <div className="flex-1"></div>
          <h2 className="text-lg md:text-xl font-bold whitespace-nowrap">
            {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
          </h2>
          
        </div>

        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={`text-center py-2 font-medium text-sm ${
                index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* カレンダーグリッド */}
        {loading ? (
          <div className="text-center py-8">読み込み中...</div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const dateStr = formatDateString(day.date);
              const dayEvents = getEventsForDate(dateStr);
              const dayColor = getDayColorForDate(dateStr);
              const dayOfWeek = day.date.getDay();
              const isToday = dateStr === today;

              return (
                <div
                  key={index}
                  className={`min-h-[60px] md:min-h-[80px] p-1 border rounded cursor-pointer transition-colors ${day.isCurrentMonth ? (dayColor ? '' : 'bg-white') : 'bg-gray-50'} ${getDayBgClass(dayColor)} ${
                    isToday ? 'ring-2 ring-blue-500' : ''
                  } hover:bg-gray-100`}
                  onClick={() => handleDateClick(day.date)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleDateLongPress(day.date);
                  }}
                  onTouchStart={() => handleTouchStart(day.date)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                >
                  <div
                    className={`text-sm font-medium mb-1 ${
                      !day.isCurrentMonth
                        ? 'text-gray-400'
                        : dayOfWeek === 0
                        ? 'text-red-600'
                        : dayOfWeek === 6
                        ? 'text-blue-600'
                        : 'text-gray-900'
                    } ${isToday ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}
                  >
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => {
                      const colorClasses = getColorClasses(event.color);
                      return (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded truncate ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border} border group relative`}
                          onClick={(e) => handleEditEvent(event, e)}
                        >
                          <span className="truncate">{event.title}</span>
                          {canEdit && (
                            <button
                              className="absolute right-0 top-0 p-0.5 opacity-0 group-hover:opacity-100 bg-white rounded"
                              onClick={(e) => handleDeleteEvent(event, e)}
                            >
                              <X size={12} className="text-red-500" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500">+{dayEvents.length - 3}件</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 凡例 */}
        {canEdit && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">操作方法:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>・日付をタップ: 予定を追加</li>
              <li>・予定をタップ: 予定を編集</li>
              <li>・日付を長押し: 日付の背景色を設定</li>
            </ul>
          </div>
        )}
      </Card>

      {/* イベント追加/編集モーダル */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title={editingEvent ? '予定を編集' : '予定を追加'}
      >
        <form onSubmit={handleEventSubmit} className="space-y-4">
          <Input
            label="日付"
            type="date"
            value={eventFormData.date}
            onChange={(e) => setEventFormData({ ...eventFormData, date: e.target.value })}
            required
          />
          <Input
            label="タイトル"
            value={eventFormData.title}
            onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
            <textarea
              className="input"
              rows={3}
              value={eventFormData.description}
              onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">色</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`px-3 py-1 rounded border-2 text-sm ${color.bg} ${color.text} ${
                    eventFormData.color === color.value ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                  }`}
                  onClick={() => setEventFormData({ ...eventFormData, color: color.value })}
                >
                  {color.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setIsEventModalOpen(false)}>
              キャンセル
            </Button>
            <Button type="submit">保存</Button>
          </div>
        </form>
      </Modal>

      {/* 日付の色設定モーダル */}
      <Modal
        isOpen={isDayColorModalOpen}
        onClose={() => setIsDayColorModalOpen(false)}
        title="日付の背景色を設定"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">
              <input
                type="checkbox"
                checked={isBulkMode}
                onChange={(e) => setIsBulkMode(e.target.checked)}
                className="mr-2"
              />
              まとめて設定
            </label>
          </div>
          
          {isBulkMode ? (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={bulkStartDate}
                onChange={(e) => setBulkStartDate(e.target.value)}
                className="input text-sm"
              />
              <span className="text-gray-500">〜</span>
              <input
                type="date"
                value={bulkEndDate}
                onChange={(e) => setBulkEndDate(e.target.value)}
                className="input text-sm"
              />
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              選択した日付: {selectedDate}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">背景色</label>
            <div className="flex flex-wrap gap-2">
              {DAY_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`px-3 py-2 rounded border-2 text-sm ${
                    color.bg || 'bg-white'
                  } ${
                    selectedDayColor === color.value ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                  }`}
                  onClick={() => setSelectedDayColor(color.value)}
                >
                  {color.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setIsDayColorModalOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleDayColorSubmit}>設定</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
