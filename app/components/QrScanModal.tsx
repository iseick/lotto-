"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";

export function QrScanModal({
  onDetected,
  onClose,
}: {
  onDetected: (text: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  useEffect(() => {
    const reader = new BrowserQRCodeReader();
    let controls: IScannerControls | undefined;
    let done = false;

    reader
      .decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoRef.current!,
        (result, _err, ctrl) => {
          controls = ctrl;
          if (result && !done) {
            done = true;
            ctrl.stop();
            onDetected(result.getText());
          }
        }
      )
      .then((c) => {
        controls = c;
      })
      .catch((e) => {
        setError(
          e?.name === "NotAllowedError"
            ? "카메라 권한이 거부되었습니다. 아래에 QR 링크를 붙여넣어도 됩니다."
            : "카메라를 열 수 없습니다. 아래에 QR 링크를 붙여넣으세요."
        );
      });

    return () => {
      done = true;
      controls?.stop();
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm space-y-3 rounded-xl bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">로또 용지 QR 스캔</h3>
          <button
            onClick={onClose}
            className="text-sm text-neutral-400 hover:text-neutral-700"
          >
            닫기 ✕
          </button>
        </div>

        <div className="overflow-hidden rounded-lg bg-black">
          <video
            ref={videoRef}
            className="aspect-square w-full object-cover"
            playsInline
            muted
          />
        </div>

        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <p className="text-sm text-neutral-500">
            용지 하단의 QR을 사각형 안에 비추세요.
          </p>
        )}

        <div className="border-t border-neutral-100 pt-3">
          <label className="mb-1 block text-xs text-neutral-500">
            또는 QR 링크 직접 붙여넣기
          </label>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="https://m.dhlottery.co.kr/qr.do?...v=..."
              value={manual}
              onChange={(e) => setManual(e.target.value)}
            />
            <button
              onClick={() => manual.trim() && onDetected(manual.trim())}
              className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white"
            >
              적용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
