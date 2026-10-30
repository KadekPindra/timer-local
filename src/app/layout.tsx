import type { Metadata } from "next";
import localFont from "next/font/local";
import { preload } from "react-dom";
import "./globals.css";

const poppins = localFont({
    variable: "--font-poppins",
    src: [
        { path: "./fonts/Poppins-Regular.ttf", weight: "400", style: "normal" },
        { path: "./fonts/Poppins-Medium.ttf", weight: "500", style: "normal" },
        { path: "./fonts/Poppins-SemiBold.ttf", weight: "600", style: "normal" },
        { path: "./fonts/Poppins-Bold.ttf", weight: "700", style: "normal" },
    ],
});

const title = "Timer Lomba — ITCC 2026";
const description = "Timer presentasi cabang lomba ITCC 2026, HMTI Universitas Udayana.";

export const metadata: Metadata = {
    metadataBase: new URL("http://localhost:3000"),
    title,
    description,
    openGraph: { title, description, type: "website", locale: "id_ID" },
    robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    preload("/fonts/Superstar.ttf", { as: "font", type: "font/ttf", crossOrigin: "anonymous" });

    return (
        <html lang="id" className={`${poppins.variable} antialiased`}>
            <body className="min-h-dvh font-sans text-itcc-ink itcc-bg">{children}</body>
        </html>
    );
}
