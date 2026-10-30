"use client";

import { useId, useState, type ReactNode } from "react";
import { addSuggestedBell, sortBellsForDisplay, splitDuration } from "@/lib/editor";
import { LIMITS, type Bell, type Session } from "@/lib/schema";
import BellRow from "./BellRow";
import SessionTimeline from "./SessionTimeline";
import FramePanel from "./ui/FramePanel";
import { ChevronDownIcon, ChevronUpIcon, DuplicateIcon, PlusIcon, TrashIcon } from "./ui/icons";

type SessionEditorProps = {
    session: Session;
    index: number;
    total: number;
    canDuplicate: boolean;
    error: (path: string) => string | undefined;
    onChange: (session: Session) => void;
    onMove: (offset: -1 | 1) => void;
    onDuplicate: () => void;
    onRemove: () => void;
};

const INPUT =
    "h-11.5 rounded-lg border-2 bg-itcc-input text-itcc-ink aria-invalid:border-itcc-orange-500 aria-invalid:bg-itcc-danger-bg";

function NumberBox({
    value,
    max,
    label,
    invalid,
    onCommit,
}: {
    value: number;
    max: number;
    label: string;
    invalid: boolean;
    onCommit: (value: number) => void;
}) {
    const [text, setText] = useState<string | null>(null);

    return (
        <input
            type="text"
            inputMode="numeric"
            aria-label={label}
            aria-invalid={invalid || undefined}
            value={text ?? String(value).padStart(2, "0")}
            onFocus={(e) => e.currentTarget.select()}
            onMouseUp={(e) => e.preventDefault()}
            onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 3);
                setText(digits);
                onCommit(Math.min(max, Number(digits || 0)));
            }}
            onBlur={() => setText(null)}
            className={`w-19 border-itcc-blue-200 text-center font-pixel text-[22px] ${INPUT}`}
        />
    );
}

function IconButton({
    label,
    danger,
    disabled,
    onClick,
    children,
}: {
    label: string;
    danger?: boolean;
    disabled?: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={onClick}
            className={`grid size-11 cursor-pointer place-items-center rounded-lg disabled:cursor-not-allowed disabled:opacity-35 ${
                danger
                    ? "text-itcc-orange-500 enabled:hover:bg-itcc-peach-200"
                    : "text-itcc-blue-700 enabled:hover:bg-itcc-blue-50"
            }`}
        >
            {children}
        </button>
    );
}

export default function SessionEditor({
    session,
    index,
    total,
    canDuplicate,
    error,
    onChange,
    onMove,
    onDuplicate,
    onRemove,
}: SessionEditorProps) {
    const id = useId();
    const number = String(index + 1).padStart(2, "0");
    const { minutes, seconds } = splitDuration(session.durationSec);
    const nameError = error("name");
    const durationError = error("durationSec");
    const bellsError = error("bells");

    const setDuration = (m: number, s: number) => onChange({ ...session, durationSec: m * 60 + s });
    const updateBell = (bell: Bell) =>
        onChange({ ...session, bells: session.bells.map((b) => (b.id === bell.id ? bell : b)) });
    const removeBell = (bellId: string) =>
        onChange({ ...session, bells: session.bells.filter((b) => b.id !== bellId) });

    return (
        <FramePanel size="sm" aria-label={`Sesi ${index + 1}, ${session.name}`}>
            <div className="flex flex-wrap items-end gap-3.5">
                <span className="self-center rounded-md border-2 border-itcc-orange-900 bg-linear-to-b from-itcc-orange-300 to-itcc-orange-500 px-2.5 py-1.5 font-pixel text-base tracking-[1px] text-white">
                    SESI {number}
                </span>

                <div className="flex min-w-55 flex-1 flex-col gap-1.5">
                    <label
                        htmlFor={`${id}-name`}
                        className="text-[13px] font-semibold text-itcc-blue-700"
                    >
                        Nama sesi
                    </label>
                    <input
                        id={`${id}-name`}
                        value={session.name}
                        maxLength={LIMITS.sessionName.max}
                        onChange={(e) => onChange({ ...session, name: e.target.value })}
                        aria-invalid={nameError ? true : undefined}
                        aria-describedby={nameError ? `${id}-name-error` : undefined}
                        className={`w-full border-itcc-blue-200 px-3.5 font-semibold ${INPUT}`}
                    />
                </div>

                <fieldset className="flex flex-col gap-1.5">
                    <legend className="mb-1.5 text-[13px] font-semibold text-itcc-blue-700">
                        Durasi (menit : detik)
                    </legend>
                    <div className="flex items-center gap-1.5">
                        <NumberBox
                            label="Menit"
                            value={minutes}
                            max={LIMITS.durationSec.max / 60}
                            invalid={Boolean(durationError)}
                            onCommit={(m) => setDuration(m, seconds)}
                        />
                        <span
                            aria-hidden="true"
                            className="font-pixel text-[22px] text-itcc-blue-700"
                        >
                            :
                        </span>
                        <NumberBox
                            label="Detik"
                            value={seconds}
                            max={59}
                            invalid={Boolean(durationError)}
                            onCommit={(s) => setDuration(minutes, s)}
                        />
                    </div>
                </fieldset>

                <div className="ml-auto flex gap-1">
                    <IconButton
                        label="Pindah sesi ke atas"
                        disabled={index === 0}
                        onClick={() => onMove(-1)}
                    >
                        <ChevronUpIcon />
                    </IconButton>
                    <IconButton
                        label="Pindah sesi ke bawah"
                        disabled={index === total - 1}
                        onClick={() => onMove(1)}
                    >
                        <ChevronDownIcon />
                    </IconButton>
                    <IconButton
                        label="Duplikat sesi"
                        disabled={!canDuplicate}
                        onClick={onDuplicate}
                    >
                        <DuplicateIcon />
                    </IconButton>
                    <IconButton label="Hapus sesi" danger onClick={onRemove}>
                        <TrashIcon />
                    </IconButton>
                </div>
            </div>

            {(nameError || durationError) && (
                <div
                    role="alert"
                    className="-mt-2 flex flex-col text-[13px] font-semibold text-itcc-danger"
                >
                    {nameError && <p id={`${id}-name-error`}>{nameError}</p>}
                    {durationError && <p>{durationError}</p>}
                </div>
            )}

            <SessionTimeline session={session} />

            <div className="flex flex-col gap-2.5">
                <h3 className="font-pixel text-lg font-normal tracking-[1px] text-itcc-blue-700">
                    LONCENG PENGINGAT
                </h3>
                {sortBellsForDisplay(session.bells).map((bell) => (
                    <BellRow
                        key={bell.id}
                        bell={bell}
                        error={error(`bells.${session.bells.indexOf(bell)}.atSec`)}
                        onChange={updateBell}
                        onRemove={() => removeBell(bell.id)}
                    />
                ))}
                {bellsError && (
                    <p role="alert" className="text-[13px] font-semibold text-itcc-danger">
                        {bellsError}
                    </p>
                )}
                <button
                    type="button"
                    onClick={() => onChange(addSuggestedBell(session))}
                    disabled={session.bells.length >= LIMITS.bellsPerSession}
                    className="inline-flex cursor-pointer items-center gap-1.5 self-start px-0.5 py-2.5 text-[15px] font-semibold text-itcc-blue-700 underline underline-offset-3 hover:text-itcc-blue-500 disabled:cursor-not-allowed disabled:opacity-45"
                >
                    <PlusIcon size={16} />
                    Tambah pengingat
                </button>
            </div>
        </FramePanel>
    );
}
