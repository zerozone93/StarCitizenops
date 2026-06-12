import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      siteRole: string;
      twoFactorPending?: boolean;
      twoFactorMethod?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    siteRole?: string;
    twoFactorPending?: boolean;
    twoFactorMethod?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    siteRole?: string;
    twoFactorPending?: boolean;
    twoFactorMethod?: string | null;
  }
}
