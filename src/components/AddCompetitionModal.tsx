"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { createCompetition } from "@/app/actions/competition";
import { fieldErrorsOf } from "@/lib/action-result";
import { notifyDataChanged } from "@/lib/data-events";
import { CATEGORIES, CATEGORY_LABELS, CreateCompetitionSchema } from "@/lib/schema";
import Field from "./ui/Field";
import Modal from "./ui/Modal";
import PixelButton from "./ui/PixelButton";

const EMPTY = { name: "", category: "" };
type Values = typeof EMPTY;

export default function AddCompetitionModal({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const router = useRouter();
    const [values, setValues] = useState<Values>(EMPTY);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function set(field: keyof Values, value: string) {
        setValues((prev) => ({ ...prev, [field]: value }));
    }

    function close() {
        if (pending) return;
        setValues(EMPTY);
        setErrors({});
        setFormError(null);
        onClose();
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        const parsed = CreateCompetitionSchema.safeParse(values);
        setErrors(parsed.success ? {} : fieldErrorsOf(parsed.error));
        setFormError(null);
        if (!parsed.success) return;

        startTransition(async () => {
            const result = await createCompetition(parsed.data);
            if (result.ok) {
                notifyDataChanged();
                setValues(EMPTY);
                onClose();
                router.push(`/lomba/${result.data.id}/atur`);
                return;
            }
            setErrors(result.fieldErrors ?? {});
            setFormError(result.fieldErrors ? null : result.error);
        });
    }

    return (
        <Modal
            open={open}
            onClose={close}
            labelledBy="judul-tambah-lomba"
            tone="orange"
            fill="bg-itcc-peach"
        >
            <form onSubmit={submit} noValidate className="flex flex-col gap-4.5">
                <h2
                    id="judul-tambah-lomba"
                    className="text-center font-pixel text-[28px] font-normal tracking-[1px] text-itcc-heading text-shadow-pixel-outline-sm"
                >
                    {"{ TAMBAH LOMBA }"}
                </h2>

                <Field label="Nama cabang lomba" tone="orange" error={errors.name}>
                    {(control) => (
                        <input
                            {...control}
                            autoComplete="off"
                            autoFocus
                            maxLength={60}
                            placeholder="Contoh: Web Design"
                            value={values.name}
                            onChange={(e) => set("name", e.target.value)}
                        />
                    )}
                </Field>

                <Field label="Kategori" tone="orange" error={errors.category}>
                    {(control) => (
                        <select
                            {...control}
                            value={values.category}
                            onChange={(e) => set("category", e.target.value)}
                        >
                            <option value="" disabled>
                                Pilih kategori
                            </option>
                            {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                    {CATEGORY_LABELS[c]}
                                </option>
                            ))}
                        </select>
                    )}
                </Field>

                {formError && (
                    <p role="alert" className="text-sm font-semibold text-itcc-danger">
                        {formError}
                    </p>
                )}

                <div className="flex flex-wrap justify-end gap-3">
                    <PixelButton onClick={close} disabled={pending}>
                        Batal
                    </PixelButton>
                    <PixelButton type="submit" variant="primary" disabled={pending}>
                        {pending ? "Menyimpan…" : "Simpan Lomba"}
                    </PixelButton>
                </div>
            </form>
        </Modal>
    );
}
