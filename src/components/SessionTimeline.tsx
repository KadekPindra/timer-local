import { bellPositionPct, warningStartPct } from "@/lib/editor";
import type { Session } from "@/lib/schema";
import { formatMmSs } from "@/lib/time";
import { BellIcon } from "./ui/icons";

export default function SessionTimeline({ session }: { session: Session }) {
    const warn = `${warningStartPct(session)}%`;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between text-[13px] font-semibold text-itcc-muted">
                <span>Mulai · {formatMmSs(session.durationSec)}</span>
                <span>Habis · 00:00</span>
            </div>
            <div
                aria-hidden="true"
                className="relative h-4.5 rounded border-2 border-itcc-blue-300"
                style={{
                    background: `linear-gradient(90deg, var(--color-itcc-blue-200) 0%, var(--color-itcc-blue-200) ${warn}, var(--color-itcc-orange-100) ${warn}, var(--color-itcc-orange-100) 100%)`,
                }}
            >
                {session.bells.map((bell) => (
                    <span
                        key={bell.id}
                        className="absolute -top-2.25 grid size-7 -translate-x-1/2 place-items-center rounded-full border-2 border-itcc-orange-500 bg-white text-itcc-orange-500"
                        style={{ left: `${bellPositionPct(bell.atSec, session.durationSec)}%` }}
                    >
                        <BellIcon size={14} strokeWidth={2.4} />
                    </span>
                ))}
            </div>
        </div>
    );
}
