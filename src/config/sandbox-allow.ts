import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getStateDir } from "./paths.js";

/**
 * Doubao Work does not use a Codex-style sandbox with writable_roots in
 * ~/.codex/config.toml. Commands run with the user's normal permissions,
 * so the state directory only needs to exist and be owner-writable — which
 * it is by default. This module keeps the same function names as the Codex
 * version so the CLI does not need branching; every call is a no-op success.
 */

export interface SandboxAllowResult {
  added: boolean;
  alreadyAllowed: boolean;
  stateDir: string;
  configPath: string;
}

export function getCodexHome(): string {
  // Kept for API compatibility. Doubao Work has no equivalent; return the
  // user's home directory so any path derived from it is harmless.
  return os.homedir();
}

export function getCodexConfigPath(): string {
  // No sandbox config file exists in Doubao Work. Return an empty string;
  // callers that check fs.existsSync("") will get false, which is fine
  // because isStateDirAllowlisted() always returns true.
  return "";
}

export function pathsEquivalent(a: string, b: string): boolean {
  return path.resolve(a) === path.resolve(b);
}

export function listWritableRoots(_content: string): string[] {
  return [];
}

export function isStateDirAllowlisted(_content: string, _stateDir: string): boolean {
  // Doubao Work has no sandbox allowlist — the state dir is always writable
  // with normal user permissions.
  return true;
}

/**
 * Idempotent no-op for Doubao Work: ensure the state directory exists with
 * owner-only permissions, then report already-allowed. Never fails unless
 * the home directory is not writable (a genuine system problem).
 */
export function ensureSandboxAllowlist(opts?: {
  configPath?: string;
  stateDir?: string;
}): SandboxAllowResult {
  const stateDir = path.resolve(opts?.stateDir ?? getStateDir());
  fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
  return { added: false, alreadyAllowed: true, stateDir, configPath: opts?.configPath ?? "" };
}

export function upsertWritableRoot(content: string, _stateDir: string): string {
  return content;
}
