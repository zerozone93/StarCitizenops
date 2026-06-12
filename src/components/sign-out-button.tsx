"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await signOut({ redirect: false });
        router.push("/login");
        router.refresh();
      }}
      className={className}
    >
      Sign out
    </button>
  );
}
