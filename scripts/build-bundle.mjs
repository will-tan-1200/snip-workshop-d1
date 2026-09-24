import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backendDir = join(repoRoot, "backend");
const frontendDir = join(repoRoot, "frontend");
const cliDir = join(repoRoot, "cli");
const bundleDir = join(repoRoot, "bundle");
const publicDir = join(bundleDir, "public");
const frontendIndex = join(frontendDir, "dist", "snip-frontend", "browser", "index.html");
const shouldPush = process.argv.slice(2).length === 1 && process.argv[2] === "--push";

if (process.argv.slice(2).length > 1 || (process.argv[2] && !shouldPush)) {
  throw new Error("Usage: node scripts/build-bundle.mjs [--push]");
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";

function run(command, args, cwd = repoRoot) {
  console.log(`> ${command} ${args.join(" ")}`);
  const isWindowsCommand = process.platform === "win32" && command.endsWith(".cmd");
  const executable = isWindowsCommand ? (process.env.ComSpec || "cmd.exe") : command;
  const executableArgs = isWindowsCommand
    ? ["/d", "/s", "/c", [command, ...args].join(" ")]
    : args;
  execFileSync(executable, executableArgs, { cwd, stdio: "inherit" });
}

function hasStagedChanges(cwd) {
  const result = spawnSync("git", ["diff", "--cached", "--quiet"], {
    cwd,
    stdio: "ignore",
  });
  if (result.status === 0) return false;
  if (result.status === 1) return true;
  throw new Error(`Could not inspect staged changes in ${cwd}`);
}

function commitIfChanged(cwd, message, emptyMessage) {
  run("git", ["add", "-A"], cwd);
  if (!hasStagedChanges(cwd)) {
    console.log(emptyMessage);
    return false;
  }
  run("git", ["commit", "-m", message], cwd);
  return true;
}

run("git", ["submodule", "update", "--init", "--remote", "backend", "frontend", "cli"]);
run(npmCommand, ["install"], frontendDir);
run(npxCommand, ["ng", "build"], frontendDir);

if (!existsSync(frontendIndex)) {
  throw new Error(`Frontend build output is missing: ${frontendIndex}`);
}

for (const generatedPath of [
  "server.js",
  "cli.js",
  ".env",
  "package.json",
  "Dockerfile",
  ".dockerignore",
  "railway.json",
]) {
  rmSync(join(bundleDir, generatedPath), { force: true });
}
rmSync(publicDir, { force: true, recursive: true });
mkdirSync(bundleDir, { recursive: true });
cpSync(join(backendDir, "server.js"), join(bundleDir, "server.js"));
cpSync(join(cliDir, "cli.js"), join(bundleDir, "cli.js"));
cpSync(join(frontendDir, "dist", "snip-frontend", "browser"), publicDir, { recursive: true });
writeFileSync(join(bundleDir, ".env"), "PUBLIC_DIR=./public\n");
writeFileSync(join(bundleDir, "package.json"), `${JSON.stringify({
  name: "snip-bundle",
  private: true,
  scripts: { start: "bun server.js" },
}, null, 2)}\n`);
writeFileSync(join(bundleDir, "Dockerfile"), `FROM oven/bun:1-alpine
COPY . .
ENV PORT=3000
EXPOSE 3000
CMD bun server.js
`);
writeFileSync(join(bundleDir, ".dockerignore"), `.git
.gitmodules
node_modules
`);
writeFileSync(join(bundleDir, "railway.json"), `${JSON.stringify({
  build: { builder: "DOCKERFILE" },
}, null, 2)}\n`);

commitIfChanged(
  bundleDir,
  "Generate release bundle",
  "bundle: nothing to commit",
);

run("git", ["add", "backend", "frontend", "cli", "bundle"]);
const superprojectChanged = hasStagedChanges(repoRoot);
if (superprojectChanged) {
  run("git", ["commit", "-m", "Update bundle submodule"]);
} else {
  console.log("main: nothing to commit");
}

if (shouldPush) {
  run("git", ["push", "origin", "HEAD:bundle"], bundleDir);
  run("git", ["push", "origin", "main"]);
}