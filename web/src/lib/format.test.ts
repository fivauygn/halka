import { describe, expect, it } from "vitest";

import { formatTokenAmount, parseTokenAmount, truncateAddress } from "./format";

describe("formatTokenAmount", () => {
  it("formats whole amounts without a decimal part", () => {
    expect(formatTokenAmount(100_000_000n)).toBe("10");
  });

  it("keeps significant decimals and trims trailing zeros", () => {
    expect(formatTokenAmount(12_500_000n)).toBe("1.25");
    expect(formatTokenAmount(1n)).toBe("0.0000001");
  });

  it("formats negative amounts", () => {
    expect(formatTokenAmount(-5_000_000n)).toBe("-0.5");
  });
});

describe("parseTokenAmount", () => {
  it("parses whole and fractional amounts into stroops", () => {
    expect(parseTokenAmount("10")).toBe(100_000_000n);
    expect(parseTokenAmount("1.25")).toBe(12_500_000n);
    expect(parseTokenAmount(".5")).toBe(5_000_000n);
    expect(parseTokenAmount(" 2 ")).toBe(20_000_000n);
  });

  it("truncates digits beyond the token's decimals", () => {
    expect(parseTokenAmount("0.123456789")).toBe(1_234_567n);
  });

  it("rejects empty, malformed and non-positive input", () => {
    expect(() => parseTokenAmount("")).toThrow("Amount cannot be empty.");
    expect(() => parseTokenAmount("abc")).toThrow("Invalid amount.");
    expect(() => parseTokenAmount("1.2.3")).toThrow("Invalid amount.");
    expect(() => parseTokenAmount("-1")).toThrow("Invalid amount.");
    expect(() => parseTokenAmount("0")).toThrow("Amount must be greater than zero.");
  });

  it("round-trips with formatTokenAmount", () => {
    for (const value of ["1", "0.5", "123.4567891"]) {
      expect(formatTokenAmount(parseTokenAmount(value))).toBe(value);
    }
  });
});

describe("truncateAddress", () => {
  it("keeps the first and last four characters", () => {
    expect(truncateAddress("GAMYNYJR2UILL4GXGNPUSFQBMKDBXV2EVLHOIYFH34FTORBY7ULTJHIU")).toBe("GAMY…JHIU");
  });

  it("leaves short strings unchanged", () => {
    expect(truncateAddress("GABC")).toBe("GABC");
  });
});
