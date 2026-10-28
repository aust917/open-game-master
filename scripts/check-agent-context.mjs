// Dependency-free checks for the fork's navigation and instruction budgets.
// Run from any directory: node scripts/check-agent-context.mjs
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const files = [...new Set(execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
  cwd: root, encoding: "utf8", maxBuffer: 8 * 1024 * 1024,
}).split("\0").filter(Boolean))];
const required = [
  "AGENTS.md", "CLAUDE.md", ".github/copilot-instructions.md", "README.md",
  "docs/fork/README.md", "docs/fork/architecture.md", "docs/fork/product.md",
  "docs/fork/roadmap.md", "docs/fork/development.md", "docs/fork/upstream.md",
  "docs/fork/agent-practices.md", "docs/fork/ui-controls.md",
  "docs/fork/decisions/0001-repository-structure.md",
];
const isInstructions = (file) => /(^|\/)AGENTS(?:\.override)?\.md$/.test(file);
const isAdapter = (file) => file === "CLAUDE.md" || file === ".github/copilot-instructions.md";
const managed = files.filter((file) => isInstructions(file) || isAdapter(file) ||
  /^docs\/fork\/.*\.md$/.test(file) || file === "README.md" || file === ".github/pull_request_template.md");
const errors = [];
const budgets = [];
for (const file of required) {
  if (!files.includes(file) || !existsSync(path.join(root, file))) errors.push(`Missing required document: ${file}`);
}
for (const file of managed) {
  const absolute = path.join(root, file);
  if (!existsSync(absolute)) {
    errors.push(`Tracked document was deleted: ${file}`);
    continue;
  }
  const content = readFileSync(absolute, "utf8").replace(/\r\n/g, "\n");
  if (isInstructions(file) || isAdapter(file)) {
    const [maxLines, maxBytes] = isAdapter(file) ? [15, 1024] : file === "AGENTS.md" ? [80, 6144] : [45, 4096];
    const lines = content.trimEnd().split("\n").length;
    const bytes = Buffer.byteLength(content, "utf8");
    budgets.push(`${file}: ${lines}/${maxLines} lines, ${bytes}/${maxBytes} bytes`);
    if (lines > maxLines || bytes > maxBytes) errors.push(`Instruction budget exceeded: ${file}`);
  }
  if (file === "CLAUDE.md" && content.trim() !== "@AGENTS.md") {
    errors.push("CLAUDE.md must remain a thin @AGENTS.md adapter.");
  }
  // The upstream README is preserved verbatim; only the fork's new entry block is managed here.
  let text = content;
  if (file === "README.md") {
    const match = content.match(/<!-- BEGIN: russian-fork -->([\s\S]*?)<!-- END: russian-fork -->/);
    if (!match) errors.push("README.md is missing the fork entry block.");
    text = match?.[1] ?? "";
  }
  // Ignore example code fences. Check inline links and reference-style definitions.
  text = text.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\s*$/gm, "");
  const links = [
    ...text.matchAll(/\[[^\]\n]*\]\(\s*(<[^>\n]+>|[^\s)]+)(?:\s+"[^"]*")?\s*\)/g),
    ...text.matchAll(/^\s*\[[^\]\n]+\]:\s*(<[^>\n]+>|\S+)/gm),
  ];
  for (const match of links) {
    const link = match[1].replace(/^<|>$/g, "");
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(link)) continue;
    let localPath;
    try { localPath = decodeURIComponent(link.split(/[?#]/)[0]); }
    catch { errors.push(`${file}: invalid encoded link ${link}`); continue; }
    const target = path.resolve(path.dirname(absolute), localPath);
    const relative = path.relative(root, target);
    if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      errors.push(`${file}: link leaves repository: ${link}`);
    } else if (!existsSync(target)) {
      errors.push(`${file}: broken local link: ${link}`);
    }
  }
}
for (const budget of budgets) console.log(budget);
if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log(`Agent context OK: ${managed.length} documents; local link targets exist.`);
}
