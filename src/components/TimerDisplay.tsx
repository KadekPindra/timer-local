import type { CSSProperties, ReactNode } from "react";
import type { Tone } from "@/lib/schema";
import { BellIcon } from "./ui/icons";

type Marker = { id: string; left: number; fired: boolean };

type TimerDisplayProps = {
    tone: Tone;
    label: string;
    clock: string;
    progress: number;
    markers: Marker[];
    info: string;
    pulse: boolean;
    large: boolean;
    toast?: ReactNode;
};

const toneVars = (tone: Tone) =>
    ({
        "--tone-frame": `var(--color-tone-${tone}-frame)`,
        "--tone-shadow": `var(--color-tone-${tone}-shadow)`,
        "--tone-fill": `var(--color-tone-${tone}-fill)`,
        "--tone-digit": `var(--color-tone-${tone}-digit)`,
        "--tone-outline": `var(--color-tone-${tone}-outline)`,
    }) as CSSProperties;

const OUTLINE_SM =
    "[text-shadow:-1px_-1px_0_var(--tone-outline),1px_-1px_0_var(--tone-outline),-1px_1px_0_var(--tone-outline),1px_1px_0_var(--tone-outline),0_3px_0_var(--tone-outline)]";
const OUTLINE_LG =
    "[text-shadow:-5px_-5px_0_var(--tone-outline),5px_-5px_0_var(--tone-outline),-5px_5px_0_var(--tone-outline),5px_5px_0_var(--tone-outline),0_12px_0_var(--tone-outline)]";

function Bolt({ side }: { side: "left" | "right" }) {
    return (
        <span
            aria-hidden="true"
            className={`absolute top-3 ${side === "left" ? "left-3" : "right-3"} size-4 rounded-full bg-white inset-ring-3 inset-ring-(--tone-shadow)`}
        />
    );
}

export default function TimerDisplay({
    tone,
    label,
    clock,
    progress,
    markers,
    info,
    pulse,
    large,
    toast,
}: TimerDisplayProps) {
    return (
        <div
            className={`relative w-full self-center ${large ? "max-w-[min(1600px,94vw)]" : "max-w-270"}`}
        >
            {toast}
            <section
                aria-label="Sisa waktu"
                style={{
                    ...toneVars(tone),
                    ["--clock-size" as string]: large
                        ? "clamp(160px, min(24vw, 30vh), 420px)"
                        : "clamp(150px, min(17vw, 26vh), 250px)",
                }}
                className={`relative rounded-[18px] bg-(--tone-frame) p-2 shadow-[0_10px_0_var(--tone-shadow)] transition-colors duration-300 ${
                    pulse ? "motion-safe:animate-overtime" : ""
                }`}
            >
                <Bolt side="left" />
                <Bolt side="right" />
                <div className="flex flex-col items-center gap-1.5 rounded-[10px] bg-(--tone-fill) px-10 pt-8.5 pb-7.5 transition-colors duration-300 [--frame-cut:56px] clip-frame short:pt-5 short:pb-4">
                    <p
                        className={`font-pixel text-[30px] tracking-[3px] text-(--tone-digit) short:text-2xl ${OUTLINE_SM}`}
                    >
                        {label}
                    </p>
                    <p
                        role="timer"
                        aria-live="off"
                        className={`font-pixel text-(length:--clock-size) leading-none tracking-[6px] text-(--tone-digit) tabular-nums ${OUTLINE_LG}`}
                    >
                        {clock}
                    </p>
                    <div
                        aria-hidden="true"
                        className="flex gap-[calc(var(--clock-size)*1.25)] text-base font-bold tracking-[2px] text-(--tone-outline)"
                    >
                        <span>MENIT</span>
                        <span>DETIK</span>
                    </div>
                    <div
                        aria-hidden="true"
                        className="relative mt-5.5 h-4 w-full rounded border-2 border-(--tone-shadow) bg-white/80 short:mt-3"
                    >
                        <div
                            className="h-full rounded-xs bg-(--tone-frame)"
                            style={{ width: `${progress}%` }}
                        />
                        {markers.map((marker) => (
                            <span
                                key={marker.id}
                                className={`absolute -top-2.5 grid size-7 -translate-x-1/2 place-items-center rounded-full border-2 border-itcc-orange-500 ${
                                    marker.fired
                                        ? "bg-itcc-orange-500 text-white"
                                        : "bg-white text-itcc-orange-500"
                                }`}
                                style={{ left: `${marker.left}%` }}
                            >
                                <BellIcon size={14} strokeWidth={2.4} />
                            </span>
                        ))}
                    </div>
                    <p className="mt-3.5 text-center text-base font-semibold text-itcc-body short:mt-1.5">
                        {info}
                    </p>
                </div>
            </section>
        </div>
    );
}
