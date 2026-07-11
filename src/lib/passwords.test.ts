import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./passwords";

describe("password hashing", () => {
  it("verifies the correct password and rejects the wrong one", () => {
    const hash = hashPassword("correct horse battery");
    expect(hash.startsWith("scrypt:")).toBe(true);
    expect(verifyPassword("correct horse battery", hash)).toBe(true);
    expect(verifyPassword("wrong", hash)).toBe(false);
  });

  it("salts hashes (same password ⇒ different hash) and rejects null/garbage", () => {
    expect(hashPassword("x")).not.toBe(hashPassword("x"));
    expect(verifyPassword("anything", null)).toBe(false);
    expect(verifyPassword("anything", "not-a-hash")).toBe(false);
  });
});
