"use client";

import { useEffect, useId, useRef, type FormEvent } from "react";
import Modal from "./ui/Modal";
import PixelButton from "./ui/PixelButton";

export type ConfirmRequest = {
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
};

export default function ConfirmDialog({
    request,
    onClose,
}: {
    request: ConfirmRequest | null;
    onClose: () => void;
}) {
    const id = useId();
    const confirmButton = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (request) confirmButton.current?.focus();
    }, [request]);

    function submit(event: FormEvent) {
        event.preventDefault();
        request?.onConfirm();
        onClose();
    }

    return (
        <Modal open={request !== null} onClose={onClose} labelledBy={`${id}-title`} width="sm">
            <form onSubmit={submit} className="flex flex-col gap-4 text-center">
                <h2
                    id={`${id}-title`}
                    className="font-pixel text-[24px] font-normal tracking-[1px] text-itcc-blue-700 uppercase"
                >
                    {request?.title}
                </h2>
                <p className="text-itcc-body">{request?.message}</p>
                <div className="flex gap-3">
                    <PixelButton onClick={onClose} className="flex-1 justify-center">
                        Batal
                    </PixelButton>
                    <PixelButton
                        ref={confirmButton}
                        type="submit"
                        variant="primary"
                        className="flex-1 justify-center"
                    >
                        {request?.confirmLabel}
                    </PixelButton>
                </div>
            </form>
        </Modal>
    );
}
