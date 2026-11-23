import { mkdirSync, writeFileSync } from "node:fs";

const TITLE = "Pondwater Blue";

const PARAGRAPHS = [
  "Three frogs, one late set at the Lily Pad. Marlowe on tenor sax, Bix on upright bass, Tad on brushes.",
  "They play slow, rain-wet blues that sound like the pond remembering summer.",
  "On \"Bullfrog Stomp\" the sax leans into the dark and the bass answers an inch behind the beat.",
  "You can hear the water. You will stay for the second set.",
];

const OUTPUT_PATH = "/output/entry.txt";

function buildEntry(): string {
  const body = PARAGRAPHS.join(" ");
  const text = [TITLE, "", body].join("\n");
  const trimmed = text.trim();
  if (trimmed.length < 1 || trimmed.length > 400) {
    throw new Error(`Entry must be 1-400 characters, got ${trimmed.length}`);
  }
  if (!trimmed) {
    throw new Error("Entry must not be only whitespace");
  }
  return `${trimmed}\n`;
}

const entry = buildEntry();
mkdirSync("/output", { recursive: true });
writeFileSync(OUTPUT_PATH, entry, "utf8");
console.log(`Wrote ${OUTPUT_PATH} (${entry.trim().length} characters)`);
