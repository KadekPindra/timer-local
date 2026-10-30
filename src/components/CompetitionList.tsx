"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent } from "react";
import { importCompetitions } from "@/app/actions/competition";
import { useCompetitions } from "@/hooks/useCompetitions";
import { notifyDataChanged } from "@/lib/data-events";
import { downloadJson } from "@/lib/download";
import { buildExport, exportFileName } from "@/lib/transfer";
import AddCompetitionModal from "./AddCompetitionModal";
import CompetitionCard from "./CompetitionCard";
import { PlusIcon } from "./ui/icons";
import PixelButton from "./ui/PixelButton";
import PixelHeading from "./ui/PixelHeading";

const GRID = "grid grid-cols-[repeat(auto-fill,minmax(min(520px,100%),1fr))] gap-x-7 gap-y-8";
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

type Notice = { ok: boolean; text: string };

export default function CompetitionList() {
    const { data, loading, error } = useCompetitions();
    const [adding, setAdding] = useState(false);
    const [importing, setImporting] = useState(false);
    const [notice, setNotice] = useState<Notice | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);

    async function onFileChosen(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        setImporting(true);
        setNotice(null);
        try {
            if (file.size > MAX_IMPORT_BYTES) {
                setNotice({ ok: false, text: "Berkas terlalu besar untuk diimpor." });
                return;
            }
            const result = await importCompetitions(await file.text());
            if (!result.ok) {
                setNotice({ ok: false, text: result.error });
                return;
            }
            notifyDataChanged();
            const { imported, renamed } = result.data;
            const renamedText =
                renamed.length > 0
                    ? ` (${renamed.length} diganti nama: ${renamed.join(", ")})`
                    : "";
            setNotice({ ok: true, text: `${imported} lomba diimpor${renamedText}` });
        } catch {
            setNotice({ ok: false, text: "Berkas tidak bisa dibaca. Coba lagi." });
        } finally {
            setImporting(false);
        }
    }

    const chooseFile = () => fileInput.current?.click();

    return (
        <div className="mx-auto flex max-w-300 flex-col gap-9 px-6 pt-7 pb-18">
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
                    <span className="rounded-md border-2 border-itcc-blue-700 bg-itcc-blue-500 px-3 py-1.5 font-pixel text-lg tracking-[1px] text-white">
                        TIMER LOMBA
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <PixelButton onClick={chooseFile} disabled={importing}>
                        {importing ? "Mengimpor…" : "Import"}
                    </PixelButton>
                    <PixelButton
                        disabled={loading || data.length === 0}
                        onClick={() => downloadJson(exportFileName(null), buildExport(data))}
                    >
                        Export Semua
                    </PixelButton>
                    <PixelButton
                        variant="primary"
                        icon={<PlusIcon />}
                        onClick={() => setAdding(true)}
                    >
                        Tambah Lomba
                    </PixelButton>
                </div>
            </header>

            <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={onFileChosen}
            />

            <main className="flex flex-col gap-9">
                {notice && (
                    <p
                        role={notice.ok ? "status" : "alert"}
                        className={`rounded-xl border-2 px-4 py-3 font-semibold ${
                            notice.ok
                                ? "border-itcc-success-border bg-itcc-success-bg text-itcc-success"
                                : "border-itcc-orange-500 bg-itcc-danger-bg text-itcc-danger"
                        }`}
                    >
                        {notice.text}
                    </p>
                )}
                {error ? (
                    <p
                        role="alert"
                        className="rounded-xl border-2 border-itcc-orange-500 bg-itcc-danger-bg p-5 text-itcc-danger"
                    >
                        Gagal memuat daftar lomba. Muat ulang halaman, atau jalankan ulang
                        aplikasinya.
                    </p>
                ) : !loading && data.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                        <Image
                            src="/images/maskot-itcc.png"
                            alt=""
                            width={220}
                            height={220}
                            className="size-55"
                        />
                        <h1 className="font-pixel text-[34px] font-normal tracking-[2px] text-itcc-heading text-shadow-pixel-outline">
                            BELUM ADA LOMBA
                        </h1>
                        <p className="max-w-130 text-itcc-body">
                            Tambahkan cabang lomba pertamamu, lalu atur sesi presentasi dan lonceng
                            pengingatnya.
                        </p>
                        <button
                            type="button"
                            onClick={chooseFile}
                            className="cursor-pointer text-sm text-itcc-body hover:text-itcc-blue-700"
                        >
                            atau{" "}
                            <span className="font-semibold text-itcc-blue-700 underline underline-offset-3">
                                impor dari file JSON
                            </span>
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-2">
                            <PixelHeading bullets="start">Daftar Lomba</PixelHeading>
                            <p className="text-itcc-body">
                                Siapkan timer tiap cabang sebelum hari H, lalu pakai tombol Play
                                saat lomba berlangsung.
                            </p>
                        </div>
                        {loading ? (
                            <div aria-busy="true" aria-label="Memuat daftar lomba" className={GRID}>
                                {[0, 1].map((i) => (
                                    <div
                                        key={i}
                                        className="h-65 rounded-[14px] bg-itcc-blue-500 shadow-frame-blue motion-safe:animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : (
                            <ul className={GRID}>
                                {data.map((competition) => (
                                    <CompetitionCard
                                        key={competition.id}
                                        competition={competition}
                                    />
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </main>

            <footer className="text-center text-sm text-itcc-muted">
                Versi lokal · data tersimpan di laptop ini
            </footer>

            <AddCompetitionModal open={adding} onClose={() => setAdding(false)} />
        </div>
    );
}
