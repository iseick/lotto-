"use client";

import { useState, useTransition } from "react";
import { createStoreAction } from "../actions";

export function StoreForm() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setMsg(null);
    start(async () => {
      const res = await createStoreAction({ name, address, memo });
      if (res.ok) {
        setName("");
        setAddress("");
        setMemo("");
        setMsg("✓ 등록되었습니다");
      } else {
        setMsg("⚠ " + res.error);
      }
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="font-bold">새 판매점 등록</h2>
      <Field label="이름 *">
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 행운복권방"
        />
      </Field>
      <Field label="주소">
        <input
          className="input"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="예: 서울 강남구 …"
        />
      </Field>
      <Field label="메모">
        <input
          className="input"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="선택"
        />
      </Field>
      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={pending || !name.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {pending ? "등록 중…" : "등록"}
        </button>
        {msg && (
          <span
            className={
              msg.startsWith("✓") ? "text-sm text-green-600" : "text-sm text-red-600"
            }
          >
            {msg}
          </span>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-neutral-600">{label}</span>
      {children}
    </label>
  );
}
