#!/usr/bin/env node

const { spawn } = require("node:child_process");

const baseUrl = (process.env.SNIP_API || "http://localhost:3000").replace(/\/+$/, "");

function usage() {
  console.log(`Usage:
  snip add <url>    Create a short link
  snip ls           List links
  snip open <code>  Open a short link in your browser`);
}

async function readResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestJson(path, options) {
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, options);
  } catch (error) {
    throw new Error(`Could not reach ${baseUrl}: ${error.message}`);
  }

  const body = await readResponse(response);
  if (!response.ok) {
    throw new Error(body?.error || `Request failed with status ${response.status}`);
  }
  return body;
}

function requireHttpUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("URL must use http or https");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("URL must use http or https");
  }
  return url.href;
}

async function addLink(args) {
  if (args.length !== 1) throw new Error("Usage: snip add <url>");

  const link = await requestJson("/api/links", {
    body: JSON.stringify({ url: requireHttpUrl(args[0]) }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!link?.shortUrl) throw new Error("Backend returned no shortUrl");
  console.log(link.shortUrl);
}

async function listLinks(args) {
  if (args.length) throw new Error("Usage: snip ls");

  const links = await requestJson("/api/links");
  if (!Array.isArray(links) || links.length === 0) {
    console.log("No links yet.");
    return;
  }

  const rows = links.map((link) => [link.code, String(link.hits), link.url]);
  const widths = rows[0].map((_, index) => Math.max(
    ["code", "hits", "url"][index].length,
    ...rows.map((row) => row[index].length),
  ));
  const formatRow = (row) => row.map((value, index) => value.padEnd(widths[index])).join("  ");

  console.log(formatRow(["code", "hits", "url"]));
  console.log(formatRow(rows[0].map((_, index) => "-".repeat(widths[index]))));
  rows.forEach((row) => console.log(formatRow(row)));
}

function browserCommand(target) {
  if (process.platform === "win32") return ["cmd", ["/c", "start", "", target]];
  if (process.platform === "darwin") return ["open", [target]];
  return ["xdg-open", [target]];
}

function openInBrowser(target) {
  const [command, args] = browserCommand(target);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { detached: true, stdio: "ignore" });
    child.once("error", reject);
    child.once("spawn", () => {
      child.unref();
      resolve();
    });
  });
}

async function openLink(args) {
  if (args.length !== 1) throw new Error("Usage: snip open <code>");

  let response;
  try {
    response = await fetch(`${baseUrl}/${encodeURIComponent(args[0])}`, { redirect: "manual" });
  } catch (error) {
    throw new Error(`Could not reach ${baseUrl}: ${error.message}`);
  }

  const target = response.headers.get("location");
  if (!target || response.status < 300 || response.status >= 400) {
    const body = await readResponse(response);
    throw new Error(body?.error || `No link found for code ${args[0]}`);
  }
  await openInBrowser(target);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === "help" || command === "--help" || command === "-h") {
    usage();
    return;
  }

  if (command === "add") return addLink(args);
  if (command === "ls") return listLinks(args);
  if (command === "open") return openLink(args);
  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});