#!/usr/bin/env node
/**
 * build-schema.mjs
 *
 * Concatenates modular GraphQL schema files into:
 *   appsync/schema.graphql
 *
 * Enforces:
 *  - deterministic ordering
 *  - non-empty modules
 *  - duplicate type detection w/ file + line
 *  - one-type-per-module ownership (no duplicate definitions)
 *  - layer rules (root vs core vs domain modules)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse, Kind } from "graphql";

/* -------------------------------------------------- */
/* Paths */
/* -------------------------------------------------- */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");
const SCHEMA_DIR = path.join(ROOT, "appsync", "schema");
const OUTPUT_FILE = path.join(ROOT, "appsync", "schema.graphql");

/* -------------------------------------------------- */
/* Canonical schema order (DO NOT ALPHABETIZE) */
/* -------------------------------------------------- */

const MODULE_ORDER = [
  "00_scalars.graphql",
  "01_directives.graphql",

  "10_root.graphql",
  "15_core.graphql",

  "20_closet.graphql",
  "30_bestie.graphql",
  "40_stories.graphql",
];

/* -------------------------------------------------- */
/* Errors */
/* -------------------------------------------------- */

function die(message) {
  console.error(`\n❌ build-schema failed:\n${message}\n`);
  process.exit(1);
}

function prettyLoc(sourceText, locStart) {
  let line = 1;
  for (let i = 0; i < locStart && i < sourceText.length; i++) {
    if (sourceText[i] === "\n") line++;
  }
  return line;
}

/* -------------------------------------------------- */
/* Layer rules */
/* -------------------------------------------------- */

function layerOf(fileName) {
  const m = /^(\d{2})_/.exec(fileName);
  if (!m) return "unknown";

  const n = Number(m[1]);

  if (n === 0) return "scalars";
  if (n === 1) return "directives";
  if (n === 10) return "root";
  if (n === 15) return "core";
  if (n >= 20) return "domain";

  return "unknown";
}

function assertLayerRules(fileName, doc) {
  const layer = layerOf(fileName);
  const bad = (msg) => die(`${fileName}: ${msg}`);

  for (const def of doc.definitions) {
    switch (layer) {
      case "scalars": {
        if (def.kind !== Kind.SCALAR_TYPE_DEFINITION) {
          bad(
            `Only scalar definitions are allowed in 00_scalars.graphql. Found: ${def.kind}`
          );
        }
        break;
      }

      case "directives": {
        if (def.kind !== Kind.DIRECTIVE_DEFINITION) {
          bad(
            `Only directive definitions are allowed in 01_directives.graphql. Found: ${def.kind}`
          );
        }
        break;
      }

      case "root": {
        // Root can define/extend Query/Mutation and optional schema { ... }
        if (
          (def.kind === Kind.OBJECT_TYPE_DEFINITION ||
            def.kind === Kind.OBJECT_TYPE_EXTENSION) &&
          def.name?.value &&
          (def.name.value === "Query" || def.name.value === "Mutation")
        ) {
          break;
        }

        if (def.kind === Kind.SCHEMA_DEFINITION) {
          break;
        }

        bad(
          `Root layer (10_root.graphql) may only define/extend Query/Mutation (and optional schema). ` +
            `Move this definition to a core/domain module: ${def.kind}${
              def.name?.value ? ` "${def.name.value}"` : ""
            }`
        );
      }

      case "core": {
        // Core may NOT define Query/Mutation (can extend if absolutely necessary, but prefer domain modules)
        if (
          def.kind === Kind.OBJECT_TYPE_DEFINITION &&
          def.name?.value &&
          (def.name.value === "Query" || def.name.value === "Mutation")
        ) {
          bad(
            `Core layer may not define type "${def.name.value}". ` +
              `Define it in 10_root.graphql and use "extend type ${def.name.value}" elsewhere.`
          );
        }

        if (def.kind === Kind.SCHEMA_DEFINITION) {
          bad(
            `Core layer may not define "schema { ... }". Put schema definition in 10_root.graphql (optional).`
          );
        }

        break;
      }

      case "domain": {
        // Domain modules may NOT define Query/Mutation (they can extend)
        if (
          def.kind === Kind.OBJECT_TYPE_DEFINITION &&
          def.name?.value &&
          (def.name.value === "Query" || def.name.value === "Mutation")
        ) {
          bad(
            `Domain modules may not define type "${def.name.value}". ` +
              `Use "extend type ${def.name.value}" and put the base definition in 10_root.graphql.`
          );
        }

        if (def.kind === Kind.SCHEMA_DEFINITION) {
          bad(
            `Domain modules may not define "schema { ... }". Put schema definition in 10_root.graphql (optional).`
          );
        }

        break;
      }

      default:
        bad(
          `Unknown schema layer. File name should start with NN_. Allowed: 00, 01, 10, 15, 20+. Found layer: ${layer}`
        );
    }
  }
}

