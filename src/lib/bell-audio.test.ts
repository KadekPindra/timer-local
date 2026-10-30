import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BELL_AUDIO } from "./bell-audio.generated";
import { CLIP_FILES, type Clip } from "./bell-plan";

describe("bell-audio.generated", () => {
    it.each([1, 2, 3] as Clip[])("rekaman %i× sama dengan file di public/audio", (clip) => {
        const file = readFileSync(`public/audio/${CLIP_FILES[clip]}`).toString("base64");
        expect(
            BELL_AUDIO[clip] === file,
            `public/audio/${CLIP_FILES[clip]} berubah. Jalankan \`npm run audio:embed\`.`,
        ).toBe(true);
    });
});
