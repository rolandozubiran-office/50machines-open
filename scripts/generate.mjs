#!/usr/bin/env node
// Build downloadable model cards and guides for all 50 machines.
// Source of truth: data/machines.mjs and data/hub.es.json, plus the two
// reference guides. This does not invent build steps or numbers.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ERAS, MACHINES } from "../data/machines.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "download");
const MACHINES_DIR = join(OUT, "machines");
const SITE = "https://50machines.com";

const REFERENCE = {
  1: { src: "reference/kiln", files: ["guide.mjs", "model.mjs", "meta.json"] },
  23: { src: "reference/power", files: ["guide.mjs", "model.mjs"] },
};

const hub = JSON.parse(readFileSync(join(ROOT, "data", "hub.es.json"), "utf8"));

const fail = (message) => {
  console.error(`generate: ${message}`);
  process.exit(1);
};

const pad = (n) => String(n).padStart(2, "0");
const dirName = (n, slug) => `${pad(n)}-${slug}`;
const esc = (value) => String(value).replace(/[&<>"']/g, (ch) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[ch]));

function loadRecords() {
  if (!Array.isArray(MACHINES) || MACHINES.length !== 50) fail(`expected 50 machines, found ${MACHINES?.length}`);
  const eras = new Map(ERAS.map((era) => [era.id, era]));
  const seen = new Set();
  const slugs = new Set();
  const records = MACHINES.map((row) => {
    const [n, era, name, needs, line, keyNumber, difficulty, slug, prefix, brief] = row;
    if (!Number.isInteger(n) || n < 1 || n > 50) fail(`bad machine number ${n}`);
    if (seen.has(n)) fail(`duplicate machine number ${n}`);
    seen.add(n);
    if (!eras.has(era)) fail(`machine ${n} has unknown era ${era}`);
    if (!Array.isArray(needs) || needs.some((need) => !Number.isInteger(need) || need < 1 || need >= n)) {
      fail(`machine ${n} needs a machine that is not earlier in the tree`);
    }
    if (typeof slug !== "string" || !/^[a-z0-9-]{2,40}$/.test(slug) || slugs.has(slug)) fail(`bad slug for machine ${n}`);
    slugs.add(slug);
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) fail(`bad difficulty for machine ${n}`);
    const es = hub.machines?.[String(n)];
    if (!Array.isArray(es) || es.length < 4 || es.some((part, i) => i < 4 && typeof part !== "string")) {
      fail(`missing Spanish catalog entry for machine ${n}`);
    }
    const esEra = hub.eras?.[era];
    if (!Array.isArray(esEra) || esEra.length < 2) fail(`missing Spanish era ${era}`);
    const reference = REFERENCE[n] ?? null;
    return {
      n, era, name, needs, line, keyNumber, difficulty, slug, prefix, brief,
      briefKind: /^Built:\s*\S+/.test(brief) ? "pointer" : "design",
      enEra: eras.get(era),
      esEra,
      es: { name: es[0], line: es[1], keyNumber: es[2], title: es[3], note: es[4] ?? null },
      reference,
      kind: reference ? "reference" : "catalog",
    };
  });
  records.sort((a, b) => a.n - b.n);
  for (let i = 1; i <= 50; i++) if (records[i - 1].n !== i) fail(`missing machine ${i}`);
  const byN = new Map(records.map((record) => [record.n, record]));
  for (const record of records) {
    record.unlocks = records.filter((other) => other.needs.includes(record.n)).map((other) => other.n);
    record.byN = byN;
  }
  return records;
}

function machineLabel(record, n, lang) {
  const other = record.byN.get(n);
  return `${n}. ${lang === "es" ? other.es.name : other.name}`;
}

function listMachines(record, nums, lang, role) {
  if (nums.length) return nums.map((n) => machineLabel(record, n, lang)).join("; ");
  if (role === "unlocks") {
    return lang === "es" ? "Ninguna máquina posterior la lista." : "No later machine lists it.";
  }
  return lang === "es" ? "Ninguna. No depende de una máquina anterior." : "None. It does not depend on an earlier machine.";
}

function briefText(record, lang) {
  if (record.briefKind !== "pointer") return record.brief;
  const pointer = record.brief.match(/^Built:\s*(\S+?)\.?$/)?.[1] ?? record.brief;
  if (record.reference) {
    return lang === "es"
      ? `El catálogo apunta a \`${pointer}\`. La guía completa y el modelo físico están en \`reference/\` dentro de esta carpeta, copiados de \`${record.reference.src}\`.`
      : `The catalog points at \`${pointer}\`. The full guide and the physics model are in \`reference/\` inside this folder, copied from \`${record.reference.src}\`.`;
  }
  return lang === "es"
    ? `El catálogo no trae un párrafo de modelo. Apunta a \`${pointer}\`, y esa carpeta no está en este repositorio. Lo que sí está publicado es el lugar en el árbol y el número clave.`
    : `The catalog has no model paragraph here. It points at \`${pointer}\`, and that folder is not in this repository. What is published is the place in the tree and the key number.`;
}

function guideMd(record, lang) {
  const es = lang === "es";
  const title = es ? record.es.name : record.name;
  const line = es ? record.es.line : record.line;
  const key = es ? record.es.keyNumber : record.keyNumber;
  const eraName = es ? record.esEra[0] : record.enEra.name;
  const eraNote = es ? record.esEra[1] : record.enEra.note;
  const lines = [
    es
      ? `# ${record.n}. ${title}`
      : `# ${record.n}. ${title}`,
    "",
    es
      ? "Ficha generada a partir del catálogo abierto de este repositorio. Recoge el lugar de la máquina en el árbol, su número clave y la nota de modelo que ya está publicada. No añade pasos de construcción ni cifras que no estén en el catálogo."
      : "Card generated from the open catalog in this repository. It records the machine's place in the tree, its key number and the model note already published there. It does not add build steps or numbers that are not in the catalog.",
    "",
    es ? `- **Parte:** ${record.era} · ${eraName}` : `- **Part:** ${record.era} · ${eraName}`,
    es ? `- **Identificador:** \`${record.slug}\`` : `- **Slug:** \`${record.slug}\``,
    es ? `- **Dificultad:** ${record.difficulty} de 5` : `- **Difficulty:** ${record.difficulty} of 5`,
    es ? `- **Número clave:** ${key}` : `- **Key number:** ${key}`,
    es ? `- **Necesita:** ${listMachines(record, record.needs, "es", "needs")}` : `- **Needs:** ${listMachines(record, record.needs, "en", "needs")}`,
    es ? `- **Abre el paso a:** ${listMachines(record, record.unlocks, "es", "unlocks")}` : `- **Unlocks:** ${listMachines(record, record.unlocks, "en", "unlocks")}`,
    "",
    es ? "## Para qué sirve" : "## What it does",
    "",
    line,
    "",
    es ? `Esta parte del árbol: ${eraNote}` : `This part of the tree: ${eraNote}`,
  ];
  if (es && record.es.note) {
    lines.push("", record.es.note);
  }
  if (es && record.es.title) {
    lines.push("", `**En el sitio:** ${record.es.title}`);
  }
  lines.push(
    "",
    es ? "## Modelo" : "## Model",
    "",
    ...(es && record.briefKind === "design"
      ? ["Nota de modelo, en inglés, tal como está en `data/machines.mjs`:", ""]
      : []),
    briefText(record, lang),
    "",
    es ? "## Guía completa" : "## Full guide",
    "",
  );
  if (record.reference) {
    lines.push(es
      ? `Esta máquina tiene guía de referencia en el repositorio (\`${record.reference.src}\`). Esta descarga incluye \`reference/guide.mjs\` y \`reference/model.mjs\`.`
      : `This machine has a reference guide in the repository (\`${record.reference.src}\`). This download includes \`reference/guide.mjs\` and \`reference/model.mjs\`.`);
  } else {
    lines.push(es
      ? "La guía paso a paso, con sus comprobaciones, está en el sitio y en el libro. Esta ficha no la sustituye."
      : "The step-by-step guide, with a check for each step, is on the site and in the book. This card does not replace it.");
  }
  lines.push(
    "",
    es
      ? `Guía ilustrada (inglés): ${SITE}/guides/${record.slug}-guide.html`
      : `Illustrated guide: ${SITE}/guides/${record.slug}-guide.html`,
    "",
    es
      ? `Sitio en español: ${SITE}/es/`
      : `Spanish site: ${SITE}/es/`,
    "",
    es ? "## Seguridad" : "## Safety",
    "",
    es
      ? "Lee `SAFETY.md`. Algunas máquinas usan fuego, presión, metal fundido, gases tóxicos o mucha corriente. Construye bajo tu responsabilidad y conforme a la ley local. Estas fichas no son planos de ingeniería y no certifican nada."
      : "Read `SAFETY.md`. Some machines involve fire, pressure, molten metal, toxic gases or high current. Build at your own risk and follow local law. These cards are not engineering drawings and do not certify anything.",
    "",
  );
  return lines.join("\n");
}

function guideHtml(record) {
  const block = (lang, heading) => {
    const body = guideMd(record, lang)
      .split("\n")
      .map((line) => {
        if (line.startsWith("# ")) return `<h2>${esc(line.slice(2))}</h2>`;
        if (line.startsWith("## ")) return `<h3>${esc(line.slice(3))}</h3>`;
        if (line.startsWith("- **")) {
          const html = esc(line.slice(2)).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>");
          return `<li>${html.replace(/https:\/\/[^\s<]+/g, (url) => `<a href="${url}">${url}</a>`)}</li>`;
        }
        if (!line.trim()) return "";
        const html = esc(line).replace(/`([^`]+)`/g, "<code>$1</code>");
        return `<p>${html.replace(/https:\/\/[^\s<]+/g, (url) => `<a href="${url}">${url}</a>`)}</p>`;
      })
      .join("\n");
    return `<section lang="${lang}"><h2>${heading}</h2>\n${body}</section>`;
  };
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(`${record.n}. ${record.name}`)} · 50 Machines</title>
<style>
  body{margin:0;background:#f4f3ef;color:#1c1c1a;font:16px/1.55 Georgia,serif}
  main{max-width:42rem;margin:0 auto;padding:2rem 1.25rem 4rem}
  a{color:#6d4d0c} code{font-family:ui-monospace,monospace;font-size:.9em}
  h1,h2,h3{font-family:"Iowan Old Style",Georgia,serif;line-height:1.15}
  li{margin:.2rem 0}
  nav{font:13px/1.4 ui-sans-serif,system-ui,sans-serif;margin-bottom:1.5rem}
</style>
<main>
<nav><a href="../../index.html">All 50 machines</a></nav>
<h1>${esc(`${pad(record.n)} · ${record.name}`)}</h1>
<p lang="es">${esc(record.es.name)}</p>
${block("en", "English")}
${block("es", "Español")}
</main>
</html>
`;
}

function modelSource(record) {
  const catalog = {
    n: record.n,
    slug: record.slug,
    prefix: record.prefix,
    era: record.era,
    difficulty: record.difficulty,
    kind: record.kind,
    needs: record.needs,
    unlocks: record.unlocks,
    keyNumber: { en: record.keyNumber, es: record.es.keyNumber },
    en: { name: record.name, line: record.line },
    es: { name: record.es.name, line: record.es.line, title: record.es.title },
    brief: record.brief,
    briefKind: record.briefKind,
    reference: record.reference ? record.reference.src : null,
    siteGuide: `${SITE}/guides/${record.slug}-guide.html`,
  };
  const lines = [
    "// Generated by scripts/generate.mjs. Do not edit by hand.",
    "// Catalog card from data/machines.mjs and data/hub.es.json.",
    `export const CATALOG = ${JSON.stringify(catalog, null, 2)};`,
    "",
    "export function summary(lang = \"en\") {",
    "  const block = lang === \"es\" ? CATALOG.es : CATALOG.en;",
    "  return CATALOG.n + \". \" + block.name + \" — \" + block.line;",
    "}",
    "",
  ];
  if (record.reference) {
    lines.push("export * as referenceModel from \"./reference/model.mjs\";", "");
  }
  return lines.join("\n");
}

function metaOf(record) {
  return {
    n: record.n,
    slug: record.slug,
    prefix: record.prefix,
    era: record.era,
    name: record.name,
    tagline: record.line,
    keyNumber: record.keyNumber,
    difficulty: record.difficulty,
    needs: record.needs,
    unlocks: record.unlocks,
    kind: record.kind,
    safety: "Read SAFETY.md. This generated card does not certify a build.",
    catalog: "data/machines.mjs",
    siteGuide: `${SITE}/guides/${record.slug}-guide.html`,
    es: {
      name: record.es.name,
      tagline: record.es.line,
      keyNumber: record.es.keyNumber,
      title: record.es.title,
    },
  };
}

function indexHtml(records) {
  const rows = records.map((record) => `<tr>
<td>${record.n}</td>
<td><a href="machines/${dirName(record.n, record.slug)}/guide.html">${esc(record.name)}</a></td>
<td lang="es">${esc(record.es.name)}</td>
<td>${esc(record.keyNumber)}</td>
<td>${record.kind}</td>
</tr>`).join("\n");
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>50 Machines · downloadable model cards</title>
<style>
  body{margin:0;background:#f4f3ef;color:#1c1c1a;font:16px/1.5 Georgia,serif}
  main{max-width:60rem;margin:0 auto;padding:2rem 1.25rem 4rem}
  table{border-collapse:collapse;width:100%;font:14px/1.4 ui-sans-serif,system-ui,sans-serif}
  th,td{text-align:left;padding:.4rem .5rem;border-bottom:1px solid #d9d6cc;vertical-align:top}
  a{color:#6d4d0c}
</style>
<main>
<h1>50 Machines</h1>
<p>Downloadable model cards generated from the open catalog. <a href="50-machines.zip">Download the zip</a>.</p>
<p lang="es">Fichas generadas desde el catálogo abierto. <a href="50-machines.zip">Descargar el zip</a>.</p>
<table>
<thead><tr><th>No.</th><th>English</th><th>Español</th><th>Key number</th><th>Kind</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
</main>
</html>
`;
}

function downloadReadme() {
  return `# Downloadable model cards

Generated by \`node scripts/generate.mjs\`. Do not edit these files by hand.

There are 50 folders under \`machines/\`. Each one has \`meta.json\`, \`model.mjs\`, \`guide.en.md\`, \`guide.es.md\` and \`guide.html\`. Open \`index.html\`, or take \`50-machines.zip\`.

Machines 1 (\`01-kiln\`) and 23 (\`23-power\`) also include the reference guide and the physics model in \`reference/\`. The other cards are the open catalog: place in the tree, key number and design brief. They are not step-by-step shop guides.

# Fichas descargables

Generadas con \`node scripts/generate.mjs\`. No las edites a mano.

Hay 50 carpetas en \`machines/\`. Cada una tiene la ficha en inglés y en español. Abre \`index.html\` o descarga \`50-machines.zip\`.

Las máquinas 1 y 23 incluyen además la guía de referencia. Las demás fichas son el catálogo abierto, no una guía de taller paso a paso.
`;
}

function countFiles(dir) {
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) count += countFiles(path);
    else count += 1;
  }
  return count;
}

function writeTree(records) {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(MACHINES_DIR, { recursive: true });
  const index = [];
  for (const record of records) {
    const folder = dirName(record.n, record.slug);
    const dir = join(MACHINES_DIR, folder);
    mkdirSync(dir, { recursive: true });
    const files = ["meta.json", "model.mjs", "guide.en.md", "guide.es.md", "guide.html"];
    writeFileSync(join(dir, "meta.json"), `${JSON.stringify(metaOf(record), null, 2)}\n`);
    writeFileSync(join(dir, "model.mjs"), modelSource(record));
    writeFileSync(join(dir, "guide.en.md"), guideMd(record, "en"));
    writeFileSync(join(dir, "guide.es.md"), guideMd(record, "es"));
    writeFileSync(join(dir, "guide.html"), guideHtml(record));
    if (record.reference) {
      const refDir = join(dir, "reference");
      mkdirSync(refDir);
      for (const file of record.reference.files) {
        const src = join(ROOT, record.reference.src, file);
        if (!statSync(src, { throwIfNoEntry: false })) fail(`missing ${record.reference.src}/${file}`);
        copyFileSync(src, join(refDir, file));
        files.push(`reference/${file}`);
      }
    }
    index.push({
      n: record.n,
      slug: record.slug,
      dir: `machines/${folder}`,
      en: record.name,
      es: record.es.name,
      kind: record.kind,
      files,
    });
  }
  writeFileSync(join(OUT, "index.json"), `${JSON.stringify({ count: records.length, generator: "scripts/generate.mjs", sources: ["data/machines.mjs", "data/hub.es.json"], machines: index }, null, 2)}\n`);
  writeFileSync(join(OUT, "index.html"), indexHtml(records));
  writeFileSync(join(OUT, "README.md"), downloadReadme());
}

async function importModels(records) {
  for (const record of records) {
    const modelPath = join(MACHINES_DIR, dirName(record.n, record.slug), "model.mjs");
    const mod = await import(pathToFileURL(modelPath).href);
    if (mod.CATALOG?.n !== record.n || mod.CATALOG.slug !== record.slug) fail(`model import mismatch for ${record.n}`);
    const text = mod.summary("en");
    if (!text.startsWith(`${record.n}. `)) fail(`summary failed for ${record.n}`);
    if (mod.summary("es") === text) fail(`Spanish summary matches English for ${record.n}`);
    if (record.slug === "kiln" && typeof mod.referenceModel?.tempAt !== "function") fail("kiln physics model did not load");
    if (record.slug === "power" && typeof mod.referenceModel?.hydroWatts !== "function") fail("power physics model did not load");
    if (!record.reference && mod.referenceModel) fail(`unexpected reference model on ${record.n}`);
  }
}

function zipCounts(zipPath) {
  const script = `
import zipfile, sys
z = zipfile.ZipFile(sys.argv[1])
names = [n for n in z.namelist() if not n.endswith("/")]
def ends(s):
    return sum(1 for n in names if n.endswith(s))
print(len(names))
print(ends("/meta.json") - ends("/reference/meta.json"))
print(ends("/model.mjs") - ends("/reference/model.mjs"))
print(ends("guide.en.md"))
print(ends("guide.es.md"))
print(ends("guide.html"))
print(ends("reference/guide.mjs"))
print(ends("reference/model.mjs"))
print(ends("reference/meta.json"))
`;
  const out = execFileSync("python3", ["-c", script, zipPath], { encoding: "utf8" }).trim().split("\n").map(Number);
  const [entries, meta, model, en, es, html, refGuide, refModel, refMeta] = out;
  return { entries, meta, model, en, es, html, refGuide, refModel, refMeta };
}

async function main() {
  const major = Number(process.versions.node.split(".")[0]);
  if (major < 18) fail(`Node.js 18 or newer is required (found ${process.versions.node})`);
  const records = loadRecords();
  writeTree(records);
  await importModels(records);
  const zipPath = join(OUT, "50-machines.zip");
  execFileSync("zip", ["-r", "-q", "50-machines.zip", "index.html", "index.json", "README.md", "machines"], { cwd: OUT });
  const zip = zipCounts(zipPath);
  const folders = readdirSync(MACHINES_DIR).length;
  const machineFiles = countFiles(MACHINES_DIR);
  const manifest = [
    `machines=${records.length}`,
    `folders=${folders}`,
    `machineFiles=${machineFiles}`,
    `meta.json=${records.length}`,
    `model.mjs=${records.length}`,
    `guide.en.md=${records.length}`,
    `guide.es.md=${records.length}`,
    `guide.html=${records.length}`,
    `referenceGuides=${records.filter((record) => record.reference).length}`,
    `referenceGuideFiles=${records.reduce((sum, record) => sum + (record.reference?.files.length ?? 0), 0)}`,
    `imports=${records.length}`,
    `zipBytes=${statSync(zipPath).size}`,
    `zipEntries=${zip.entries}`,
    `zipMeta=${zip.meta}`,
    `zipModel=${zip.model}`,
    `zipGuideEn=${zip.en}`,
    `zipGuideEs=${zip.es}`,
    `zipGuideHtml=${zip.html}`,
    `zipReferenceGuides=${zip.refGuide}`,
    `zipReferenceModels=${zip.refModel}`,
    `zipReferenceMeta=${zip.refMeta}`,
  ];
  const expected = {
    machines: 50, folders: 50, meta: 50, model: 50, en: 50, es: 50, html: 50,
    referenceGuides: 2, referenceGuideFiles: 5, imports: 50,
    zipMeta: 50, zipModel: 50, zipGuideEn: 50, zipGuideEs: 50, zipGuideHtml: 50,
    zipReferenceGuides: 2, zipReferenceModels: 2, zipReferenceMeta: 1,
  };
  const got = {
    machines: records.length,
    folders,
    meta: records.length,
    model: records.length,
    en: records.length,
    es: records.length,
    html: records.length,
    referenceGuides: records.filter((record) => record.reference).length,
    referenceGuideFiles: records.reduce((sum, record) => sum + (record.reference?.files.length ?? 0), 0),
    imports: records.length,
    zipMeta: zip.meta,
    zipModel: zip.model,
    zipGuideEn: zip.en,
    zipGuideEs: zip.es,
    zipGuideHtml: zip.html,
    zipReferenceGuides: zip.refGuide,
    zipReferenceModels: zip.refModel,
    zipReferenceMeta: zip.refMeta,
  };
  for (const [key, value] of Object.entries(expected)) {
    if (got[key] !== value) fail(`${key}: expected ${value}, got ${got[key]}`);
  }
  if (machineFiles !== 50 * 5 + 5) fail(`machineFiles: expected ${50 * 5 + 5}, got ${machineFiles}`);
  writeFileSync(join(OUT, "MANIFEST.txt"), `${manifest.join("\n")}\n`);
  console.log(manifest.join("\n"));
  console.log("generate: ok");
}

main().catch((error) => fail(error.stack || error.message));