/* -------------------------------------------------- */
/* One-type-per-module + duplicate detection */
/* -------------------------------------------------- */

function collectDefinitions(fileName, doc, raw) {
  // Only "definitions" own names. Extensions do not own.
  const out = [];

  for (const def of doc.definitions) {
    const isTypeDef =
      def.kind === Kind.OBJECT_TYPE_DEFINITION ||
      def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION ||
      def.kind === Kind.ENUM_TYPE_DEFINITION ||
      def.kind === Kind.INTERFACE_TYPE_DEFINITION ||
      def.kind === Kind.UNION_TYPE_DEFINITION ||
      def.kind === Kind.SCALAR_TYPE_DEFINITION ||
      def.kind === Kind.DIRECTIVE_DEFINITION;

    if (!isTypeDef) continue;

    if (def.kind === Kind.DIRECTIVE_DEFINITION) {
      const dirName = def.name?.value;
      const line = def.loc ? prettyLoc(raw, def.loc.start) : "?";
      out.push({
        key: `@${dirName}`,
        kind: def.kind,
        fileName,
        line,
      });
      continue;
    }

    const name = def.name?.value;
    if (!name) continue;

    const line = def.loc ? prettyLoc(raw, def.loc.start) : "?";
    out.push({
      key: name,
      kind: def.kind,
      fileName,
      line,
    });
  }

  return out;
}

/* -------------------------------------------------- */
/* Read module */
/* -------------------------------------------------- */

function readModule(fileName) {
  const fullPath = path.join(SCHEMA_DIR, fileName);

  if (!fs.existsSync(fullPath)) {
    die(`Missing schema module: ${fileName}`);
  }

  const raw = fs.readFileSync(fullPath, "utf8");
  const trimmed = raw.trim();

  if (!trimmed) {
    die(`Schema module is empty: ${fileName}`);
  }

  let doc;
  try {
    doc = parse(trimmed, { noLocation: false });
  } catch (e) {
    die(`GraphQL parse error in ${fileName}:\n${e.message}`);
  }

  // Enforce layer rules
  assertLayerRules(fileName, doc);

  return { fileName, fullPath, raw: trimmed, doc };
}

/* -------------------------------------------------- */
/* Build */
/* -------------------------------------------------- */

console.log("🔧 Building AppSync schema...");
console.log(`📁 Source dir: ${SCHEMA_DIR}`);

const modules = MODULE_ORDER.map(readModule);

/* -------------------------------------------------- */
/* Duplicate detection w/ ownership */
/* -------------------------------------------------- */

const ownership = new Map(); // key -> { fileName, line, kind }
const duplicates = [];

for (const mod of modules) {
  const defs = collectDefinitions(mod.fileName, mod.doc, mod.raw);

  for (const d of defs) {
    if (!ownership.has(d.key)) {
      ownership.set(d.key, d);
      continue;
    }

    const first = ownership.get(d.key);
    duplicates.push({ key: d.key, first, second: d });
  }
}

if (duplicates.length) {
  const msg =
    duplicates
      .map((dup) => {
        return (
          `Duplicate definition for "${dup.key}"\n` +
          `  First:  ${dup.first.fileName}:${dup.first.line}\n` +
          `  Second: ${dup.second.fileName}:${dup.second.line}\n`
        );
      })
      .join("\n") +
    `\nFix: keep each type/input/enum/scalar/directive defined in exactly ONE module.\n`;

  die(msg);
}

/* -------------------------------------------------- */
/* Assemble */
/* -------------------------------------------------- */

let output = `# ===============================================
# ⚠️  AUTO-GENERATED FILE — DO NOT EDIT
#
# Generated by: scripts/build-schema.mjs
# Source: appsync/schema/*.graphql
# ===============================================

`;

for (const mod of modules) {
  output += `# -----------------------------------------------
# ${mod.fileName}
# -----------------------------------------------

${mod.raw}

`;
}

/* -------------------------------------------------- */
/* Write */
/* -------------------------------------------------- */

fs.writeFileSync(OUTPUT_FILE, output, "utf8");

console.log(`✅ Schema built successfully`);
console.log(`📄 Output: ${OUTPUT_FILE}`);
