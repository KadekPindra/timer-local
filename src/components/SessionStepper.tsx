import { Fragment } from "react";
import type { Session } from "@/lib/schema";

type SessionStepperProps = {
    sessions: Session[];
    current: number;
    onSelect: (index: number) => void;
};

export default function SessionStepper({ sessions, current, onSelect }: SessionStepperProps) {
    return (
        <nav aria-label="Sesi" className="flex flex-wrap items-center justify-center gap-3">
            {sessions.map((session, i) => {
                const active = i === current;
                const done = i < current;
                return (
                    <Fragment key={session.id}>
                        {i > 0 && <span aria-hidden="true" className="h-1 w-10 bg-itcc-blue-300" />}
                        <button
                            type="button"
                            aria-current={active ? "step" : undefined}
                            onClick={() => onSelect(i)}
                            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3.5 py-2 font-pixel text-base tracking-[1px] uppercase transition-colors ${
                                active
                                    ? "border-itcc-blue-700 bg-itcc-blue-500 text-white"
                                    : "border-itcc-blue-200 bg-white text-itcc-blue-700 hover:border-itcc-blue-500"
                            }`}
                        >
                            {String(i + 1).padStart(2, "0")} {session.name}
                            {done && <span aria-label="selesai">✓</span>}
                        </button>
                    </Fragment>
                );
            })}
        </nav>
    );
}
