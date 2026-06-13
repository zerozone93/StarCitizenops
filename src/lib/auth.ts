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

type DemoUser = {
  id: string;
  name: string;
  siteRole: "SITE_ADMIN" | "MEMBER";
  passwords: string[];
};

const DEMO_USERS: Record<string, DemoUser> = {
  "commander@starcitizenops.local": {
    id: "demo-commander",
    name: "Commander Demo",
    siteRole: "SITE_ADMIN",
    passwords: ["password123"],
  },
  "pilot@starcitizenops.local": {
    id: "demo-pilot",
    name: "Pilot Demo",
    siteRole: "MEMBER",
    passwords: ["password123"],
  },
  "medic@starcitizenops.local": {
    id: "demo-medic",
    name: "Medic Demo",
    siteRole: "MEMBER",
    passwords: ["password123"],
  },
  "guide.user@starcitizenops.local": {
    id: "demo-guide-user",
    name: "Guide User",
    siteRole: "MEMBER",
    passwords: ["GuidePass123!"],
  },
};

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

        const demoUser = DEMO_USERS[parsed.data.email];
        if (demoUser && demoUser.passwords.includes(parsed.data.password)) {
          return {
            id: demoUser.id,
            name: demoUser.name,
            email: parsed.data.email,
            image: null,
            siteRole: demoUser.siteRole,
            twoFactorPending: false,
            twoFactorMethod: null,
          };
        }

        let user: {
          id: string;
          name: string | null;
          email: string | null;
          image: string | null;
          siteRole: string;
          twoFactorEnabled: boolean;
          twoFactorMethod: string | null;
          passwordHash: string | null;
        } | null = null;

        try {
          user = await prisma.user.findFirst({
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
        } catch {
          return null;
        }

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
          email: user.email ?? parsed.data.email,
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
