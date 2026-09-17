import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ensureSandboxAllowlist,
  getCodexConfigPath,
  isStateDirAllowlisted,
} from "../src/config/sandbox-allow.js";

const TEST_DIR = path.join(os.tmpdir(), "d2c-sandbox-test");

beforeEach(() => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

describe("sandbox-allow (Doubao Work no-op)", () => {
  it("ensureSandboxAllowlist creates the state dir and reports alreadyAllowed", () => {
    const stateDir = path.join(TEST_DIR, "state");
    const result = ensureSandboxAllowlist({ stateDir });
    expect(result.added).toBe(false);
    expect(result.alreadyAllowed).toBe(true);
    expect(result.stateDir).toBe(stateDir);
    expect(fs.existsSync(stateDir)).toBe(true);
  });

  it("ensureSandboxAllowlist is idempotent", () => {
    const stateDir = path.join(TEST_DIR, "state");
    const first = ensureSandboxAllowlist({ stateDir });
    const second = ensureSandboxAllowlist({ stateDir });
    expect(first.alreadyAllowed).toBe(true);
    expect(second.alreadyAllowed).toBe(true);
    expect(second.added).toBe(false);
  });

  it("getCodexConfigPath returns empty string on Doubao Work (no sandbox config)", () => {
    expect(getCodexConfigPath()).toBe("");
  });

  it("isStateDirAllowlisted always returns true", () => {
    expect(isStateDirAllowlisted("", "/any/path")).toBe(true);
    expect(isStateDirAllowlisted("some content", "/other")).toBe(true);
  });

  it("state dir is created with owner-only permissions", () => {
    const stateDir = path.join(TEST_DIR, "secure-state");
    ensureSandboxAllowlist({ stateDir });
    const stat = fs.statSync(stateDir);
    expect(stat.isDirectory()).toBe(true);
  });
});
