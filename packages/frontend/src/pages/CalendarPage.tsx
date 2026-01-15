import { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Plus, Clock } from 'lucide-react';
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
  end_date: string | null;
  title: string;
  description: string | null;
  color: string;
  start_time: string | null;
  created_by_name: string;
}

interface DayColor {
  id: number;
  date: string;
  color: string;
}

interface Leave {
  id: number;
  date: string;
  employee_name: string;
  note: string | null;
}

const EVENT_COLORS = [
  { value: 'blue', label: '青', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', dot: 'bg-blue-500' },
  { value: 'green', label: '緑', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', dot: 'bg-green-500' },
  { value: 'yellow', label: '黄', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', dot: 'bg-yellow-500' },
  { value: 'red', label: '赤', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', dot: 'bg-red-500' },
  { value: 'purple', label: '紫', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', dot: 'bg-purple-500' },
  { value: 'pink', label: 'ピンク', bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300', dot: 'bg-pink-500' },
  { value: 'orange', label: 'オレンジ', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', dot: 'bg-orange-500' },
  { value: 'gray', label: 'グレー', bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300', dot: 'bg-gray-500' },
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

// 時刻を表示用にフォーマット（HH:MM形式）
const formatTime = (time: string | null): string => {
  if (!time) return '';
  // "HH:MM:SS" or "HH:MM" 形式を "HH:MM" に変換
  return time.slice(0, 5);
};

export default function CalendarPage() {
  const { canEdit } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [dayColors, setDayColors] = useState<DayColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isDayColorModalOpen, setIsDayColorModalOpen] = useState(false);
  const [isDayEventsModalOpen, setIsDayEventsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [eventFormData, setEventFormData] = useState({
    date: '',
    end_date: '',
    title: '',
    description: '',
    color: 'blue',
    start_time: '',
  });
  const [selectedDayColor, setSelectedDayColor] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkEndDate, setBulkEndDate] = useState('');

  // 有給休暇
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [newLeaveName, setNewLeaveName] = useState('');

  // A/B班設定（週ごと、キーは週の日曜日の日付）
  const [weekShifts, setWeekShifts] = useState<Record<string, 'A' | 'B'>>({});

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

      const [eventsRes, colorsRes, shiftsRes, leavesRes] = await Promise.all([
        api.get(`/calendar/events?year=${year}&month=${month}`),
        api.get(`/calendar/day-colors?year=${year}&month=${month}`),
        api.get('/calendar/week-shifts'),  // 全て取得（前月・翌月の週も表示されるため）
        api.get(`/calendar/leaves?year=${year}&month=${month}`),
      ]);

      setEvents(eventsRes.data.data);
      setDayColors(colorsRes.data.data);
      setLeaves(leavesRes.data.data);

      // DBから取得したシフトをlocal stateに設定
      const shiftsMap: Record<string, 'A' | 'B'> = {};
      shiftsRes.data.data.forEach((item: any) => {
        const dateStr = item.sunday_date.split('T')[0];
        shiftsMap[dateStr] = item.shift;
      });
      setWeekShifts(shiftsMap);
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

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const getEventsForDate = (dateStr: string) => {
    return events.filter((event) => {
      const eventStart = event.date.split('T')[0];
      const eventEnd = event.end_date ? event.end_date.split('T')[0] : eventStart;
      return dateStr >= eventStart && dateStr <= eventEnd;
    });
  };

  // 複数日イベントの日付位置を判定 ('start' | 'middle' | 'end' | 'single')
  const getEventDatePosition = (event: CalendarEvent, dateStr: string): 'start' | 'middle' | 'end' | 'single' => {
    const eventStart = event.date.split('T')[0];
    const eventEnd = event.end_date ? event.end_date.split('T')[0] : eventStart;

    if (eventStart === eventEnd) return 'single';
    if (dateStr === eventStart) return 'start';
    if (dateStr === eventEnd) return 'end';
    return 'middle';
  };

  // 期間表示フォーマット（例：1/15〜17）
  const formatDateRange = (event: CalendarEvent): string => {
    if (!event.end_date) return '';
    const start = new Date(event.date);
    const end = new Date(event.end_date);
    const startMonth = start.getMonth() + 1;
    const startDay = start.getDate();
    const endMonth = end.getMonth() + 1;
    const endDay = end.getDate();

    if (startMonth === endMonth) {
      return `(${startMonth}/${startDay}〜${endDay})`;
    }
    return `(${startMonth}/${startDay}〜${endMonth}/${endDay})`;
  };

  const getDayColorForDate = (dateStr: string) => {
    const dayColor = dayColors.find((dc) => dc.date.split('T')[0] === dateStr);
    return dayColor?.color || '';
  };

  const getLeavesForDate = (dateStr: string) => {
    return leaves.filter((leave) => leave.date.split('T')[0] === dateStr);
  };

  const handleAddLeave = async () => {
    if (!newLeaveName.trim()) {
      toast.error('名前を入力してください');
      return;
    }

    try {
      await api.post('/calendar/leaves', {
        date: selectedDate,
        employee_name: newLeaveName.trim(),
      });
      toast.success('有給休暇を追加しました');
      setNewLeaveName('');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || '追加に失敗しました');
    }
  };

  const handleDeleteLeave = async (leaveId: number) => {
    if (!confirm('この有給休暇情報を削除しますか？')) return;

    try {
      await api.delete(`/calendar/leaves/${leaveId}`);
      toast.success('有給休暇を削除しました');
      loadData();
    } catch (error) {
      toast.error('削除に失敗しました');
    }
  };

  const getColorClasses = (color: string) => {
    return EVENT_COLORS.find((c) => c.value === color) || EVENT_COLORS[0];
  };

  const getDayBgClass = (color: string) => {
    return DAY_COLORS.find((c) => c.value === color)?.bg || '';
  };

  // A/B班を切り替え
  const toggleWeekShift = async (sundayDate: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEdit) return;

    const current = weekShifts[sundayDate] || 'A';
    const next: 'A' | 'B' = current === 'A' ? 'B' : 'A';

    try {
      await api.post('/calendar/week-shifts', {
        sundayDate,
        shift: next,
      });
      const newShifts: Record<string, 'A' | 'B'> = { ...weekShifts, [sundayDate]: next };
      setWeekShifts(newShifts);
    } catch (error) {
      toast.error('班の更新に失敗しました');
    }
  };

  // 週のシフトを取得
  const getWeekShift = (sundayDate: string) => {
    return weekShifts[sundayDate] || 'A';
  };

  // 日付クリック → 予定一覧モーダルを表示
  const handleDateClick = (date: Date) => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    const dateStr = formatDateString(date);
    setSelectedDate(dateStr);
    setIsDayEventsModalOpen(true);
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

  // 予定追加モーダルを開く
  const handleAddEvent = () => {
    setEditingEvent(null);
    setEventFormData({
      date: selectedDate,
      end_date: '',
      title: '',
      description: '',
      color: 'blue',
      start_time: '',
    });
    setIsDayEventsModalOpen(false);
    setIsEventModalOpen(true);
  };

  // 予定編集モーダルを開く
  const handleEditEvent = (event: CalendarEvent) => {
    if (!canEdit) return;
    setEditingEvent(event);
    setEventFormData({
      date: event.date.split('T')[0],
      end_date: event.end_date ? event.end_date.split('T')[0] : '',
      title: event.title,
      description: event.description || '',
      color: event.color,
      start_time: event.start_time ? formatTime(event.start_time) : '',
    });
    setIsDayEventsModalOpen(false);
    setIsEventModalOpen(true);
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    if (!canEdit) return;
    if (!confirm('この予定を削除しますか？')) return;

    try {
      await api.delete(`/calendar/events/${event.id}`);
      toast.success('予定を削除しました');
      loadData();
      // 予定一覧モーダルを更新するために再表示
      setIsDayEventsModalOpen(false);
      setTimeout(() => setIsDayEventsModalOpen(true), 100);
    } catch (error) {
      toast.error('削除に失敗しました');
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const submitData = {
        ...eventFormData,
        end_date: eventFormData.end_date || null,
        start_time: eventFormData.start_time || null,
      };

      if (editingEvent) {
        await api.put(`/calendar/events/${editingEvent.id}`, submitData);
        toast.success('予定を更新しました');
      } else {
        await api.post('/calendar/events', submitData);
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
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold">カレンダー</h1>
      </div>

      <Card className="!p-2">
        {/* ヘッダー */}
        <div className="flex items-center mb-2">
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
          <h2 className="text-lg font-bold whitespace-nowrap">
            {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
          </h2>
        </div>

        {/* 曜日ヘッダー */}
        <div className="flex mb-0.5">
          <div className="w-5 flex-shrink-0"></div>
          <div className="flex-1 grid grid-cols-7">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`text-center py-1 font-medium text-sm ${
                  index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* カレンダーグリッド */}
        {loading ? (
          <div className="text-center py-8">読み込み中...</div>
        ) : (
          <div className="space-y-0.5">
            {/* 週ごとにレンダリング */}
            {[0, 1, 2, 3, 4, 5].map((weekIndex) => {
              const weekDays = days.slice(weekIndex * 7, (weekIndex + 1) * 7);
              const sundayDateStr = formatDateString(weekDays[0].date);

              return (
                <div key={weekIndex} className="flex">
                  {/* A/B班ボタン（左枠外） */}
                  <button
                    onClick={(e) => toggleWeekShift(sundayDateStr, e)}
                    className={`w-5 h-5 text-[10px] font-bold rounded flex-shrink-0 self-center ${
                      getWeekShift(sundayDateStr) === 'A'
                        ? 'bg-blue-500 text-white'
                        : 'bg-orange-500 text-white'
                    }`}
                  >
                    {getWeekShift(sundayDateStr)}
                  </button>

                  {/* 7日分のグリッド */}
                  <div className="flex-1 grid grid-cols-7 gap-px">
                    {weekDays.map((day, dayIndex) => {
                      const dateStr = formatDateString(day.date);
                      const dayEvents = getEventsForDate(dateStr);
                      const dayColor = getDayColorForDate(dateStr);
                      const dayOfWeek = day.date.getDay();
                      const isToday = dateStr === today;

                      return (
                        <div
                          key={dayIndex}
                          className={`min-h-[70px] md:min-h-[90px] p-1 border border-gray-200 cursor-pointer transition-colors ${day.isCurrentMonth ? (dayColor ? '' : 'bg-white') : 'bg-gray-50'} ${getDayBgClass(dayColor)} ${
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
                          {/* スマホ: ドット表示 / PC: タイトル表示 */}
                          <div className="space-y-1">
                            {/* スマホ用: ドット表示 */}
                            <div className="md:hidden">
                              {dayEvents.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {dayEvents.slice(0, 4).map((event) => {
                                    const colorClasses = getColorClasses(event.color);
                                    return (
                                      <div
                                        key={event.id}
                                        className={`w-2 h-2 rounded-full ${colorClasses.dot}`}
                                      />
                                    );
                                  })}
                                  {dayEvents.length > 4 && (
                                    <span className="text-xs text-gray-500">+{dayEvents.length - 4}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            {/* PC用: タイトル表示 */}
                            <div className="hidden md:block">
                              {dayEvents.slice(0, 3).map((event) => {
                                const colorClasses = getColorClasses(event.color);
                                const position = getEventDatePosition(event, dateStr);
                                const dateRange = formatDateRange(event);
                                return (
                                  <div
                                    key={event.id}
                                    className={`text-xs p-1 rounded truncate ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border} border mb-1`}
                                  >
                                    {position === 'start' && <span>▶</span>}
                                    {position === 'middle' && <span>━</span>}
                                    {position === 'end' && <span>◀</span>}
                                    {event.start_time && position === 'start' && (
                                      <span className="font-medium">{formatTime(event.start_time)} </span>
                                    )}
                                    <span className="truncate">
                                      {event.title}
                                      {position === 'start' && dateRange && <span className="text-gray-500 ml-1">{dateRange}</span>}
                                    </span>
                                  </div>
                                );
                              })}
                              {dayEvents.length > 3 && (
                                <div className="text-xs text-gray-500">+{dayEvents.length - 3}件</div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
              <li>・日付をタップ: 予定一覧を表示</li>
              <li>・日付を長押し: 日付の背景色を設定</li>
            </ul>
          </div>
        )}
      </Card>

      {/* 日別予定一覧モーダル */}
      <Modal
        isOpen={isDayEventsModalOpen}
        onClose={() => setIsDayEventsModalOpen(false)}
        title={`${formatDateDisplay(selectedDate)}の予定`}
      >
        {(() => {
          const dayEvents = getEventsForDate(selectedDate);
          const dayLeaves = getLeavesForDate(selectedDate);
          return (
            <div className="space-y-4">
              {/* 予定セクション */}
              {dayEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">予定はありません</p>
              ) : (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {dayEvents.map((event) => {
                    const colorClasses = getColorClasses(event.color);
                    const position = getEventDatePosition(event, selectedDate);
                    const dateRange = formatDateRange(event);
                    return (
                      <div
                        key={event.id}
                        className={`p-3 rounded-lg border ${colorClasses.bg} ${colorClasses.border} ${canEdit ? 'cursor-pointer hover:opacity-80' : ''}`}
                        onClick={() => canEdit && handleEditEvent(event)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {position !== 'single' && (
                                <span className={`text-sm ${colorClasses.text}`}>
                                  {position === 'start' && '▶開始'}
                                  {position === 'middle' && '━継続中'}
                                  {position === 'end' && '◀終了'}
                                </span>
                              )}
                              {event.start_time && position === 'start' && (
                                <span className={`text-sm font-medium ${colorClasses.text} flex items-center gap-1`}>
                                  <Clock size={14} />
                                  {formatTime(event.start_time)}
                                </span>
                              )}
                              <span className={`font-medium ${colorClasses.text}`}>{event.title}</span>
                              {dateRange && (
                                <span className="text-sm text-gray-500">{dateRange}</span>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{event.description}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">作成者: {event.created_by_name}</p>
                          </div>
                          {canEdit && (
                            <button
                              className="p-1 hover:bg-white rounded ml-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(event);
                              }}
                            >
                              <X size={16} className="text-red-500" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {canEdit && (
                <div className="pt-2 border-t">
                  <Button onClick={handleAddEvent} className="w-full flex items-center justify-center gap-2">
                    <Plus size={16} />
                    予定を追加
                  </Button>
                </div>
              )}

              {/* 有給休暇セクション */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-700 mb-2">有給休暇取得者</h3>
                {dayLeaves.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {dayLeaves.map((leave) => (
                      <div key={leave.id} className="flex items-center justify-between p-2 bg-emerald-50 rounded border border-emerald-200">
                        <span className="text-emerald-800">{leave.employee_name}</span>
                        {canEdit && (
                          <button
                            className="p-1 hover:bg-emerald-100 rounded"
                            onClick={() => handleDeleteLeave(leave.id)}
                          >
                            <X size={14} className="text-red-500" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {canEdit && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="名前を入力"
                      value={newLeaveName}
                      onChange={(e) => setNewLeaveName(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleAddLeave} variant="secondary">
                      追加
                    </Button>
                  </div>
                )}
                {!canEdit && dayLeaves.length === 0 && (
                  <p className="text-gray-400 text-sm">有給休暇取得者はいません</p>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* イベント追加/編集モーダル */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title={editingEvent ? '予定を編集' : '予定を追加'}
      >
        <form onSubmit={handleEventSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="開始日"
              type="date"
              value={eventFormData.date}
              onChange={(e) => setEventFormData({ ...eventFormData, date: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">終了日（複数日の場合）</label>
              <input
                type="date"
                className="input w-full"
                value={eventFormData.end_date}
                min={eventFormData.date}
                onChange={(e) => setEventFormData({ ...eventFormData, end_date: e.target.value })}
              />
            </div>
          </div>
          <Input
            label="時刻"
            type="time"
            value={eventFormData.start_time}
            onChange={(e) => setEventFormData({ ...eventFormData, start_time: e.target.value })}
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
