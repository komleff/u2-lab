#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const manifestPath = "docs/verification/f2-governor-handoff/manifest.json";
const expectedArtifacts = new Map([
  ["source", [
    "src/model/governor-v03/governor.ts",
    "src/model/governor-v03/integrator.ts",
    "src/model/governor-v03/modes.ts",
    "src/model/governor-v03/protection.ts",
    "src/model/governor-v03/trace.ts",
  ]],
  ["schema", [
    "src/model/governor-v03/schema.ts",
    "src/model/governor-v03/tolerances.ts",
    "src/model/governor-v03/types.ts",
  ]],
  ["fixture", [
    "tests/fixtures/f2-governor/manifest.json",
    "tests/fixtures/f2-governor/vectors.json",
  ]],
  ["result", ["docs/verification/f2-governor-handoff/reference-results.json"]],
  ["trace", ["docs/verification/f2-governor-handoff/representative-traces.json"]],
  ["mapping", ["docs/verification/f2-governor-handoff/u2-shared-field-map.json"]],
  ["limits", ["docs/verification/f2-governor-handoff/known-limits.md"]],
]);

const sha256 = value => createHash("sha256").update(value).digest("hex");
const fail = message => {
  console.error(`F2 handoff verification failed: ${message}`);
  process.exitCode = 1;
};

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
if (manifest.version !== "f2-governor-handoff/1") fail("unknown manifest version");
if (manifest.runtimeAuthorization !== false) fail("runtimeAuthorization must be false");
if (!/^[0-9a-f]{40}$/.test(manifest.kernelCommit)) fail("invalid kernelCommit");
if (manifest.sourceBinding?.commit !== "40ddffb2832d4dcbe7b2b05501a74c98044386a8") fail("source binding commit drift");
if (manifest.sourceBinding?.sha256 !== "3ef04723155e9b9f8e285d3bb01228eccfb254623bb2dd51e2d7c6bcd0fc9034") fail("source binding bytes drift");

try {
  execFileSync("git", ["cat-file", "-e", `${manifest.kernelCommit}^{commit}`], { stdio: "ignore" });
} catch {
  fail("kernelCommit is not a local commit");
}

const actualKeys = manifest.artifacts.map(item => `${item.category}:${item.path}`).sort();
const expectedKeys = [...expectedArtifacts].flatMap(([category, paths]) => paths.map(path => `${category}:${path}`)).sort();
if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) fail("artifact set drift");

for (const artifact of manifest.artifacts) {
  const content = await readFile(artifact.path);
  if (sha256(content) !== artifact.sha256) fail(`hash drift: ${artifact.path}`);
  if (["source", "schema", "fixture"].includes(artifact.category)) {
    try {
      const frozen = execFileSync("git", ["show", `${manifest.kernelCommit}:${artifact.path}`]);
      if (sha256(frozen) !== artifact.sha256) fail(`kernelCommit binding drift: ${artifact.path}`);
    } catch {
      fail(`artifact absent from kernelCommit: ${artifact.path}`);
    }
  }
}

for (const path of [
  "docs/verification/f2-governor-handoff/reference-results.json",
  "docs/verification/f2-governor-handoff/representative-traces.json",
]) {
  const payload = JSON.parse(await readFile(path, "utf8"));
  if (payload.kernelCommit !== manifest.kernelCommit) fail(`kernelCommit mismatch: ${path}`);
}

if (!process.exitCode) console.log(`F2 handoff PASS: ${manifest.kernelCommit} (${manifest.artifacts.length} artifacts)`);
