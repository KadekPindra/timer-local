import { readFileSync, writeFileSync } from "node:fs";

const FILES = { 1: "bell.mp3", 2: "bell_2.mp3", 3: "bell_3.mp3" };
const OUTPUT = new URL("../src/lib/bell-audio.generated.ts", import.meta.url);

const entries = Object.entries(FILES).map(([clip, file]) => {
    const base64 = readFileSync(new URL(`../public/audio/${file}`, import.meta.url)).toString(
        "base64",
    );
    return `    ${clip}: "${base64}",`;
});

writeFileSync(
    OUTPUT,
    `// Dibuat oleh scripts/embed-audio.mjs dari public/audio/. Jangan diedit manual: jalankan \`npm run audio:embed\`.\n\nexport const BELL_AUDIO = {\n${entries.join("\n")}\n} as const;\n`,
);

console.log(`Tertulis ${OUTPUT.pathname}`);
