import { describe, expect, it } from "vitest";
import { updateProfileSchema } from "./profile";

describe("updateProfileSchema", () => {
  it("accepts a valid partial profile update", () => {
    const parsed = updateProfileSchema.safeParse({
      name: "Commander Zee",
      timezone: "UTC",
      preferredRoles: ["Commander", "Pilot"],
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects too-short names", () => {
    const parsed = updateProfileSchema.safeParse({
      name: "A",
    });

    expect(parsed.success).toBe(false);
  });
});
