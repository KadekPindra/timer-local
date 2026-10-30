"use client";

import { useEffect, useRef, type ReactNode } from "react";
import FramePanel from "./FramePanel";

type ModalProps = {
    open: boolean;
    onClose: () => void;
    labelledBy: string;
    tone?: "blue" | "orange";
    fill?: string;
    width?: "sm" | "md";
    children: ReactNode;
};

export default function Modal({
    open,
    onClose,
    labelledBy,
    tone = "blue",
    fill,
    width = "md",
    children,
}: ModalProps) {
    const ref = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog || !open) return;
        if (!dialog.open) dialog.showModal();
        return () => dialog.close();
    }, [open]);

    return (
        <dialog
            ref={ref}
            aria-labelledby={labelledBy}
            onClose={onClose}
            className="m-0 size-full max-h-none max-w-none items-start justify-center overflow-y-auto bg-transparent px-6 pt-[clamp(24px,14vh,150px)] pb-6 backdrop:bg-itcc-ink/62 open:flex"
        >
            <FramePanel
                tone={tone}
                size="sm"
                fill={fill}
                className={`w-full motion-safe:animate-drop ${width === "sm" ? "max-w-120" : "max-w-140"}`}
            >
                {children}
            </FramePanel>
        </dialog>
    );
}
