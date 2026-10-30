"use client";

import { useBell } from "@/hooks/useBell";
import { PlayIcon } from "./ui/icons";
import PixelButton from "./ui/PixelButton";

export default function SoundTestPanel() {
    const { ring, volume, setVolume } = useBell();

    return (
        <section
            aria-labelledby="judul-suara"
            className="flex flex-col gap-3 rounded-xl border-2 border-itcc-orange-500 bg-itcc-peach p-5.5 shadow-card-orange"
        >
            <h2
                id="judul-suara"
                className="font-pixel text-lg font-normal tracking-[1px] text-itcc-red"
            >
                SUARA LONCENG
            </h2>
            <p className="text-sm leading-normal text-itcc-orange-ink">
                Tes dulu di laptop dan speaker yang dipakai saat hari H. Browser baru mengizinkan
                suara setelah ada klik di halaman.
            </p>
            <div className="flex flex-wrap gap-2.5">
                <PixelButton
                    variant="primary"
                    size="sm"
                    icon={<PlayIcon />}
                    onClick={() => void ring(1)}
                >
                    Tes 1×
                </PixelButton>
                <PixelButton variant="accent" size="sm" onClick={() => void ring(2)}>
                    Tes 2×
                </PixelButton>
            </div>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-itcc-orange-ink">
                Volume ({Math.round(volume * 100)}%)
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(volume * 100)}
                    onChange={(e) => setVolume(Number(e.target.value) / 100)}
                    className="accent-itcc-orange-500"
                />
            </label>
        </section>
    );
}
