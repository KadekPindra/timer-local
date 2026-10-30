"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useBell } from "@/hooks/useBell";
import { toggleFullscreen, useFullscreen } from "@/hooks/useFullscreen";
import { useHotkeys } from "@/hooks/useHotkeys";
import { usePlayer } from "@/hooks/usePlayer";
import { useWakeLock } from "@/hooks/useWakeLock";
import { bellPositionPct } from "@/lib/editor";
import { bellToastText, nextBellInfo, progressPct } from "@/lib/play-text";
import { formatClock, formatMmSs } from "@/lib/time";
import { currentTone, statusLabel } from "@/lib/timer-engine";
import BellToast from "./BellToast";
import CategoryBadge from "./CategoryBadge";
import ConfirmDialog, { type ConfirmRequest } from "./ConfirmDialog";
import NotFoundPanel from "./NotFoundPanel";
import SessionStepper from "./SessionStepper";
import TimerDisplay from "./TimerDisplay";
import {
    ChevronRightIcon,
    CloseIcon,
    ExitFullscreenIcon,
    FullscreenIcon,
    PauseIcon,
    PlayIcon,
    ResetIcon,
    VolumeIcon,
} from "./ui/icons";
import PixelButton from "./ui/PixelButton";
import PixelLink from "./ui/PixelLink";

type Toast = { text: string; key: number };

const ICON_BUTTON =
    "grid size-11 cursor-pointer place-items-center rounded-lg text-itcc-blue-700 hover:bg-itcc-blue-500/10";

