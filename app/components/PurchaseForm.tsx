"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPurchaseAction, createStoreAction } from "../actions";
import { NumberInputs } from "./NumberInputs";
import { QrScanModal } from "./QrScanModal";
import { parseLottoQr } from "@/lib/lottoQr";
import type { GameMode } from "@/lib/purchases";

interface StoreOption {
  id: number;
  name: string;
}

interface GameState {
  slot: string;
  mode: GameMode;
  nums: string[];
}

const SLOTS = ["A", "B", "C", "D", "E", "F", "G"];

function emptyGame(slot: string): GameState {
  return { slot, mode: "auto", nums: Array(6).fill("") };
}

export function PurchaseForm({
  stores,
  defaultRound,
  defaultDate,
}: {
  stores: StoreOption[];
  defaultRound: number;
  defaultDate: string;
}) {
  const router = useRouter();
  const [round, setRound] = useState(String(defaultRound));
  const [date, setDate] = useState(defaultDate);

  const [newStore, setNewStore] = useState(stores.length === 0);
  const [storeId, setStoreId] = useState<string>(
    stores[0] ? String(stores[0].id) : ""
  );
  const [storeName, setStoreName] = useState("");
  const [storeAddr, setStoreAddr] = useState("");

  const [games, setGames] = useState<GameState[]>(
    SLOTS.slice(0, 5).map(emptyGame)
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [pending, start] = useTransition();

  function setGame(i: number, patch: Partial<GameState>) {
    setGames((gs) => gs.map((g, j) => (j === i ? { ...g, ...patch } : g)));
  }

  // QR 스캔/링크 결과로 회차+게임 자동 채우기.
  function handleQr(text: string) {
    const parsed = parseLottoQr(text);
    setScanning(false);
    if (!parsed) {
      setMsg("⚠ QR을 인식하지 못했습니다. 로또 용지 QR이 맞는지 확인하세요.");
      return;
    }
    setRound(String(parsed.round));
    setGames(
      parsed.games.map((g, i) => ({
        slot: SLOTS[i] ?? "",
        mode: g.mode,
        nums: g.numbers.map((n) => String(n)),
      }))
    );
    setMsg(`✓ QR에서 ${parsed.round}회 ${parsed.games.length}게임을 불러왔습니다`);
  }
  function addGame() {
    setGames((gs) => [...gs, emptyGame(SLOTS[gs.length] ?? "")]);
  }
  function removeGame(i: number) {
    setGames((gs) => gs.filter((_, j) => j !== i));
  }

  function submit() {
    setMsg(null);
    start(async () => {
      let sid: number | null = null;
      if (newStore) {
        if (!storeName.trim()) {
          setMsg("⚠ 새 판매점 이름을 입력하세요");
          return;
        }
        const sres = await createStoreAction({
          name: storeName,
          address: storeAddr,
          first_round: parseInt(round) || null,
        });
        if (!sres.ok) {
          setMsg("⚠ 판매점 등록 실패: " + sres.error);
          return;
        }
        sid = sres.id ?? null;
      } else {
        sid = storeId ? parseInt(storeId) : null;
      }

      const res = await createPurchaseAction({
        round: parseInt(round),
        store_id: sid,
        purchase_date: date,
        games: games.map((g) => ({
          slot: g.slot,
          mode: g.mode,
          numbers: g.nums.map((s) => parseInt(s)),
        })),
      });
      if (res.ok) {
        router.push("/purchases");
      } else {
        setMsg("⚠ " + res.error);
      }
    });
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => {
          setMsg(null);
          setScanning(true);
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100"
      >
        📷 로또 용지 QR 스캔해서 자동 입력
      </button>

      <div className="grid grid-cols-2 gap-3 rounded-xl border border-neutral-200 bg-white p-5">
        <label className="block">
          <span className="mb-1 block text-sm text-neutral-600">응모 회차 *</span>
          <input
            type="number"
            className="input"
            value={round}
            onChange={(e) => setRound(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-neutral-600">구매일</span>
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        <div className="col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm text-neutral-600">판매점</span>
            {stores.length > 0 && (
              <button
                type="button"
                onClick={() => setNewStore((v) => !v)}
                className="text-xs text-blue-600 hover:underline"
              >
                {newStore ? "기존 판매점 선택" : "+ 새 판매점"}
              </button>
            )}
          </div>
          {newStore ? (
            <div className="grid grid-cols-2 gap-2">
              <input
                className="input"
                placeholder="판매점 이름 *"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
              <input
                className="input"
                placeholder="주소 (선택)"
                value={storeAddr}
                onChange={(e) => setStoreAddr(e.target.value)}
              />
            </div>
          ) : (
            <select
              className="input"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
            >
              <option value="">(선택 안 함)</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">게임 ({games.length}줄)</h2>
          <span className="text-sm text-neutral-500">
            {(games.length * 1000).toLocaleString("ko-KR")}원
          </span>
        </div>
        {games.map((g, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3 first:border-0 first:pt-0"
          >
            <span className="w-5 font-bold text-neutral-500">{g.slot}</span>
            <select
              className="input w-24"
              value={g.mode}
              onChange={(e) =>
                setGame(i, { mode: e.target.value as GameMode })
              }
            >
              <option value="auto">자동</option>
              <option value="manual">수동</option>
              <option value="semi">반자동</option>
            </select>
            <NumberInputs
              values={g.nums}
              onChange={(nums) => setGame(i, { nums })}
            />
            {games.length > 1 && (
              <button
                type="button"
                onClick={() => removeGame(i)}
                className="ml-auto text-xs text-neutral-400 hover:text-red-500"
              >
                삭제
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addGame}
          className="text-sm text-blue-600 hover:underline"
        >
          + 게임 추가
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={pending}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {pending ? "저장 중…" : "구매 저장"}
        </button>
        {msg && (
          <span
            className={
              msg.startsWith("✓")
                ? "text-sm text-green-600"
                : "text-sm text-red-600"
            }
          >
            {msg}
          </span>
        )}
      </div>

      {scanning && (
        <QrScanModal onDetected={handleQr} onClose={() => setScanning(false)} />
      )}
    </div>
  );
}
