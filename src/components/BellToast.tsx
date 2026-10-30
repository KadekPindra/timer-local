import { BellIcon } from "./ui/icons";

export default function BellToast({ text }: { text: string }) {
    return (
        <div className="pointer-events-none absolute inset-x-0 -top-6.5 z-2 flex justify-center">
            <div
                role="status"
                className="inline-flex items-center gap-2.5 rounded-full border-2 border-itcc-orange-900 bg-linear-to-b from-itcc-orange-300 to-itcc-orange-500 px-5 py-2 font-pixel text-lg tracking-[1px] whitespace-nowrap text-white shadow-btn-primary text-shadow-pixel motion-safe:animate-toast"
            >
                <BellIcon size={22} strokeWidth={2.4} className="motion-safe:animate-bell" />
                {text}
            </div>
        </div>
    );
}
