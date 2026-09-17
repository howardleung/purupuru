// Read-only signature/literal checks, not a substitute for a managed secret scanner.
// Reports locations/types only; never log matching contents or credential values.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const git = (...args) => execFileSync("git", args, { maxBuffer: 64 * 1024 * 1024 });
const signatures = [
  ["Clerk secret", /sk_(?:live|test)_[A-Za-z0-9]{20,}/],
  ["GitHub token", /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})/],
  ["AWS access key", /(?:AKIA|ASIA)[A-Z0-9]{16}/],
  ["Private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["Database credential", /postgres(?:ql)?:\/\/(?!user:password@)[^\s"']+:[^\s"']+@[^\s"']+/],
];
const localSecrets = new Map();
for (const path of ["apps/web/.env.local", "packages/database/.env"]) {
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*(CLERK_SECRET_KEY|DATABASE_URL|DIRECT_URL|UPSTASH_REDIS_REST_TOKEN)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    const value = match[2].replace(/^(['"])(.*)\1$/, "$2");
    if (value.length >= 16 && !value.includes("replace_me") && !value.includes("user:password@")) {
      localSecrets.set(value, match[1]);
    }
  }
}
const findings = [];
function inspect(buffer, location, checkSignatures = true) {
  const text = buffer.toString("utf8");
  if (checkSignatures) {
    for (const [type, signature] of signatures) if (signature.test(text)) findings.push({ type, location });
  }
  for (const [value, type] of localSecrets) if (text.includes(value)) findings.push({ type, location });
}

const files = git("ls-files", "--cached", "--others", "--exclude-standard", "-z").toString().split("\0").filter(Boolean);
for (const file of files) if (existsSync(file)) inspect(readFileSync(file), `working-tree:${file}`);

// Scan every unique reachable blob, including removed files, without printing its contents.
const objects = git("rev-list", "--objects", "--all").toString().trim().split("\n");
let historyBlobs = 0;
for (const object of objects) {
  const [id, ...path] = object.split(" ");
  if (git("cat-file", "-t", id).toString().trim() !== "blob") continue;
  historyBlobs += 1;
  inspect(git("cat-file", "blob", id), `history:${id.slice(0, 12)}:${path.join(" ")}`);
}

let browserFiles = 0;
function browserScan(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) browserScan(path);
    else if (/\.(?:js|json|map)$/.test(path)) {
      browserFiles += 1;
      inspect(readFileSync(path), `browser-bundle:${path}`);
    }
  }
}
if (existsSync("apps/web/.next/static")) browserScan("apps/web/.next/static");
console.log(JSON.stringify({ workingTreeFiles: files.length, historyBlobs, browserFiles,
  localSecretTypesChecked: [...new Set(localSecrets.values())], findings }, null, 2));
if (findings.length) process.exitCode = 1;
