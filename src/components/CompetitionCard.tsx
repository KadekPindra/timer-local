import { totalDurationSec, type Competition } from "@/lib/schema";
import { formatMinutes, formatMmSs } from "@/lib/time";
import CategoryBadge from "./CategoryBadge";
import FramePanel from "./ui/FramePanel";
import { BellIcon, PlayIcon, SettingsIcon } from "./ui/icons";
import PixelButton from "./ui/PixelButton";
import PixelLink from "./ui/PixelLink";

export default function CompetitionCard({ competition }: { competition: Competition }) {
    const { id, name, category, sessions } = competition;
    const ready = sessions.length > 0;
    const headingId = `lomba-${id}`;

    return (
        <li>
            <FramePanel size="sm" aria-labelledby={headingId} className="h-full">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
                    <h2
                        id={headingId}
                        className="font-pixel text-[26px] leading-tight font-normal tracking-[1px] text-itcc-heading uppercase text-shadow-pixel-outline-sm"
                    >
                        {name}
                    </h2>
                    <CategoryBadge category={category} />
                </div>

                {ready ? (
                    <ol className="flex flex-col gap-2">
                        {sessions.map((session, i) => (
                            <li
                                key={session.id}
                                className="flex items-center gap-3 rounded-lg border border-itcc-blue-100 bg-itcc-blue-25 px-3.5 py-2.5"
                            >
                                <span className="w-6 shrink-0 font-pixel text-sm text-itcc-blue-700">
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <span className="min-w-0 flex-1 font-semibold wrap-break-word">
                                    {session.name}
                                </span>
                                <span className="font-pixel text-xl tracking-[1px]">
                                    {formatMmSs(session.durationSec)}
                                </span>
                                <span className="inline-flex items-center justify-end gap-1 text-[13px] font-semibold text-itcc-red sm:min-w-23">
                                    <BellIcon size={16} strokeWidth={2} />
                                    {session.bells.length}
                                    <span className="max-sm:sr-only">lonceng</span>
                                </span>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p className="rounded-lg border-2 border-dashed border-itcc-orange-300 bg-itcc-orange-50 px-4 py-3.5 text-[15px] text-itcc-orange-ink">
                        Timer belum diatur. Klik <strong>Atur</strong> untuk menambah sesi dan
                        lonceng.
                    </p>
                )}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm text-itcc-muted">
                        {ready
                            ? `Total ${formatMinutes(totalDurationSec(sessions))} · ${sessions.length} sesi`
                            : "Belum ada sesi"}
                    </span>
                    <div className="flex gap-3">
                        <PixelLink href={`/lomba/${id}/atur`} size="md" icon={<SettingsIcon />}>
                            Atur
                        </PixelLink>
                        {ready ? (
                            <PixelLink
                                href={`/lomba/${id}/play`}
                                variant="primary"
                                size="md"
                                icon={<PlayIcon />}
                            >
                                Play
                            </PixelLink>
                        ) : (
                            <PixelButton
                                variant="primary"
                                size="md"
                                icon={<PlayIcon />}
                                disabled
                                title="Atur sesi dulu sebelum Play"
                            >
                                Play
                            </PixelButton>
                        )}
                    </div>
                </div>
            </FramePanel>
        </li>
    );
}
