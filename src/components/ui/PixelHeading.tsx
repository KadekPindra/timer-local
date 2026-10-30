import type { ReactNode } from "react";

function Bullet() {
    return <span aria-hidden="true" className="size-4 shrink-0 bg-itcc-heading clip-octagon" />;
}

type PixelHeadingProps = {
    children: ReactNode;
    bullets?: "both" | "start";
};

export default function PixelHeading({ children, bullets = "both" }: PixelHeadingProps) {
    const size =
        bullets === "both" ? "text-[clamp(1.75rem,6vw,3rem)]" : "text-[clamp(1.75rem,5vw,2.75rem)]";

    return (
        <div className="flex items-center gap-3 sm:gap-4">
            <Bullet />
            <h1
                className={`font-pixel leading-[1.1] font-normal tracking-[2px] text-balance text-itcc-heading uppercase text-shadow-pixel-outline ${size}`}
            >
                {children}
            </h1>
            {bullets === "both" && <Bullet />}
        </div>
    );
}
