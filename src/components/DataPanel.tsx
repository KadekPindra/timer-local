"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { deleteCompetition } from "@/app/actions/competition";
import { notifyDataChanged } from "@/lib/data-events";
import { downloadJson } from "@/lib/download";
import type { CompetitionInput } from "@/lib/schema";
import { buildExport, exportFileName } from "@/lib/transfer";
import Field from "./ui/Field";
import Modal from "./ui/Modal";
import PixelButton from "./ui/PixelButton";

function DeleteModal({
    open,
    competitionId,
    name,
    onClose,
}: {
    open: boolean;
    competitionId: string;
    name: string;
    onClose: () => void;
}) {
    const router = useRouter();
    const [typed, setTyped] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();
    const matches = typed.trim().toLowerCase() === name.trim().toLowerCase();

    function close() {
        if (pending) return;
        setTyped("");
        setError(null);
        onClose();
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        if (!matches) return;
        startTransition(async () => {
            const result = await deleteCompetition(competitionId);
            if (result.ok) {
                notifyDataChanged();
                router.replace("/");
                return;
            }
            setError(result.error);
        });
    }

    return (
        <Modal
            open={open}
            onClose={close}
            labelledBy="judul-hapus-lomba"
            tone="orange"
            fill="bg-itcc-peach"
            width="sm"
        >
            <form onSubmit={submit} noValidate className="flex flex-col gap-4.5">
                <h2
                    id="judul-hapus-lomba"
                    className="text-center font-pixel text-[26px] font-normal tracking-[1px] text-itcc-danger"
                >
                    HAPUS LOMBA?
                </h2>
                <p className="text-sm leading-normal text-itcc-orange-ink">
                    Lomba <strong>{name}</strong> beserta semua sesi dan loncengnya akan dihapus
                    permanen dan tidak bisa dikembalikan.
                </p>
                <Field
                    label="Ketik nama lomba untuk konfirmasi"
                    tone="orange"
                    error={error ?? undefined}
                >
                    {(control) => (
                        <input
                            {...control}
                            autoComplete="off"
                            autoFocus
                            placeholder={name}
                            value={typed}
                            onChange={(e) => setTyped(e.target.value)}
                        />
                    )}
                </Field>
                <div className="flex flex-wrap justify-end gap-3">
                    <PixelButton onClick={close} disabled={pending}>
                        Batal
                    </PixelButton>
                    <PixelButton type="submit" variant="danger" disabled={!matches || pending}>
                        {pending ? "Menghapus…" : "Hapus Permanen"}
                    </PixelButton>
                </div>
            </form>
        </Modal>
    );
}

export default function DataPanel({
    competitionId,
    name,
    data,
}: {
    competitionId: string;
    name: string;
    data: CompetitionInput;
}) {
    const [deleting, setDeleting] = useState(false);

    return (
        <section
            aria-labelledby="judul-data"
            className="flex flex-col gap-3 rounded-xl border-2 border-itcc-blue-200 bg-white p-5.5"
        >
            <h2
                id="judul-data"
                className="font-pixel text-lg font-normal tracking-[1px] text-itcc-blue-700"
            >
                DATA
            </h2>
            <PixelButton
                size="sm"
                className="justify-center"
                onClick={() => downloadJson(exportFileName(name), buildExport([data]))}
            >
                Export JSON
            </PixelButton>
            <PixelButton
                variant="danger"
                size="sm"
                className="justify-center"
                onClick={() => setDeleting(true)}
            >
                Hapus Lomba Ini
            </PixelButton>

            <DeleteModal
                open={deleting}
                competitionId={competitionId}
                name={name}
                onClose={() => setDeleting(false)}
            />
        </section>
    );
}
