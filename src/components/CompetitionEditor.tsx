"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { updateCompetition } from "@/app/actions/competition";
import { useCompetition } from "@/hooks/useCompetition";
import { fieldErrorsOf } from "@/lib/action-result";
import { sameContent, toInput } from "@/lib/competition-doc";
import { notifyDataChanged } from "@/lib/data-events";
import { moveItem } from "@/lib/editor";
import {
    CATEGORIES,
    CATEGORY_LABELS,
    CompetitionInputSchema,
    duplicateSession,
    LIMITS,
    newSession,
    totalDurationSec,
    type Category,
    type Competition,
    type CompetitionInput,
    type Session,
} from "@/lib/schema";
import { formatMinutes } from "@/lib/time";
import CategoryBadge from "./CategoryBadge";
import DataPanel from "./DataPanel";
import EditorSkeleton from "./EditorSkeleton";
import NotFoundPanel from "./NotFoundPanel";
import SessionEditor from "./SessionEditor";
import SoundTestPanel from "./SoundTestPanel";
import Field from "./ui/Field";
import { ChevronLeftIcon, PlusIcon } from "./ui/icons";
import PixelButton from "./ui/PixelButton";
import PixelHeading from "./ui/PixelHeading";

export default function CompetitionEditor({ id }: { id: string }) {
    const remote = useCompetition(id);
    const [seen, setSeen] = useState<Competition | null>(null);
    const [base, setBase] = useState<CompetitionInput | null>(null);
    const [draft, setDraft] = useState<CompetitionInput | null>(null);
    const [remoteChanged, setRemoteChanged] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saving, startSaving] = useTransition();

    if (remote.data && remote.data !== seen) {
        setSeen(remote.data);
        const incoming = toInput(remote.data);
        if (!draft || !base) {
            setDraft(incoming);
            setBase(incoming);
        } else if (sameContent(incoming, draft)) {
            setBase(incoming);
            setRemoteChanged(false);
        } else if (sameContent(draft, base)) {
            setDraft(incoming);
            setBase(incoming);
        } else if (!sameContent(incoming, base)) {
            setRemoteChanged(true);
        }
    }

    const dirty = Boolean(draft && base && !sameContent(draft, base));

    const errors = useMemo(() => {
        if (!draft) return {};
        const result = CompetitionInputSchema.safeParse(draft);
        return result.success ? {} : fieldErrorsOf(result.error);
    }, [draft]);

    useEffect(() => {
        if (!dirty) return;
        const warn = (event: BeforeUnloadEvent) => event.preventDefault();
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [dirty]);

    if (remote.notFound) return <NotFoundPanel />;
    if (!draft) {
        if (remote.error) {
            return (
                <NotFoundPanel
                    title="GAGAL MEMUAT"
                    description="Pengaturan lomba tidak bisa dimuat. Periksa koneksi lalu muat ulang halaman."
                />
            );
        }
        return <EditorSkeleton />;
    }

    const update = (patch: Partial<CompetitionInput>) => setDraft({ ...draft, ...patch });
    const setSessions = (sessions: Session[]) => update({ sessions });

    function save() {
        if (!draft) return;
        const parsed = CompetitionInputSchema.safeParse(draft);
        if (!parsed.success) {
            setSaveError("Masih ada isian yang belum benar. Periksa tulisan merah di bawah.");
            return;
        }
        const submitted = draft;
        startSaving(async () => {
            const result = await updateCompetition(id, parsed.data);
            if (result.ok) {
                setBase(submitted);
                setSaveError(null);
                notifyDataChanged();
            } else {
                setSaveError(result.error);
            }
        });
    }

    function reloadFromServer() {
        if (!remote.data) return;
        const incoming = toInput(remote.data);
        setDraft(incoming);
        setBase(incoming);
        setRemoteChanged(false);
    }

    function removeSession(index: number) {
        if (!draft) return;
        const session = draft.sessions[index];
        if (!window.confirm(`Hapus sesi "${session.name}" beserta loncengnya?`)) return;
        setSessions(draft.sessions.filter((_, i) => i !== index));
    }

    const savedName = base?.name ?? draft.name;
    const total = totalDurationSec(draft.sessions);
    const canAddSession = draft.sessions.length < LIMITS.sessions;
    const status = saving
        ? "Menyimpan…"
        : dirty
          ? "Perubahan belum disimpan"
          : "Semua perubahan tersimpan";

    return (
        <div className="mx-auto flex max-w-300 flex-col gap-7 px-6 pt-7 pb-20">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Image
                        src="/images/itcc-logo-2026-blue.png"
                        alt="ITCC 2026"
                        width={86}
                        height={56}
                        preload
                        className="h-14 w-auto"
                    />
                    <Link
                        href="/"
                        onClick={(event) => {
                            if (
                                dirty &&
                                !window.confirm("Perubahan belum disimpan. Tinggalkan halaman ini?")
                            ) {
                                event.preventDefault();
                            }
                        }}
                        className="inline-flex items-center gap-1.5 px-1 py-2.5 text-[15px] font-semibold text-itcc-blue-700 hover:text-itcc-blue-500"
                    >
                        <ChevronLeftIcon />
                        Kembali ke daftar lomba
                    </Link>
                </div>
                <div className="flex flex-wrap items-center gap-3.5">
                    <span role="status" className="text-sm text-itcc-muted">
                        {status}
                    </span>
                    <PixelButton variant="primary" onClick={save} disabled={!dirty || saving}>
                        Simpan Perubahan
                    </PixelButton>
                </div>
            </header>

            {saveError && (
                <p
                    role="alert"
                    className="rounded-xl border-2 border-itcc-orange-500 bg-itcc-danger-bg px-4 py-3 font-semibold text-itcc-danger"
                >
                    {saveError}
                </p>
            )}
            {remoteChanged && (
                <div
                    role="status"
                    className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-itcc-orange-300 bg-itcc-orange-50 px-4 py-3 text-itcc-orange-ink"
                >
                    <p className="flex-1">
                        Pengaturan lomba ini baru saja diubah dari perangkat lain. Kalau kamu
                        menyimpan sekarang, perubahan itu akan tertimpa.
                    </p>
                    <PixelButton variant="accent" size="sm" onClick={reloadFromServer}>
                        Muat Versi Terbaru
                    </PixelButton>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <PixelHeading bullets="start">
                    Atur Timer · {draft.name.trim() || savedName}
                </PixelHeading>
                <CategoryBadge category={draft.category} />
            </div>

            <div className="flex flex-wrap items-start gap-7">
                <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-7">
                    {draft.sessions.length === 0 && (
                        <p className="rounded-xl border-2 border-dashed border-itcc-blue-300 bg-white/70 px-5 py-4 text-itcc-body">
                            Belum ada sesi. Klik <strong>Tambah Sesi</strong> untuk membuat sesi
                            pertama, misalnya Presentasi 10:00 lalu Tanya Jawab 05:00.
                        </p>
                    )}
                    {draft.sessions.map((session, index) => (
                        <SessionEditor
                            key={session.id}
                            session={session}
                            index={index}
                            total={draft.sessions.length}
                            canDuplicate={canAddSession}
                            error={(path) => errors[`sessions.${index}.${path}`]}
                            onChange={(next) =>
                                setSessions(draft.sessions.map((s, i) => (i === index ? next : s)))
                            }
                            onMove={(offset) =>
                                setSessions(moveItem(draft.sessions, index, offset))
                            }
                            onDuplicate={() =>
                                setSessions([
                                    ...draft.sessions.slice(0, index + 1),
                                    duplicateSession(session),
                                    ...draft.sessions.slice(index + 1),
                                ])
                            }
                            onRemove={() => removeSession(index)}
                        />
                    ))}
                    <button
                        type="button"
                        disabled={!canAddSession}
                        onClick={() => setSessions([...draft.sessions, newSession()])}
                        className="flex h-18 cursor-pointer items-center justify-center gap-2.5 rounded-[14px] border-3 border-dashed border-itcc-blue-500 bg-white/70 font-pixel text-lg tracking-[1px] text-itcc-blue-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                    >
                        <PlusIcon size={20} />
                        {canAddSession ? "TAMBAH SESI" : `MAKSIMAL ${LIMITS.sessions} SESI`}
                    </button>
                </div>

                <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
                    <section
                        aria-labelledby="judul-info"
                        className="flex flex-col gap-3.5 rounded-xl border-2 border-itcc-blue-500 bg-white p-5.5 shadow-card"
                    >
                        <h2
                            id="judul-info"
                            className="font-pixel text-lg font-normal tracking-[1px] text-itcc-blue-700"
                        >
                            INFO LOMBA
                        </h2>
                        <Field label="Nama cabang" size="sm" error={errors.name}>
                            {(control) => (
                                <input
                                    {...control}
                                    maxLength={LIMITS.competitionName.max}
                                    value={draft.name}
                                    onChange={(e) => update({ name: e.target.value })}
                                />
                            )}
                        </Field>
                        <Field label="Kategori" size="sm" error={errors.category}>
                            {(control) => (
                                <select
                                    {...control}
                                    value={draft.category}
                                    onChange={(e) =>
                                        update({ category: e.target.value as Category })
                                    }
                                >
                                    {CATEGORIES.map((c) => (
                                        <option key={c} value={c}>
                                            {CATEGORY_LABELS[c]}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </Field>
                        <p className="text-sm text-itcc-body">
                            Total waktu:{" "}
                            <strong>
                                {formatMinutes(total)} · {draft.sessions.length} sesi
                            </strong>
                        </p>
                        {draft.sessions.length > 0 && (
                            <a
                                href={`/lomba/${id}/play`}
                                target="_blank"
                                rel="noopener"
                                className="text-sm font-semibold text-itcc-blue-700 underline underline-offset-3 hover:text-itcc-blue-500"
                            >
                                Coba di layar Play (tab baru)
                            </a>
                        )}
                    </section>

                    <SoundTestPanel />
                    <DataPanel competitionId={id} name={savedName} data={base ?? draft} />
                </aside>
            </div>
        </div>
    );
}
