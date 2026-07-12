import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2).max(64),
    email: z.string().email(),
    password: z.string().min(8).max(128),
    starCitizenHandle: z.string().min(2).max(64).optional().or(z.literal("")),
    organizationIntent: z.enum(["create", "join"]),
    organizationName: z.string().min(2).max(128).optional(),
    organizationTag: z
      .string()
      .min(2)
      .max(16)
      .regex(/^[A-Z0-9_-]+$/)
      .optional(),
    organizationDescription: z.string().max(2000).optional(),
    joinOrganizationId: z.string().cuid().optional(),
    joinRequestMessage: z.string().max(1000).optional(),
    acceptedTerms: z.boolean().refine((value) => value, {
      message: "You must accept the Terms and Conditions to create an account",
    }),
  })
  .superRefine((data, ctx) => {
    if (data.organizationIntent === "create") {
      if (!data.organizationName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["organizationName"],
          message: "Organization name is required",
        });
      }
      if (!data.organizationTag?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["organizationTag"],
          message: "Organization tag is required",
        });
      }
    }

    if (data.organizationIntent === "join" && !data.joinOrganizationId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["joinOrganizationId"],
        message: "Select an organization to join",
      });
    }
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
