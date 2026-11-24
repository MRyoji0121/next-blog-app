"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { cn } from "cn";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faPlus,
  faTrash,
  faPen,
  faClock,
  faFire,
  faCalendarDays,
  faCalendarWeek,
  faChevronLeft,
  faChevronRight,
  faDownload,
  faUpload,
  faCircleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { EventCategory, Priority, ScheduleEvent } from "@/app/_types/schedule";
import { EventModal } from "@/app/_components/EventModal";

const STORAGE_KEY = "monst_schedule_events_v1";

type ViewMode = "week" | "month";

const PRIORITY_META: Record<
  Priority,
  {
    label: string;
    badgeClass: string;
    borderClass: string;
    dotClass: string;
    order: number;
  }
> = {
  urgent: {
    label: "最優先",
    badgeClass: "bg-red-600 text-white",
    borderClass: "border-l-4 border-l-red-500",
    dotClass: "bg-red-500",
    order: 0,
  },
  high: {
    label: "優先度:高",
    badgeClass: "bg-amber-500 text-slate-950",
    borderClass: "border-l-4 border-l-amber-400",
    dotClass: "bg-amber-400",
    order: 1,
  },
  medium: {
    label: "優先度:中",
    badgeClass: "bg-sky-600 text-white",
    borderClass: "border-l-4 border-l-sky-400",
    dotClass: "bg-sky-400",
    order: 2,
  },
  low: {
    label: "優先度:低",
    badgeClass: "bg-slate-600 text-slate-200",
    borderClass: "border-l-4 border-l-slate-500",
    dotClass: "bg-slate-400",
    order: 3,
  },
};

const CATEGORY_LABEL: Record<EventCategory, string> = {
  collab: "コラボ",
  advent: "降臨",
  campaign: "キャンペーン",
  other: "その他",
};

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "終了";
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `あと${days}日${hours}時間`;
  if (hours > 0) return `あと${hours}時間${mins}分`;
  return `あと${mins}分`;
}

function createInitialSamples(baseDate: Date): ScheduleEvent[] {
  const today = formatDateKey(baseDate);
  const nextWeek = new Date(baseDate);
  nextWeek.setDate(baseDate.getDate() + 10);
  const nextWeekStr = formatDateKey(nextWeek);

  return [
    {
      id: "sample-collab-1",
      title: "期間限定コラボイベント開催中！",
      category: "collab",
      priority: "urgent",
      startAt: `${today}T12:00`,
      endAt: `${nextWeekStr}T11:59`,
      isLongTerm: true,
      remindMinutes: 0,
      memo: "コラボミッションと超究極のクリアを優先",
    },
    {
      id: "sample-advent-1",
      title: "【超究極】期間限定ボス降臨",
      category: "advent",
      priority: "urgent",
      startAt: `${today}T19:00`,
      endAt: `${today}T22:00`,
      isLongTerm: false,
      remindMinutes: 15,
      memo: "適正キャラ編成・紋章セット確認",
    },
    {
      id: "sample-advent-2",
      title: "書庫ポイント2倍キャンペーン",
      category: "campaign",
      priority: "medium",
      startAt: `${today}T00:00`,
      endAt: `${today}T23:59`,
      isLongTerm: false,
      remindMinutes: 0,
      memo: "未運極の星5制限クエストを回収",
    },
  ];
}

