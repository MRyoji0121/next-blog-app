"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faBell, faStar } from "@fortawesome/free-solid-svg-icons";
import { EventCategory, Priority, ScheduleEvent } from "@/app/_types/schedule";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: ScheduleEvent) => void;
  initialEvent?: ScheduleEvent | null;
  defaultDate: string; // "YYYY-MM-DD"
};

export const EventModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  initialEvent,
  defaultDate,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<EventCategory>("advent");
  const [priority, setPriority] = useState<Priority>("high");
  const [isLongTerm, setIsLongTerm] = useState(false);
  const [startAt, setStartAt] = useState(`${defaultDate}T19:00`);
  const [endAt, setEndAt] = useState(`${defaultDate}T22:00`);
  const [remindMinutes, setRemindMinutes] = useState<number>(15);
  const [memo, setMemo] = useState("");

  useEffect(() => {
    if (initialEvent) {
      setTitle(initialEvent.title);
      setCategory(initialEvent.category);
      setPriority(initialEvent.priority);
      setIsLongTerm(initialEvent.isLongTerm);
      setStartAt(initialEvent.startAt);
      setEndAt(initialEvent.endAt);
      setRemindMinutes(initialEvent.remindMinutes);
      setMemo(initialEvent.memo || "");
    } else {
      setTitle("");
      setCategory("advent");
      setPriority("high");
      setIsLongTerm(false);
      setStartAt(`${defaultDate}T19:00`);
      setEndAt(`${defaultDate}T22:00`);
      setRemindMinutes(15);
      setMemo("");
    }
  }, [initialEvent, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (new Date(startAt) >= new Date(endAt)) {
      alert("終了日時は開始日時より後に設定してください。");
      return;
    }

    onSave({
      id: initialEvent ? initialEvent.id : crypto.randomUUID(),
      title: title.trim(),
      category,
      priority,
      startAt,
      endAt,
      isLongTerm,
      remindMinutes,
      memo: memo.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 text-white shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-slate-700 pb-3">
          <h2 className="text-lg font-bold">
            {initialEvent ? "イベントを編集" : "新規イベント・リマインダー追加"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="mb-1 block font-bold text-slate-300">
              イベント名 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例: 〇〇コラボ 超究極 / 禁忌の獄"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-bold text-slate-300">カテゴリ</label>
              <select
                value={category}
                onChange={(e) => {
                  const val = e.target.value as EventCategory;
                  setCategory(val);
                  if (val === "collab" || val === "campaign") {
                    setIsLongTerm(true);
                  }
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="collab">コラボ</option>
                <option value="advent">降臨・クエスト</option>
                <option value="campaign">キャンペーン</option>
                <option value="other">その他・ガチャ</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-300">
                <FontAwesomeIcon icon={faStar} className="mr-1 text-amber-400" />
                優先度
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="urgent">最優先（絶対参加）</option>
                <option value="high">高（優先）</option>
                <option value="medium">中（通常）</option>
                <option value="low">低（余裕があれば）</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 p-2.5">
            <input
              id="isLongTerm"
              type="checkbox"
              checked={isLongTerm}
              onChange={(e) => setIsLongTerm(e.target.checked)}
              className="h-4 w-4 accent-amber-500"
            />
            <label htmlFor="isLongTerm" className="cursor-pointer text-xs text-slate-200">
              <strong>長期開催枠（上部バナー）</strong>として表示する（コラボ期間など）
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-bold text-slate-300">開始日時</label>
              <input
                type="datetime-local"
                required
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold text-slate-300">終了日時</label>
              <input
                type="datetime-local"
                required
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-bold text-slate-300">
              <FontAwesomeIcon icon={faBell} className="mr-1 text-amber-400" />
              リマインド通知
            </label>
            <select
              value={remindMinutes}
              onChange={(e) => setRemindMinutes(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
            >
              <option value={0}>通知なし</option>
              <option value={5}>開始 5分前</option>
              <option value={15}>開始 15分前</option>
              <option value={30}>開始 30分前</option>
              <option value={60}>開始 1時間前</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block font-bold text-slate-300">メモ（適正キャラ・周回目標など）</label>
            <textarea
              rows={2}
              placeholder="例: 運極作成まであと35体 / 宝箱使用"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-700 px-4 py-2 font-bold text-slate-200 hover:bg-slate-600"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="rounded-lg bg-amber-500 px-5 py-2 font-bold text-slate-950 hover:bg-amber-400"
            >
              保存する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};