export default function TimerScreen({ id }: { id: string }) {
    const router = useRouter();
    const bell = useBell();
    const { isFullscreen, isSupported } = useFullscreen();
    const [toast, setToast] = useState<Toast | null>(null);
    const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
    const teamInput = useRef<HTMLInputElement>(null);

    const showToast = (text: string) => setToast({ text, key: Date.now() });

    const { state, session, meta, remaining, actions } = usePlayer(id, (rung) => {
        void bell.ring(rung.count);
        showToast(bellToastText(rung));
    });

    const runtime = state.runtime;
    const status = runtime?.status ?? "idle";
    const running = status === "running";
    const sessions = state.config?.sessions ?? [];
    const isLast = state.sessionIndex >= sessions.length - 1;
    const nextSession = sessions[state.sessionIndex + 1];
    const overtime = runtime !== null && remaining <= 0;
    const audioLocked = bell.status !== "running" && status !== "idle";

    useWakeLock(running);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 6000);
        return () => clearTimeout(timer);
    }, [toast]);

    useEffect(() => {
        if (!running) return;
        const warn = (event: BeforeUnloadEvent) => event.preventDefault();
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [running]);

    const unlockAudio = bell.unlock;
    useEffect(() => {
        const unlock = () => void unlockAudio();
        window.addEventListener("pointerdown", unlock);
        window.addEventListener("keydown", unlock);
        return () => {
            window.removeEventListener("pointerdown", unlock);
            window.removeEventListener("keydown", unlock);
        };
    }, [unlockAudio]);

    function testBell() {
        void bell.ring(1);
        showToast("TES LONCENG 1×");
    }

    function toggle() {
        void bell.unlock();
        actions.toggle();
    }

    const unfinished = status !== "idle" && remaining > 0;

    function requestReset() {
        if (!session) return;
        if (status === "idle") return actions.reset();
        setConfirm({
            title: "Reset timer?",
            message: `Timer ${session.name} akan kembali ke ${formatMmSs(session.durationSec)}.`,
            confirmLabel: "Reset",
            onConfirm: actions.reset,
        });
    }

    function goTo(index: number) {
        if (index === state.sessionIndex) return;
        const target = sessions[index];
        if (!target) return;
        if (!unfinished) return actions.goTo(index);
        setConfirm({
            title: `Pindah ke ${target.name}?`,
            message: "Waktu sesi ini belum habis. Timer sesi ini akan direset.",
            confirmLabel: "Pindah",
            onConfirm: () => actions.goTo(index),
        });
    }

    function nextTeam() {
        actions.nextTeam();
        teamInput.current?.focus();
    }

    function requestNext() {
        if (!isLast) return goTo(state.sessionIndex + 1);
        if (!unfinished) return nextTeam();
        setConfirm({
            title: "Tim berikutnya?",
            message: "Waktu sesi ini belum habis. Timer kembali ke sesi pertama.",
            confirmLabel: "Lanjut",
            onConfirm: nextTeam,
        });
    }

    function requestExit() {
        if (!running) return router.push("/");
        setConfirm({
            title: "Keluar dari layar Play?",
            message: "Timer sedang berjalan. Status timer tetap tersimpan di perangkat ini.",
            confirmLabel: "Keluar",
            onConfirm: () => router.push("/"),
        });
    }

    useHotkeys({
        space: toggle,
        r: requestReset,
        n: requestNext,
        f: toggleFullscreen,
        t: testBell,
    });

    if (meta.notFound) return <NotFoundPanel />;
    if (meta.error && !state.config) {
        return (
            <NotFoundPanel
                title="GAGAL MEMUAT"
                description="Pengaturan lomba tidak bisa dimuat. Periksa koneksi lalu muat ulang halaman."
            />
        );
    }
    if (!state.config) {
        return (
            <div
                aria-busy="true"
                aria-label="Memuat timer"
                className="mx-auto mt-40 h-80 w-[min(1080px,90vw)] rounded-[18px] bg-itcc-blue-500 shadow-frame-blue motion-safe:animate-pulse"
            />
        );
    }

    const config = state.config;
    const tone = runtime && session ? currentTone(session, runtime, remaining) : "blue";
    const toggleLabel = running ? "Jeda" : status === "paused" ? "Lanjut" : "Mulai";

    return (
        <div className="flex min-h-dvh flex-col gap-5.5 px-8 pt-6 pb-8 short:gap-3 short:pt-3 short:pb-4">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4">
                    <Image
                        src="/images/itcc-logo-2026-blue.png"
                        alt="ITCC 2026"
                        width={80}
                        height={52}
                        preload
                        className="h-13 w-auto short:h-10"
                    />
                    <h1 className="font-pixel text-[22px] font-normal tracking-[1px] text-itcc-blue-700 uppercase">
                        {config.name}
                    </h1>
                    <CategoryBadge category={config.category} />
                </div>
                {!isFullscreen && (
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={testBell}
                            aria-label="Tes suara lonceng"
                            title="Tes suara (T)"
                            className={ICON_BUTTON}
                        >
                            <VolumeIcon />
                        </button>
                        {isSupported && (
                            <button
                                type="button"
                                onClick={toggleFullscreen}
                                aria-label="Layar penuh"
                                title="Layar penuh (F)"
                                className={ICON_BUTTON}
                            >
                                <FullscreenIcon />
                            </button>
                        )}
                        <Link
                            href="/"
                            onClick={(event) => {
                                event.preventDefault();
                                requestExit();
                            }}
                            aria-label="Keluar ke daftar lomba"
                            title="Keluar"
                            className={ICON_BUTTON}
                        >
                            <CloseIcon />
                        </Link>
                    </div>
                )}
            </header>

            {audioLocked && (
                <p
                    role="alert"
                    className="self-center rounded-xl border-2 border-itcc-orange-500 bg-itcc-orange-50 px-5 py-3 font-semibold text-itcc-orange-ink"
                >
                    Suara lonceng belum aktif. Klik di mana saja untuk mengaktifkan suara.
                </p>
            )}

            {sessions.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                    <p className="max-w-130 text-lg text-itcc-body">
                        Lomba ini belum punya sesi. Atur sesi dan lonceng dulu sebelum memakai layar
                        Play.
                    </p>
                    <PixelLink href={`/lomba/${id}/atur`} variant="primary">
                        Atur Timer
                    </PixelLink>
                </div>
            ) : (
                runtime &&
                session && (
                    <>
                        <div className="flex flex-col items-center gap-2.5">
                            <SessionStepper
                                sessions={sessions}
                                current={state.sessionIndex}
                                onSelect={goTo}
                            />
                            {state.pending && (
                                <span
                                    role="status"
                                    className="rounded-full border border-itcc-orange-200 bg-itcc-orange-50 px-3 py-1 text-sm font-semibold text-itcc-orange-ink"
                                >
                                    Ada perubahan pengaturan, berlaku setelah reset
                                </span>
                            )}
                        </div>

                        <label className="flex flex-wrap items-baseline justify-center gap-3 self-center text-lg font-semibold text-itcc-body">
                            Sedang tampil:
                            <input
                                ref={teamInput}
                                type="text"
                                value={state.teamName}
                                onChange={(e) => actions.setTeamName(e.target.value)}
                                placeholder="Ketik nama tim (opsional)"
                                className="w-105 max-w-[70vw] border-0 border-b-3 border-dashed border-itcc-blue-300 bg-transparent px-1.5 py-1 text-center text-[30px] font-bold text-itcc-ink placeholder:text-xl placeholder:font-medium short:py-0 short:text-2xl"
                            />
                        </label>

                        <TimerDisplay
                            tone={tone}
                            label={statusLabel(session, runtime, remaining)}
                            clock={formatClock(remaining)}
                            progress={progressPct(runtime, remaining)}
                            markers={session.bells.map((b) => ({
                                id: b.id,
                                left: bellPositionPct(b.atSec, session.durationSec),
                                fired: runtime.firedBellIds.includes(b.id),
                            }))}
                            info={nextBellInfo(session, runtime, remaining)}
                            pulse={overtime && running}
                            large={isFullscreen}
                            toast={toast && <BellToast key={toast.key} text={toast.text} />}
                        />

                        <div className="mt-2 flex flex-wrap items-center justify-center gap-4 short:mt-0">
                            <PixelButton size="xl" icon={<ResetIcon />} onClick={requestReset}>
                                Reset
                            </PixelButton>
                            <PixelButton
                                variant="primary"
                                size="2xl"
                                className="min-w-55 justify-center"
                                icon={running ? <PauseIcon /> : <PlayIcon size={22} />}
                                onClick={toggle}
                            >
                                {toggleLabel}
                            </PixelButton>
                            <PixelButton
                                variant={overtime ? "blue" : "secondary"}
                                size="xl"
                                onClick={requestNext}
                            >
                                {isLast ? "Tim Berikutnya" : `Lanjut ke ${nextSession?.name}`}
                                <ChevronRightIcon />
                            </PixelButton>
                        </div>
                        {!isFullscreen && (
                            <p className="text-center text-sm text-itcc-muted">
                                Spasi: mulai/jeda · R: reset · N: {isLast ? "tim" : "sesi"}{" "}
                                berikutnya · F: layar penuh · T: tes suara
                            </p>
                        )}
                    </>
                )
            )}

            {isFullscreen && (
                <button
                    type="button"
                    onClick={toggleFullscreen}
                    aria-label="Keluar layar penuh"
                    className="fixed right-3 bottom-3 grid size-9 cursor-pointer place-items-center rounded-lg text-itcc-blue-700/40 hover:bg-white/60 hover:text-itcc-blue-700"
                >
                    <ExitFullscreenIcon size={18} />
                </button>
            )}

            <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
        </div>
    );
}