const Page: React.FC = () => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [now, setNow] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("week");

  const [weekStartDate, setWeekStartDate] = useState<string>("");
  const [monthCursor, setMonthCursor] = useState<{ year: number; month: number }>({
    year: 2026,
    month: 0,
  });

  const [onlyHighPriority, setOnlyHighPriority] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");
  const [activeAlert, setActiveAlert] = useState<string | null>(null);

  const notifiedIdsRef = useRef<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const current = new Date();
    const todayKey = formatDateKey(current);
    setNow(current);
    setSelectedDate(todayKey);
    setWeekStartDate(todayKey);
    setMonthCursor({ year: current.getFullYear(), month: current.getMonth() });

    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setEvents(JSON.parse(saved));
      } catch {
        setEvents(createInitialSamples(current));
      }
    } else {
      const samples = createInitialSamples(current);
      setEvents(samples);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const current = new Date();
      setNow(current);

      events.forEach((ev) => {
        if (ev.remindMinutes <= 0) return;
        const startMs = new Date(ev.startAt).getTime();
        const remindMs = startMs - ev.remindMinutes * 60 * 1000;
        const currentMs = current.getTime();
        const notifyKey = `${ev.id}_${ev.startAt}`;

        if (
          currentMs >= remindMs &&
          currentMs < startMs &&
          !notifiedIdsRef.current.has(notifyKey)
        ) {
          notifiedIdsRef.current.add(notifyKey);
          const msg = `【まもなく開始】「${ev.title}」が ${formatTime(ev.startAt)} から始まります！`;
          setActiveAlert(msg);

          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification("Monster Strike Calendar", { body: msg });
          }
        }
      });
    }, 10000);

    return () => clearInterval(timer);
  }, [events]);

  const persistEvents = (nextEvents: ScheduleEvent[]) => {
    setEvents(nextEvents);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEvents));
  };

  const handleSaveEvent = (savedEvent: ScheduleEvent) => {
    const exists = events.some((e) => e.id === savedEvent.id);
    const next = exists
      ? events.map((e) => (e.id === savedEvent.id ? savedEvent : e))
      : [...events, savedEvent];
    persistEvents(next);
  };

  const handleDeleteEvent = (id: string) => {
    if (!confirm("このイベントを削除しますか？")) return;
    persistEvents(events.filter((e) => e.id !== id));
  };

  const requestNotification = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("お使いのブラウザは通知機能に対応していません。");
      return;
    }
    const perm = await Notification.requestPermission();
    setNotificationPermission(perm);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(events, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monst-calendar-${formatDateKey(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed)) {
          persistEvents(parsed);
          alert("スケジュールデータを読み込みました。");
        }
      } catch {
        alert("JSONファイルの読み込みに失敗しました。");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleJumpToday = () => {
    const current = new Date();
    const todayKey = formatDateKey(current);
    setSelectedDate(todayKey);
    setWeekStartDate(todayKey);
    setMonthCursor({ year: current.getFullYear(), month: current.getMonth() });
  };

  const shiftWeek = (days: number) => {
    if (!weekStartDate) return;
    const base = parseDateKey(weekStartDate);
    base.setDate(base.getDate() + days);
    const nextKey = formatDateKey(base);
    setWeekStartDate(nextKey);
    setSelectedDate(nextKey);
  };

  const shiftMonth = (diff: number) => {
    setMonthCursor((prev) => {
      const nextDate = new Date(prev.year, prev.month + diff, 1);
      return { year: nextDate.getFullYear(), month: nextDate.getMonth() };
    });
  };

  const weekDaysList = useMemo(() => {
    if (!now || !weekStartDate) return [];
    const todayKey = formatDateKey(now);
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowKey = formatDateKey(tomorrow);

    const weekNames = ["日", "月", "火", "水", "木", "金", "土"];
    const start = parseDateKey(weekStartDate);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = formatDateKey(d);
      const dayStart = new Date(`${key}T00:00:00`).getTime();
      const dayEnd = new Date(`${key}T23:59:59`).getTime();

      const count = events.filter((ev) => {
        if (ev.isLongTerm) return false;
        const s = new Date(ev.startAt).getTime();
        const e = new Date(ev.endAt).getTime();
        return s <= dayEnd && e >= dayStart;
      }).length;

      let label = `${d.getMonth() + 1}/${d.getDate()}`;
      if (key === todayKey) label = "今日";
      else if (key === tomorrowKey) label = "明日";

      return {
        key,
        label,
        subLabel: weekNames[d.getDay()],
        dayOfWeek: d.getDay(),
        count,
      };
    });
  }, [now, weekStartDate, events]);

  const monthGrid = useMemo(() => {
    if (!now) return [];
    const { year, month } = monthCursor;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startOffset = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const totalCells = Math.ceil((startOffset + totalDays) / 7) * 7;

    const todayKey = formatDateKey(now);

    return Array.from({ length: totalCells }, (_, idx) => {
      const dateObj = new Date(year, month, 1 - startOffset + idx);
      const key = formatDateKey(dateObj);
      const isCurrentMonth = dateObj.getMonth() === month;
      const dayStart = new Date(`${key}T00:00:00`).getTime();
      const dayEnd = new Date(`${key}T23:59:59`).getTime();

      const dayEvents = events
        .filter((ev) => {
          if (ev.isLongTerm) return false;
          if (onlyHighPriority && ev.priority !== "urgent" && ev.priority !== "high") {
            return false;
          }
          const s = new Date(ev.startAt).getTime();
          const e = new Date(ev.endAt).getTime();
          return s <= dayEnd && e >= dayStart;
        })
        .sort((a, b) => PRIORITY_META[a.priority].order - PRIORITY_META[b.priority].order);

      const hasLongTerm = events.some((ev) => {
        if (!ev.isLongTerm) return false;
        const s = new Date(ev.startAt).getTime();
        const e = new Date(ev.endAt).getTime();
        return s <= dayEnd && e >= dayStart;
      });

      return {
        key,
        dayNumber: dateObj.getDate(),
        dayOfWeek: dateObj.getDay(),
        isCurrentMonth,
        isToday: key === todayKey,
        dayEvents,
        hasLongTerm,
      };
    });
  }, [now, monthCursor, events, onlyHighPriority]);

  const longTermEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dayStart = new Date(`${selectedDate}T00:00:00`).getTime();
    const dayEnd = new Date(`${selectedDate}T23:59:59`).getTime();

    return events
      .filter((ev) => {
        if (!ev.isLongTerm) return false;
        const s = new Date(ev.startAt).getTime();
        const e = new Date(ev.endAt).getTime();
        return s <= dayEnd && e >= dayStart;
      })
      .sort((a, b) => PRIORITY_META[a.priority].order - PRIORITY_META[b.priority].order);
  }, [events, selectedDate]);

  const dailySchedule = useMemo(() => {
    if (!selectedDate) return [];
    const dayStart = new Date(`${selectedDate}T00:00:00`).getTime();
    const dayEnd = new Date(`${selectedDate}T23:59:59`).getTime();

    return events
      .filter((ev) => {
        if (ev.isLongTerm) return false;
        if (onlyHighPriority && ev.priority !== "urgent" && ev.priority !== "high") {
          return false;
        }
        const s = new Date(ev.startAt).getTime();
        const e = new Date(ev.endAt).getTime();
        return s <= dayEnd && e >= dayStart;
      })
      .sort((a, b) => {
        const diff = new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
        if (diff !== 0) return diff;
        return PRIORITY_META[a.priority].order - PRIORITY_META[b.priority].order;
      });
  }, [events, selectedDate, onlyHighPriority]);

  if (!now) {
    return <main className="py-12 text-center text-slate-500">読み込み中...</main>;
  }

  return (
    <main className="pb-24 lg:pb-12">
      {/* リマインド通知バナー */}
      {activeAlert && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-amber-400 bg-amber-100 px-3.5 py-2.5 text-xs font-bold text-amber-950 shadow-sm sm:text-sm">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faCircleExclamation} className="shrink-0 text-amber-600" />
            <span>{activeAlert}</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveAlert(null)}
            className="ml-3 shrink-0 rounded bg-amber-200 px-2 py-0.5 text-xs hover:bg-amber-300"
          >
            閉じる
          </button>
        </div>
      )}

      {/* コントロールバー（スマホ・PC共通上部操作パネル） */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900 p-2.5 text-white shadow sm:p-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingEvent(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 shadow transition hover:bg-amber-400 sm:px-4 sm:text-sm"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>イベント追加</span>
          </button>

          {/* 週表示 / 月表示 切り替えスイッチ */}
          <div className="flex rounded-lg bg-slate-800 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2.5 py-1.5 transition sm:px-3",
                viewMode === "week"
                  ? "bg-amber-500 text-slate-950 shadow"
                  : "text-slate-300 hover:text-white"
              )}
            >
              <FontAwesomeIcon icon={faCalendarWeek} />
              <span>週</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (selectedDate) {
                  const d = parseDateKey(selectedDate);
                  setMonthCursor({ year: d.getFullYear(), month: d.getMonth() });
                }
                setViewMode("month");
              }}
              className={cn(
                "flex items-center gap-1 rounded-md px-2.5 py-1.5 transition sm:px-3",
                viewMode === "month"
                  ? "bg-amber-500 text-slate-950 shadow"
                  : "text-slate-300 hover:text-white"
              )}
            >
              <FontAwesomeIcon icon={faCalendarDays} />
              <span>月</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {notificationPermission !== "granted" && (
            <button
              type="button"
              onClick={requestNotification}
              className="flex items-center gap-1 rounded-lg border border-amber-400/60 bg-slate-800 px-2.5 py-1.5 text-amber-300 transition hover:bg-slate-700"
            >
              <FontAwesomeIcon icon={faBell} />
              <span>通知ON</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleExportJson}
            title="データをJSONで保存"
            className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-slate-300 transition hover:bg-slate-700"
          >
            <FontAwesomeIcon icon={faDownload} className="sm:mr-1" />
            <span className="hidden sm:inline">保存</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="JSONから復元"
            className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-slate-300 transition hover:bg-slate-700"
          >
            <FontAwesomeIcon icon={faUpload} className="sm:mr-1" />
            <span className="hidden sm:inline">復元</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportJson}
            className="hidden"
          />
        </div>
      </div>

      {/* メイングリッド: スマホは1カラム縦並び / PC(lg以上)は左右2カラム */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
        {/* ==================== 左カラム（コラボ枠 + カレンダー） ==================== */}
        <div className="space-y-4 lg:col-span-7">
          {/* 開催中の長期イベント（コラボ・キャンペーン） */}
          {longTermEvents.length > 0 && (
            <section>
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <FontAwesomeIcon icon={faFire} className="text-red-500" />
                <span>開催中のコラボ・長期イベント</span>
              </div>
              <div className="space-y-2">
                {longTermEvents.map((ev) => {
                  const endMs = new Date(ev.endAt).getTime();
                  const isRunning =
                    now.getTime() >= new Date(ev.startAt).getTime() && now.getTime() <= endMs;
                  const pMeta = PRIORITY_META[ev.priority];

                  return (
                    <div
                      key={ev.id}
                      className={cn(
                        "flex items-center justify-between rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-3 text-white shadow",
                        pMeta.borderClass
                      )}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="rounded bg-purple-600 px-1.5 py-0.5 font-bold">
                            {CATEGORY_LABEL[ev.category]}
                          </span>
                          <span className={cn("rounded px-1.5 py-0.5 font-bold", pMeta.badgeClass)}>
                            {pMeta.label}
                          </span>
                          <span className="font-bold text-amber-300">
                            {isRunning
                              ? `開催中 (${formatRemaining(endMs - now.getTime())})`
                              : "開催予定"}
                          </span>
                        </div>
                        <div className="truncate text-sm font-bold">{ev.title}</div>
                        {ev.memo && (
                          <p className="mt-0.5 truncate text-xs text-slate-300">{ev.memo}</p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEvent(ev);
                            setIsModalOpen(true);
                          }}
                          className="rounded-lg p-2 text-slate-300 hover:bg-slate-700 hover:text-white"
                          aria-label="編集"
                        >
                          <FontAwesomeIcon icon={faPen} className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-red-400"
                          aria-label="削除"
                        >
                          <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 週表示モード */}
          {viewMode === "week" && (
            <section className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:p-3">
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-700">
                <button
                  type="button"
                  onClick={() => shiftWeek(-7)}
                  className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 hover:bg-slate-200"
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                  <span>前週</span>
                </button>

                <button
                  type="button"
                  onClick={handleJumpToday}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-white hover:bg-slate-700"
                >
                  今日に戻る
                </button>

                <button
                  type="button"
                  onClick={() => shiftWeek(7)}
                  className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 hover:bg-slate-200"
                >
                  <span>次週</span>
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 rounded-xl bg-slate-800 p-1 sm:gap-1.5 sm:p-1.5">
                {weekDaysList.map((tab) => {
                  const isSelected = tab.key === selectedDate;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setSelectedDate(tab.key)}
                      className={cn(
                        "flex flex-col items-center rounded-lg px-0.5 py-2 text-[11px] font-bold transition sm:text-xs",
                        isSelected
                          ? "bg-amber-500 text-slate-950 shadow"
                          : "text-slate-300 hover:bg-slate-700"
                      )}
                    >
                      <span className="truncate">{tab.label}</span>
                      <span
                        className={cn(
                          "mt-0.5 text-[10px]",
                          !isSelected && tab.dayOfWeek === 0 && "text-red-400",
                          !isSelected && tab.dayOfWeek === 6 && "text-sky-400",
                          isSelected && "opacity-80"
                        )}
                      >
                        ({tab.subLabel})
                      </span>
                      <span
                        className={cn(
                          "mt-1 rounded-full px-1.5 text-[10px]",
                          isSelected ? "bg-slate-900 text-amber-400" : "bg-slate-700 text-slate-300"
                        )}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* 月表示モード */}
          {viewMode === "month" && (
            <section className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:p-3.5">
              <div className="mb-2.5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                  <span>前月</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 sm:text-base">
                    {monthCursor.year}年 {monthCursor.month + 1}月
                  </span>
                  <button
                    type="button"
                    onClick={handleJumpToday}
                    className="rounded-md bg-slate-800 px-2 py-1 text-[11px] font-bold text-white hover:bg-slate-700"
                  >
                    今月
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  <span>翌月</span>
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>

              {/* 曜日ヘッダー */}
              <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-bold">
                {["日", "月", "火", "水", "木", "金", "土"].map((w, idx) => (
                  <div
                    key={w}
                    className={cn(
                      "py-1",
                      idx === 0 ? "text-red-500" : idx === 6 ? "text-sky-600" : "text-slate-600"
                    )}
                  >
                    {w}
                  </div>
                ))}
              </div>

              {/* カレンダーグリッド */}
              <div className="grid grid-cols-7 gap-1">
                {monthGrid.map((cell) => {
                  const isSelected = cell.key === selectedDate;
                  return (
                    <button
                      key={cell.key}
                      type="button"
                      onClick={() => setSelectedDate(cell.key)}
                      className={cn(
                        "flex min-h-[56px] flex-col items-stretch rounded-lg border p-1 text-left transition sm:min-h-[76px] sm:p-1.5",
                        cell.isCurrentMonth ? "bg-white" : "bg-slate-50 opacity-45",
                        isSelected
                          ? "border-amber-500 bg-amber-50/80 ring-2 ring-amber-400"
                          : "border-slate-200 hover:border-slate-400"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold sm:text-xs",
                            cell.isToday && "bg-red-600 text-white",
                            !cell.isToday && cell.dayOfWeek === 0 && "text-red-600",
                            !cell.isToday && cell.dayOfWeek === 6 && "text-sky-600",
                            !cell.isToday &&
                              cell.dayOfWeek !== 0 &&
                              cell.dayOfWeek !== 6 &&
                              "text-slate-800"
                          )}
                        >
                          {cell.dayNumber}
                        </span>

                        {cell.dayEvents.length > 0 && (
                          <span className="rounded bg-slate-200 px-1 text-[9px] font-bold text-slate-700 sm:bg-transparent sm:px-0 sm:text-[10px] sm:text-slate-500">
                            {cell.dayEvents.length}
                            <span className="hidden sm:inline">件</span>
                          </span>
                        )}
                      </div>

                      {/* 長期コラボ開催中ライン */}
                      {cell.hasLongTerm && (
                        <div
                          className="mt-0.5 h-1.5 w-full rounded-full bg-purple-600"
                          title="コラボ・長期イベント開催中"
                        />
                      )}

                      {/* スマホ: 優先度ドットのみスッキリ表示 / PC(sm以上): イベントタイトル表示 */}
                      <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                        {cell.dayEvents.slice(0, 4).map((ev) => (
                          <span
                            key={ev.id}
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              PRIORITY_META[ev.priority].dotClass
                            )}
                          />
                        ))}
                      </div>

                      <div className="mt-1 hidden space-y-0.5 overflow-hidden sm:block">
                        {cell.dayEvents.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            className="flex items-center gap-1 truncate rounded bg-slate-100 px-1 text-[10px] font-bold text-slate-800"
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 shrink-0 rounded-full",
                                PRIORITY_META[ev.priority].dotClass
                              )}
                            />
                            <span className="truncate">{ev.title}</span>
                          </div>
                        ))}
                        {cell.dayEvents.length > 2 && (
                          <div className="text-right text-[9px] font-bold text-slate-500">
                            +{cell.dayEvents.length - 2}件
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 凡例 */}
              <div className="mt-2.5 flex flex-wrap items-center justify-end gap-3 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-1.5 w-3 rounded-full bg-purple-600" />
                  コラボ・長期
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                  最優先
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                  優先度:高
                </span>
              </div>
            </section>
          )}
        </div>

        {/* ==================== 右カラム（選択日のタイムライン詳細） ==================== */}
        <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 lg:sticky lg:top-16 lg:col-span-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <h1 className="flex items-center gap-1.5 text-sm font-bold text-slate-800 sm:text-base">
              <FontAwesomeIcon icon={faCalendarDays} className="text-amber-600" />
              <span>{selectedDate} のスケジュール</span>
            </h1>

            <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200">
              <input
                type="checkbox"
                checked={onlyHighPriority}
                onChange={(e) => setOnlyHighPriority(e.target.checked)}
                className="accent-amber-500"
              />
              <span>高優先のみ</span>
            </label>
          </div>

          {dailySchedule.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-xs text-slate-500 sm:text-sm">
              この日のイベント予定はありません。
              <br />
              「イベント追加」から登録できます。
            </div>
          ) : (
            <div className="space-y-2.5">
              {dailySchedule.map((ev) => {
                const startMs = new Date(ev.startAt).getTime();
                const endMs = new Date(ev.endAt).getTime();
                const nowMs = now.getTime();

                const isLive = nowMs >= startMs && nowMs <= endMs;
                const isUpcomingSoon = nowMs < startMs && startMs - nowMs <= 60 * 60 * 1000;
                const isFinished = nowMs > endMs;
                const pMeta = PRIORITY_META[ev.priority];

                return (
                  <div
                    key={ev.id}
                    className={cn(
                      "rounded-xl border bg-white p-3 shadow-sm transition",
                      pMeta.borderClass,
                      isLive && "border-red-400 bg-red-50/40 ring-1 ring-red-400",
                      isFinished && "opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="flex items-center gap-1 font-mono font-bold text-slate-800">
                            <FontAwesomeIcon icon={faClock} className="text-slate-500" />
                            {formatTime(ev.startAt)} 〜 {formatTime(ev.endAt)}
                          </span>

                          {isLive && (
                            <span className="animate-pulse rounded bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
                              開催中・{formatRemaining(endMs - nowMs)}
                            </span>
                          )}
                          {isUpcomingSoon && (
                            <span className="rounded bg-amber-400 px-2 py-0.5 text-[11px] font-bold text-slate-950">
                              まもなく・{formatRemaining(startMs - nowMs)}
                            </span>
                          )}
                          {isFinished && (
                            <span className="rounded bg-slate-300 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                              終了
                            </span>
                          )}

                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[11px] font-bold",
                              pMeta.badgeClass
                            )}
                          >
                            {pMeta.label}
                          </span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600">
                            {CATEGORY_LABEL[ev.category]}
                          </span>
                        </div>

                        <h2 className="text-sm font-bold text-slate-900 sm:text-base">{ev.title}</h2>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                          {ev.remindMinutes > 0 && (
                            <span className="flex items-center gap-1 font-medium text-amber-700">
                              <FontAwesomeIcon icon={faBell} />
                              {ev.remindMinutes}分前通知
                            </span>
                          )}
                          {ev.memo && <span className="break-words">{ev.memo}</span>}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEvent(ev);
                            setIsModalOpen(true);
                          }}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          aria-label="編集"
                        >
                          <FontAwesomeIcon icon={faPen} className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="削除"
                        >
                          <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* スマホ片手操作用のフローティング追加ボタン */}
      <button
        type="button"
        onClick={() => {
          setEditingEvent(null);
          setIsModalOpen(true);
        }}
        aria-label="イベントを追加"
        className="fixed right-4 bottom-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-slate-950 shadow-lg transition hover:bg-amber-400 active:scale-95 lg:hidden"
      >
        <FontAwesomeIcon icon={faPlus} className="h-6 w-6" />
      </button>

      {/* イベント追加・編集モーダル */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        initialEvent={editingEvent}
        defaultDate={selectedDate}
      />
    </main>
  );
};

export default Page;