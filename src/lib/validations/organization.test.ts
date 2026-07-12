import { describe, expect, it } from "vitest";
import { createOrganizationSchema, updateOrganizationSchema } from "./organization";

describe("organization validation", () => {
  it("accepts valid create input", () => {
    const parsed = createOrganizationSchema.safeParse({
      name: "Aegis Vanguard",
      tag: "AEGIS",
      description: "Security and logistics group",
      focusType: "SECURITY",
      visibility: "PUBLIC",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects lowercase tag on create", () => {
    const parsed = createOrganizationSchema.safeParse({
      name: "Aegis Vanguard",
      tag: "aegis",
    });

    expect(parsed.success).toBe(false);
  });

  it("allows partial updates", () => {
    const parsed = updateOrganizationSchema.safeParse({
      visibility: "PRIVATE",
    });

    expect(parsed.success).toBe(true);
  });
});
