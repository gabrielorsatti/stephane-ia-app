import { describe, expect, it } from "vitest";
import { levelFromXp, xpForLevel, xpProgress, MAX_LEVEL } from "./leveling";

describe("leveling", () => {
  it("level 1 at 0 XP", () => {
    expect(levelFromXp(0)).toBe(1);
  });

  it("level 2 at 100 XP", () => {
    expect(levelFromXp(100)).toBe(2);
  });

  it("level 3 at 400 XP", () => {
    expect(levelFromXp(400)).toBe(3);
  });

  it("caps at MAX_LEVEL", () => {
    expect(levelFromXp(999999)).toBe(MAX_LEVEL);
  });

  it("xpForLevel returns correct thresholds", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(100);
    expect(xpForLevel(3)).toBe(400);
    expect(xpForLevel(4)).toBe(900);
  });

  it("xpProgress returns correct progress", () => {
    const p = xpProgress(250);
    expect(p.level).toBe(2);
    expect(p.current).toBe(150);
    expect(p.needed).toBe(300);
    expect(p.percent).toBe(50);
  });

  it("xpProgress at max level returns 100%", () => {
    const p = xpProgress(xpForLevel(MAX_LEVEL) + 1000);
    expect(p.level).toBe(MAX_LEVEL);
    expect(p.percent).toBe(100);
  });
});
