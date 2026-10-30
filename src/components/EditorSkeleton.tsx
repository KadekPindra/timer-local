export default function EditorSkeleton() {
    return (
        <div
            aria-busy="true"
            aria-label="Memuat pengaturan lomba"
            className="mx-auto flex max-w-300 flex-col gap-7 px-6 pt-7 pb-20"
        >
            <div className="h-14 w-60 rounded-lg bg-itcc-blue-200/60 motion-safe:animate-pulse" />
            <div className="h-11 w-3/5 rounded-lg bg-itcc-orange-100/70 motion-safe:animate-pulse" />
            <div className="flex flex-wrap gap-7">
                <div className="flex flex-[999_1_640px] flex-col gap-7">
                    {[0, 1].map((i) => (
                        <div
                            key={i}
                            className="h-90 rounded-[14px] bg-itcc-blue-500 shadow-frame-blue motion-safe:animate-pulse"
                        />
                    ))}
                </div>
                <div className="h-80 flex-[1_1_320px] rounded-xl bg-white/70 motion-safe:animate-pulse" />
            </div>
        </div>
    );
}
