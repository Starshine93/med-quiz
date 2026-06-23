#!/usr/bin/env node
// Validates all question JSON files against schema and quality rules.
// No network. Run: node scripts/validate.js [topicId]

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const MANIFEST_PATH = path.join(DATA_DIR, "manifest.json");

// --- helpers ---

function loadJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    console.error(`  ERROR: Cannot parse ${filePath}: ${e.message}`);
    process.exit(1);
  }
}

// Normalise a question stem for fuzzy duplicate detection:
// lowercase, strip punctuation, collapse whitespace.
function normStem(str) {
  return str
    .toLowerCase()
    .replace(/[«»„""\(\)\[\]]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Levenshtein distance (capped at maxDist to keep it fast).
function levDist(a, b, maxDist = 30) {
  if (Math.abs(a.length - b.length) > maxDist) return maxDist + 1;
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => i);
  for (let j = 1; j <= n; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= m; i++) {
      const temp = dp[i];
      dp[i] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, dp[i], dp[i - 1]);
      prev = temp;
    }
  }
  return dp[m];
}

// Similarity ratio [0-1] between two stems (word-overlap + char-level Lev).
function similarity(a, b) {
  const wa = new Set(a.split(" ").filter(w => w.length > 3));
  const wb = new Set(b.split(" ").filter(w => w.length > 3));
  if (wa.size === 0 && wb.size === 0) return 0;
  const intersection = [...wa].filter(w => wb.has(w)).length;
  const union = new Set([...wa, ...wb]).size;
  const jaccard = union > 0 ? intersection / union : 0;
  // short-circuit: avoid expensive Lev on very long strings
  const shorter = a.length < b.length ? a : b;
  const longer  = a.length >= b.length ? a : b;
  const levSim = shorter.length < 200
    ? 1 - levDist(shorter, longer.slice(0, shorter.length + 20)) / Math.max(shorter.length, 1)
    : 0;
  return 0.7 * jaccard + 0.3 * Math.max(0, levSim);
}

const DUPE_THRESHOLD = 0.72; // tune as needed

// --- validation ---

function validateQuestions(questions, topicId) {
  const errors = [];
  const warnings = [];
  const seenIds = new Map(); // id -> index

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const loc = `[${i}] id=${q.id ?? "?"}`;

    // Required field presence
    if (!q.id || typeof q.id !== "string" || q.id.trim() === "") {
      errors.push(`${loc}: missing or empty 'id'`);
    }
    if (!q.topicId || q.topicId !== topicId) {
      errors.push(`${loc}: 'topicId' must equal "${topicId}", got "${q.topicId}"`);
    }
    if (!q.question || typeof q.question !== "string" || q.question.trim().length < 10) {
      errors.push(`${loc}: 'question' missing or too short`);
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      errors.push(`${loc}: 'options' must be an array of exactly 4 elements`);
    } else {
      q.options.forEach((opt, oi) => {
        if (typeof opt !== "string" || opt.trim() === "") {
          errors.push(`${loc}: options[${oi}] is empty or not a string`);
        }
      });
    }
    if (typeof q.correctIndex !== "number" || ![0, 1, 2, 3].includes(q.correctIndex)) {
      errors.push(`${loc}: 'correctIndex' must be 0, 1, 2, or 3`);
    }
    if (!q.explanation || typeof q.explanation !== "string" || q.explanation.trim().length < 10) {
      errors.push(`${loc}: 'explanation' missing or too short`);
    }
    if (!["easy", "medium", "hard"].includes(q.difficulty)) {
      errors.push(`${loc}: 'difficulty' must be "easy", "medium", or "hard"`);
    }
    if (!Array.isArray(q.tags)) {
      errors.push(`${loc}: 'tags' must be an array`);
    }

    // Unique IDs
    if (q.id) {
      if (seenIds.has(q.id)) {
        errors.push(`${loc}: duplicate id "${q.id}" (first seen at index ${seenIds.get(q.id)})`);
      } else {
        seenIds.set(q.id, i);
      }
    }

    // Russian content check (Cyrillic chars present)
    if (q.question && !/[а-яёА-ЯЁ]/.test(q.question)) {
      warnings.push(`${loc}: 'question' contains no Cyrillic — expected Russian`);
    }
    if (q.explanation && !/[а-яёА-ЯЁ]/.test(q.explanation)) {
      warnings.push(`${loc}: 'explanation' contains no Cyrillic — expected Russian`);
    }
  }

  // Fuzzy duplicate stem detection (O(n²) — fine for <200 questions)
  const stems = questions.map(q => normStem(q.question ?? ""));
  for (let i = 0; i < stems.length; i++) {
    for (let j = i + 1; j < stems.length; j++) {
      const sim = similarity(stems[i], stems[j]);
      if (sim >= DUPE_THRESHOLD) {
        warnings.push(
          `Possible duplicate stems (${(sim * 100).toFixed(0)}% similar):\n` +
          `  [${i}] "${questions[i].question?.slice(0, 80)}"\n` +
          `  [${j}] "${questions[j].question?.slice(0, 80)}"`
        );
      }
    }
  }

  return { errors, warnings };
}

// --- main ---

const manifest = loadJSON(MANIFEST_PATH);
const filterTopic = process.argv[2]; // optional: validate only one topic

let totalErrors = 0;
let totalWarnings = 0;
let totalQuestions = 0;
const updatedManifest = [];

for (const entry of manifest) {
  if (filterTopic && entry.id !== filterTopic) {
    updatedManifest.push(entry);
    continue;
  }

  const filePath = path.join(DATA_DIR, entry.file);
  if (!fs.existsSync(filePath)) {
    console.error(`MISSING: ${filePath}`);
    totalErrors++;
    updatedManifest.push(entry);
    continue;
  }

  const questions = loadJSON(filePath);

  if (!Array.isArray(questions)) {
    console.error(`ERROR: ${filePath} is not a JSON array`);
    totalErrors++;
    updatedManifest.push(entry);
    continue;
  }

  const { errors, warnings } = validateQuestions(questions, entry.id);
  const count = questions.length;

  const status = errors.length > 0 ? "FAIL" : warnings.length > 0 ? "WARN" : "OK";
  console.log(`\n[${status}] ${entry.id} — ${count} questions`);

  if (errors.length > 0) {
    errors.forEach(e => console.error(`  ERROR: ${e}`));
  }
  if (warnings.length > 0) {
    warnings.forEach(w => console.warn(`  WARN:  ${w}`));
  }
  if (errors.length === 0 && warnings.length === 0) {
    console.log("  All checks passed.");
  }

  totalErrors += errors.length;
  totalWarnings += warnings.length;
  totalQuestions += count;
  updatedManifest.push({ ...entry, questionCount: count });
}

// Write updated manifest with real question counts
fs.writeFileSync(MANIFEST_PATH, JSON.stringify(updatedManifest, null, 2) + "\n");
console.log(`\nManifest updated: ${MANIFEST_PATH}`);

console.log(`\n=== Summary ===`);
console.log(`Total questions: ${totalQuestions}`);
console.log(`Errors:   ${totalErrors}`);
console.log(`Warnings: ${totalWarnings}`);

if (totalErrors > 0) {
  console.error("\nValidation FAILED — fix errors above before using questions in the app.");
  process.exit(1);
} else {
  console.log("\nValidation PASSED.");
  process.exit(0);
}
