import { useId, type ReactNode } from "react";

type Tone = "blue" | "orange";
type Size = "sm" | "md" | "pin";

export type FieldControlProps = {
    id: string;
    "aria-invalid": true | undefined;
    "aria-describedby": string | undefined;
    className: string;
};

type FieldProps = {
    label: ReactNode;
    error?: string;
    hint?: ReactNode;
    tone?: Tone;
    size?: Size;
    className?: string;
    children: (control: FieldControlProps) => ReactNode;
};

const toneClasses: Record<Tone, { label: string; control: string; hint: string }> = {
    blue: {
        label: "text-itcc-blue-700",
        control: "border-itcc-blue-200 bg-itcc-input",
        hint: "text-itcc-muted",
    },
    orange: {
        label: "text-itcc-orange-ink",
        control: "border-itcc-orange-200 bg-white",
        hint: "text-itcc-orange-ink",
    },
};

const sizeClasses: Record<Size, string> = {
    sm: "h-11 px-3 text-[15px] font-medium",
    md: "h-12 px-4 text-base font-medium",
    pin: "h-12 px-4 text-xl font-semibold tracking-[6px]",
};

export default function Field({
    label,
    error,
    hint,
    tone = "blue",
    size = "md",
    className = "",
    children,
}: FieldProps) {
    const id = useId();
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;
    const t = toneClasses[tone];
    const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label htmlFor={id} className={`text-sm font-semibold ${t.label}`}>
                {label}
            </label>
            {children({
                id,
                "aria-invalid": error ? true : undefined,
                "aria-describedby": describedBy,
                className: `w-full rounded-lg border-2 text-itcc-ink ${sizeClasses[size]} ${
                    error ? "border-itcc-orange-500 bg-itcc-danger-bg" : t.control
                }`,
            })}
            {hint && (
                <p id={hintId} className={`text-[13px] ${t.hint}`}>
                    {hint}
                </p>
            )}
            {error && (
                <p id={errorId} role="alert" className="text-sm font-semibold text-itcc-danger">
                    {error}
                </p>
            )}
        </div>
    );
}
