import type { HTMLAttributes } from "react";

type Tone = "blue" | "orange";
type Size = "md" | "sm";

type FramePanelProps = HTMLAttributes<HTMLElement> & {
    tone?: Tone;
    size?: Size;
    fill?: string;
};

const toneClasses: Record<Tone, { frame: string; bolt: string }> = {
    blue: { frame: "bg-itcc-blue-500 shadow-frame-blue", bolt: "inset-ring-itcc-blue-700" },
    orange: {
        frame: "bg-itcc-orange-500 shadow-frame-orange",
        bolt: "inset-ring-itcc-orange-900",
    },
};

const sizeClasses: Record<Size, { bolt: string; content: string }> = {
    md: { bolt: "size-3.5", content: "gap-4 px-6 pt-7 pb-6 sm:px-10" },
    sm: { bolt: "size-3", content: "gap-5 px-5 pt-6.5 pb-7 [--frame-cut:36px] sm:px-8" },
};

function Bolt({ className }: { className: string }) {
    return (
        <span
            aria-hidden="true"
            className={`absolute top-2.25 rounded-full bg-white inset-ring-2 ${className}`}
        />
    );
}

export default function FramePanel({
    tone = "blue",
    size = "md",
    fill = "bg-white",
    className = "",
    children,
    ...props
}: FramePanelProps) {
    const { frame, bolt } = toneClasses[tone];
    const sizing = sizeClasses[size];

    return (
        <section className={`relative rounded-[14px] p-1.5 ${frame} ${className}`} {...props}>
            <Bolt className={`left-2.25 ${sizing.bolt} ${bolt}`} />
            <Bolt className={`right-2.25 ${sizing.bolt} ${bolt}`} />
            {/* h-full: kartu di dalam grid ikut setinggi baris supaya tombolnya rata bawah */}
            <div className={`flex h-full flex-col rounded-lg clip-frame ${fill} ${sizing.content}`}>
                {children}
            </div>
        </section>
    );
}
