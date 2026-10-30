"use client";

import { useState } from "react";
import { LIMITS, TONE_LABELS, TONES, type Bell, type Tone } from "@/lib/schema";
import { formatMmSs, parseMmSs } from "@/lib/time";
import { BellIcon, CloseIcon } from "./ui/icons";

const TONE_PILL: Record<Tone, string> = {
    blue: "border-itcc-blue-500 bg-itcc-blue-50 text-itcc-blue-700",
    orange: "border-itcc-red bg-tone-orange-fill text-itcc-red",
    red: "border-itcc-danger bg-tone-red-fill text-itcc-danger",
};

const COUNTS = Array.from({ length: LIMITS.bellCount.max + 1 }, (_, i) => i);

function parseTimeText(text: string): number | null {
    if (/^\s*\d{1,3}\s*$/.test(text)) return Number(text) * 60;
    return parseMmSs(text);
}

function TimeInput({ value, onCommit }: { value: number; onCommit: (sec: number) => void }) {
    const [text, setText] = useState<string | null>(null);

    function commit() {
        const parsed = text === null ? null : parseTimeText(text);
        if (parsed !== null) onCommit(parsed);
        setText(null);
    }

    return (
        <input
            type="text"
            inputMode="numeric"
            aria-label="Sisa waktu saat lonceng berbunyi (menit:detik)"
            value={text ?? formatMmSs(value)}
            onFocus={(e) => e.currentTarget.select()}
            onMouseUp={(e) => e.preventDefault()}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="w-24 rounded-md border-2 border-itcc-blue-200 bg-white px-2.5 py-1 text-center font-pixel text-xl text-itcc-ink"
        />
    );
}

type BellRowProps = {
    bell: Bell;
    error?: string;
    onChange: (bell: Bell) => void;
    onRemove: () => void;
};

export default function BellRow({ bell, error, onChange, onRemove }: BellRowProps) {
    const locked = bell.atSec === 0;

    return (
        <div className="flex flex-col gap-1.5">
            <div
                className={`flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-[10px] border bg-itcc-blue-25 py-2.5 pr-3 pl-4 text-[15px] font-semibold ${
                    error ? "border-itcc-orange-500" : "border-itcc-blue-100"
                }`}
            >
                <BellIcon className="text-itcc-orange-500" />
                <span>{locked ? "Saat waktu habis" : "Saat sisa"}</span>
                {locked ? (
                    <span className="rounded-md border-2 border-itcc-blue-200 bg-white px-2.5 py-1 font-pixel text-xl">
                        00:00
                    </span>
                ) : (
                    <TimeInput
                        value={bell.atSec}
                        onCommit={(atSec) => onChange({ ...bell, atSec })}
                    />
                )}
                <span>bunyi</span>
                <label className="inline-flex items-center gap-1.5">
                    <span className="sr-only">Jumlah bunyi</span>
                    <select
                        value={bell.count}
                        onChange={(e) => onChange({ ...bell, count: Number(e.target.value) })}
                        className="h-10 rounded-md border-2 border-itcc-blue-200 bg-white px-2 font-bold text-itcc-ink"
                    >
                        {COUNTS.map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                    ×
                </label>
                <span>lalu warna</span>
                {locked ? (
                    <span
                        className={`rounded-full border-2 px-3 py-1 text-sm font-semibold ${TONE_PILL.red}`}
                    >
                        {TONE_LABELS.red}
                    </span>
                ) : (
                    <label>
                        <span className="sr-only">Warna setelah lonceng berbunyi</span>
                        <select
                            value={bell.tone}
                            onChange={(e) => onChange({ ...bell, tone: e.target.value as Tone })}
                            className={`rounded-full border-2 px-3 py-1 text-sm font-semibold ${TONE_PILL[bell.tone]}`}
                        >
                            {TONES.map((tone) => (
                                <option key={tone} value={tone}>
                                    {TONE_LABELS[tone]}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
                <span className="flex-auto" />
                {locked ? (
                    <span className="pr-2 text-[13px] font-normal text-itcc-muted">wajib</span>
                ) : (
                    <button
                        type="button"
                        onClick={onRemove}
                        aria-label={`Hapus pengingat sisa ${formatMmSs(bell.atSec)}`}
                        className="grid size-11 cursor-pointer place-items-center rounded-lg text-itcc-orange-500 hover:bg-itcc-peach-200"
                    >
                        <CloseIcon size={16} />
                    </button>
                )}
            </div>
            {error && (
                <p role="alert" className="text-[13px] font-semibold text-itcc-danger">
                    {error}
                </p>
            )}
        </div>
    );
}
