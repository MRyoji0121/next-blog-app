"use client";

import React, { useState, useEffect } from "react";
import { cn } from "cn";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faPlus,
  faMinus,
  faRotateLeft,
  faTrophy,
  faSkull,
  faBolt,
  faRepeat,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { ExCounterItem } from "@/app/_types/schedule";

const EX_STORAGE_KEY = "monst_ex_counters_v1";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

function createDefaultItem(name = "EXターゲット 1"): ExCounterItem {
  return {
    id: crypto.randomUUID(),
    name,
    runs: 0,
    encounters: 0,
    defeats: 0,
    luck: 0,
    memo: "",
  };
}

export const ExCounterModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<ExCounterItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(EX_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: ExCounterItem[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
          setSelectedId(parsed[0].id);
          return;
        }
      } catch {
        // パース失敗時は初期データ生成へ
      }
    }
    const initial = [createDefaultItem("アーキレット / EX周回")];
    setItems(initial);
    setSelectedId(initial[0].id);
    localStorage.setItem(EX_STORAGE_KEY, JSON.stringify(initial));
  }, []);

  const persist = (nextItems: ExCounterItem[]) => {
    setItems(nextItems);
    localStorage.setItem(EX_STORAGE_KEY, JSON.stringify(nextItems));
  };

  const current = items.find((item) => item.id === selectedId) || items[0];

  const updateCurrent = (patch: Partial<ExCounterItem>) => {
    if (!current) return;
    const next = items.map((item) =>
      item.id === current.id ? { ...item, ...patch } : item
    );
    persist(next);
  };

  const handleAddTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const created = createDefaultItem(newName.trim());
    const next = [...items, created];
    persist(next);
    setSelectedId(created.id);
    setNewName("");
    setIsAdding(false);
  };

  const handleDeleteTarget = (id: string) => {
    if (items.length <= 1) {
      alert("最後の1件は削除できません。リセット機能をご利用ください。");
      return;
    }
    if (!confirm("このEXカウンターを削除しますか？")) return;
    const next = items.filter((item) => item.id !== id);
    persist(next);
    setSelectedId(next[0].id);
  };

  const handleReset = () => {
    if (!current) return;
    if (!confirm(`「${current.name}」のカウントをすべて0にリセットしますか？`)) return;
    updateCurrent({ runs: 0, encounters: 0, defeats: 0, luck: 0 });
  };

  if (!isOpen || !current) return null;

  // 自動計算指標
  const encounterRate =
    current.runs > 0 ? ((current.encounters / current.runs) * 100).toFixed(1) : "0.0";
  const wins = Math.max(0, current.encounters - current.defeats);
  const winRate =
    current.encounters > 0 ? ((wins / current.encounters) * 100).toFixed(1) : "0.0";
  const remainingLuck = Math.max(0, 99 - current.luck);
  const luckPercent = Math.min(100, Math.round((current.luck / 99) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-slate-700 bg-slate-900 p-4 text-white shadow-2xl sm:rounded-2xl sm:p-6">
        {/* ヘッダー */}
        <div className="mb-4 flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-slate-950">
              <FontAwesomeIcon icon={faTrophy} />
            </span>
            <div>
              <h2 className="text-lg font-bold leading-tight">EX周回カウンター</h2>
              <p className="text-xs text-slate-400">遭遇率・勝率・運極進捗を自動計算</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="閉じる"
          >
            <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
          </button>
        </div>

        {/* ターゲット切り替えタブ */}
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {items.map((item) => {
              const active = item.id === current.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-bold transition sm:text-sm",
                    active
                      ? "bg-amber-500 text-slate-950 shadow"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  )}
                >
                  {item.name}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setIsAdding((v) => !v)}
              className="rounded-lg border border-dashed border-slate-600 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:border-amber-400 hover:text-amber-300"
            >
              ＋ 対象追加
            </button>
          </div>

          {isAdding && (
            <form onSubmit={handleAddTarget} className="mt-2.5 flex gap-2">
              <input
                type="text"
                placeholder="キャラ名（例: コルティーナ）"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-base text-white focus:border-amber-500 focus:outline-none sm:text-sm"
              />
              <button
                type="submit"
                className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                追加
              </button>
            </form>
          )}
        </div>

        {/* ターゲット名編集 & 削除 */}
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-800/80 p-3">
          <input
            type="text"
            value={current.name}
            onChange={(e) => updateCurrent({ name: e.target.value })}
            aria-label="ターゲット名"
            className="min-w-0 flex-1 bg-transparent text-base font-bold text-white focus:outline-none"
          />
          <button
            type="button"
            onClick={handleReset}
            title="カウントを0に戻す"
            className="rounded-lg bg-slate-700 px-2.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-600"
          >
            <FontAwesomeIcon icon={faRotateLeft} className="mr-1" />
            リセット
          </button>
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => handleDeleteTarget(current.id)}
              title="この対象を削除"
              className="rounded-lg bg-slate-700 p-2 text-slate-300 hover:bg-red-600 hover:text-white"
            >
              <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* ラック進捗バー（運極99まで） */}
        <div className="mb-4 rounded-xl border border-slate-700 bg-slate-800/70 p-3.5">
          <div className="mb-1.5 flex items-end justify-between">
            <span className="text-xs font-bold text-slate-300">運極（ラック99）達成度</span>
            <span className="text-sm font-bold text-amber-400">
              {current.luck >= 99 ? (
                "🎉 運極達成！"
              ) : (
                <>
                  あと <span className="text-lg">{remainingLuck}</span> 体（{luckPercent}%）
                </>
              )}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-950">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                current.luck >= 99
                  ? "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500"
                  : "bg-amber-500"
              )}
              style={{ width: `${luckPercent}%` }}
            />
          </div>
        </div>

        {/* 4大カウンターパネル（周回・遭遇・敗北・ラック） */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* 1. 周回数 */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-bold text-sky-400">
                <FontAwesomeIcon icon={faRepeat} />
                周回数
              </span>
              <span className="text-xs text-slate-400">クエストクリア数</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => updateCurrent({ runs: Math.max(0, current.runs - 1) })}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-700 text-white active:scale-95 hover:bg-slate-600"
              >
                <FontAwesomeIcon icon={faMinus} />
              </button>
              <span className="font-mono text-3xl font-extrabold">{current.runs}</span>
              <button
                type="button"
                onClick={() => updateCurrent({ runs: current.runs + 1 })}
                className="flex h-11 w-14 items-center justify-center rounded-xl bg-sky-600 text-lg font-bold text-white shadow active:scale-95 hover:bg-sky-500"
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
          </div>

          {/* 2. 遭遇数 */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-bold text-amber-400">
                <FontAwesomeIcon icon={faBolt} />
                EX遭遇
              </span>
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300">
                遭遇率 {encounterRate}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  updateCurrent({ encounters: Math.max(0, current.encounters - 1) })
                }
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-700 text-white active:scale-95 hover:bg-slate-600"
              >
                <FontAwesomeIcon icon={faMinus} />
              </button>
              <span className="font-mono text-3xl font-extrabold text-amber-400">
                {current.encounters}
              </span>
              <button
                type="button"
                onClick={() =>
                  updateCurrent({
                    encounters: current.encounters + 1,
                    // 周回数より遭遇が多くなった場合は周回数も自動で合わせる
                    runs: Math.max(current.runs, current.encounters + 1),
                  })
                }
                className="flex h-11 w-14 items-center justify-center rounded-xl bg-amber-500 text-lg font-bold text-slate-950 shadow active:scale-95 hover:bg-amber-400"
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
          </div>

          {/* 3. 敗北数 */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-bold text-rose-400">
                <FontAwesomeIcon icon={faSkull} />
                敗北数
              </span>
              <span className="rounded bg-slate-700 px-2 py-0.5 text-xs font-bold text-slate-300">
                勝率 {winRate}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => updateCurrent({ defeats: Math.max(0, current.defeats - 1) })}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-700 text-white active:scale-95 hover:bg-slate-600"
              >
                <FontAwesomeIcon icon={faMinus} />
              </button>
              <span className="font-mono text-3xl font-extrabold text-rose-400">
                {current.defeats}
              </span>
              <button
                type="button"
                onClick={() => updateCurrent({ defeats: current.defeats + 1 })}
                className="flex h-11 w-14 items-center justify-center rounded-xl bg-rose-600 text-lg font-bold text-white shadow active:scale-95 hover:bg-rose-500"
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
          </div>

          {/* 4. ラック */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-400">
                <FontAwesomeIcon icon={faTrophy} />
                現在ラック
              </span>
              <span className="text-xs text-slate-400">最大 99</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => updateCurrent({ luck: Math.max(0, current.luck - 1) })}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-700 text-white active:scale-95 hover:bg-slate-600"
              >
                <FontAwesomeIcon icon={faMinus} />
              </button>
              <span className="font-mono text-3xl font-extrabold text-emerald-400">
                {current.luck}
              </span>
              <button
                type="button"
                onClick={() => updateCurrent({ luck: Math.min(99, current.luck + 1) })}
                className="flex h-11 w-14 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white shadow active:scale-95 hover:bg-emerald-500"
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
            {/* まとめて加算ショートカット（至宝・2体ドロップ用） */}
            <div className="mt-2 flex justify-center gap-1.5">
              {[2, 3, 5].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => updateCurrent({ luck: Math.min(99, current.luck + step) })}
                  className="rounded bg-slate-700 px-2.5 py-1 text-xs font-bold text-emerald-300 hover:bg-slate-600"
                >
                  +{step}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 編成メモ欄 */}
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-400">
            周回編成・立ち回りメモ
          </label>
          <textarea
            rows={2}
            placeholder="例: 運枠1 + 強友情3 / ボス戦は守護獣パック使用"
            value={current.memo || ""}
            onChange={(e) => updateCurrent({ memo: e.target.value })}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-base text-white focus:border-amber-500 focus:outline-none sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
};