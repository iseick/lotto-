"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDrawAction } from "../actions";
import { NumberInputs } from "./NumberInputs";

export function DrawForm({
  defaultRound,
  defaultDate,
}: {
  defaultRound: number;
  defaultDate: string;
}) {
  const router = useRouter();
  const [round, setRound] = useState(String(defaultRound));
  const [date, setDate] = useState(defaultDate);
  const [nums, setNums] = useState<string[]>(Array(6).fill(""));
  const [bonus, setBonus] = useState("");
  const [winners, setWinners] = useState("");
  const [prize, setPrize] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setMsg(null);
    const numbers = nums.map((s) => parseInt(s));
    const b = parseInt(bonus);
    start(async () => {
      const res = await addDrawAction({
        round: parseInt(round),
        draw_date: date,
        numbers,
        bonus: b,
        first_winners: winners ? parseInt(winners) : null,
        first_prize: prize ? parseInt(prize) : null,
      });
      if (res.ok) {
        setMsg("✓ 저장되었습니다");
        router.push("/draws");
      } else {
        setMsg("⚠ " + res.error);
      }
    });
  }

  return (
    <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm text-neutral-600">회차 *</span>
          <input
            type="number"
            className="input"
            value={round}
            onChange={(e) => setRound(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-neutral-600">추첨일 *</span>
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>

      <div>
        <span className="mb-1 block text-sm text-neutral-600">당첨번호 6개 *</span>
        <NumberInputs values={nums} onChange={setNums} />
      </div>

      <label className="block max-w-[8rem]">
        <span className="mb-1 block text-sm text-neutral-600">보너스 *</span>
        <input
          type="number"
          min={1}
          max={45}
          className="input"
          value={bonus}
          onChange={(e) => setBonus(e.target.value)}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm text-neutral-600">
            1등 당첨자수 (선택)
          </span>
          <input
            type="number"
            className="input"
            value={winners}
            onChange={(e) => setWinners(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-neutral-600">
            1등 상금 (선택)
          </span>
          <input
            type="number"
            className="input"
            value={prize}
            onChange={(e) => setPrize(e.target.value)}
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={pending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {pending ? "저장 중…" : "당첨번호 저장"}
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
    </div>
  );
}
