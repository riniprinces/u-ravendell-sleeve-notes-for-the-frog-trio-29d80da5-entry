/**
 * Sleeve Notes for the Frog Trio — entry writer (revision 2).
 *
 * The entry is one album title plus a short back-cover blurb for a jazz
 * trio made entirely of frogs. This program loads that text from the
 * entry.txt shipped beside it, checks it against the bounty rules, and
 * copies it byte-for-byte into the output directory for the judge.
 *
 * Run:
 *   node main.ts
 *
 * Environment variables:
 *   MAKEFUN_BOT_DIR     folder containing entry.txt (default "/bot")
 *   MAKEFUN_OUTPUT_DIR  folder that receives entry.txt (default "/output")
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

// The entry itself, kept in code so the program is self-describing.
// It must match entry.txt exactly; main() enforces that.
const SLEEVE_TEXT = `Low Water at the Reeds

Three frogs, one upright bass, brushes on a snare made from a tin lid. The pianist holds a single low chord through all of "Reed Light" while the bass walks the pond's edge, slow as dusk. No solos, no showing off — just three voices in the dark, and it swings. It really swings.
`;

// Bounty limits: total entry length, title + blurb together.
const RULES = {
  minLength: 1,
  maxLength: 400,
  fileName: "entry.txt",
} as const;

type CheckResult = { ok: true; length: number } | { ok: false; reason: string };

/** Count Unicode code points, not UTF-16 units, so emoji count as one. */
function countChars(text: string): number {
  return Array.from(text).length;
}

/** Run every bounty rule over the text; return the first failure, if any. */
function checkEntry(text: string): CheckResult {
  if (typeof text !== "string") {
    return { ok: false, reason: `expected a string, received ${typeof text}` };
  }

  const length = countChars(text);

  if (length < RULES.minLength) {
    return {
      ok: false,
      reason: `entry is empty (0 characters); at least ${RULES.minLength} is required`,
    };
  }
  if (length > RULES.maxLength) {
    return {
      ok: false,
      reason: `entry is ${length} characters, over the ${RULES.maxLength} limit by ${length - RULES.maxLength}`,
    };
  }

  if (text.trim() === "") {
    return { ok: false, reason: "entry contains only whitespace" };
  }

  // A sleeve note is a title line, a blank line, then the blurb.
  const [title, separator, ...rest] = text.split("\n");
  if (!title || title.trim() === "") {
    return { ok: false, reason: "first line (the album title) is missing or blank" };
  }
  if (separator !== "") {
    return { ok: false, reason: "expected a blank line between the title and the blurb" };
  }
  if (rest.join("\n").trim() === "") {
    return { ok: false, reason: "the blurb after the title is missing" };
  }

  // Guard against mojibake: the text must survive a UTF-8 round-trip.
  if (Buffer.from(text, "utf8").toString("utf8") !== text) {
    return { ok: false, reason: "entry.txt is not valid UTF-8" };
  }

  return { ok: true, length };
}

/** Resolve a directory from an env var, falling back to a default. */
function resolveDir(envName: string, fallback: string): string {
  const raw = process.env[envName];
  return resolve(raw && raw.trim() !== "" ? raw : fallback);
}

function run(): number {
  const botDir = resolveDir("MAKEFUN_BOT_DIR", "/bot");
  const outDir = resolveDir("MAKEFUN_OUTPUT_DIR", "/output");
  const inputPath = join(botDir, RULES.fileName);
  const outputPath = join(outDir, RULES.fileName);

  if (!existsSync(inputPath)) {
    console.error(`ERROR: cannot find ${inputPath}`);
    console.error("Set MAKEFUN_BOT_DIR to the folder holding entry.txt.");
    return 1;
  }

  const text = readFileSync(inputPath, "utf8");
  const result = checkEntry(text);
  if (!result.ok) {
    console.error(`ERROR: invalid entry — ${result.reason}`);
    return 1;
  }

  if (text !== SLEEVE_TEXT) {
    console.error("ERROR: entry.txt disagrees with the SLEEVE_TEXT constant in main.ts");
    console.error("Update one of them so the two match byte-for-byte.");
    return 1;
  }

  console.log(`Entry valid: ${result.length} characters (limit ${RULES.maxLength}).`);
  console.log(`Title: ${text.split("\n")[0]}`);

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outputPath, text, "utf8");

  const copied = readFileSync(outputPath, "utf8");
  if (copied !== text) {
    console.error("ERROR: output file differs from the source after writing.");
    return 1;
  }

  console.log(`Wrote ${outputPath} (${Buffer.byteLength(text, "utf8")} bytes, byte-identical).`);
  return 0;
}

process.exitCode = run();
