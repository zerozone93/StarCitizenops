import { Prisma } from "@prisma/client";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { TWO_FACTOR_ENABLED } from "@/lib/feature-flags";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
});

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: {
            email: {
              equals: parsed.data.email,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            siteRole: true,
            twoFactorEnabled: true,
            twoFactorMethod: true,
            passwordHash: true,
          },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          siteRole: user.siteRole,
          twoFactorPending: TWO_FACTOR_ENABLED && user.twoFactorEnabled ? true : false,
          twoFactorMethod: TWO_FACTOR_ENABLED ? user.twoFactorMethod ?? null : null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.siteRole = (user as { siteRole?: string }).siteRole ?? "MEMBER";
        token.twoFactorPending = (user as { twoFactorPending?: boolean }).twoFactorPending ?? false;
        token.twoFactorMethod = (user as { twoFactorMethod?: string | null }).twoFactorMethod ?? null;
      }

      // Allow client-side session.update() to clear the pending flag
      if (trigger === "update" && session?.twoFactorPending === false) {
        token.twoFactorPending = false;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.siteRole = (token.siteRole as string) ?? "MEMBER";
        session.user.twoFactorPending = (token.twoFactorPending as boolean) ?? false;
        session.user.twoFactorMethod = (token.twoFactorMethod as string | null) ?? null;
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const registerSchema = z
  .object({
    name: z.string().min(2).max(64),
    email: z.string().email(),
    password: z.string().min(8).max(128),
    starCitizenHandle: z.string().min(2).max(64).optional().or(z.literal("")),
    timezone: z.string().max(64).optional(),
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

export type RegisterInput = z.infer<typeof registerSchema>;

export function isPrismaUniqueError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
