import Image from "next/image";
import { ChevronLeftIcon } from "./ui/icons";
import PixelLink from "./ui/PixelLink";

type NotFoundPanelProps = {
    title?: string;
    description?: string;
};

export default function NotFoundPanel({
    title = "LOMBA TIDAK DITEMUKAN",
    description = "Mungkin linknya salah atau lomba ini sudah dihapus.",
}: NotFoundPanelProps) {
    return (
        <main className="mx-auto flex min-h-dvh max-w-150 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
            <Image
                src="/images/maskot-itcc.png"
                alt=""
                width={180}
                height={180}
                className="size-45"
            />
            <h1 className="font-pixel text-[32px] font-normal tracking-[2px] text-itcc-heading text-shadow-pixel-outline">
                {title}
            </h1>
            <p className="text-itcc-body">{description}</p>
            <PixelLink href="/" icon={<ChevronLeftIcon />} className="mt-2">
                Daftar Lomba
            </PixelLink>
        </main>
    );
}
