"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type HandleStatus = "idle" | "checking" | "valid" | "invalid" | "unavailable";
type OrganizationIntent = "create" | "join";

type OrganizationOption = {
  id: string;
  name: string;
  tag: string;
  visibility: "PUBLIC" | "PRIVATE";
  memberCount: number;
};

type ValidationErrorDetails = {
  formErrors?: string[];
  fieldErrors?: Record<string, string[] | undefined>;
};

function getRegistrationErrorMessage(data: {
  error?: string | ValidationErrorDetails;
  details?: ValidationErrorDetails;
} | null) {
  if (!data) {
    return "Registration failed. Check your details and try again.";
  }

  const validationDetails =
    typeof data.error === "object" && data.error !== null ? data.error : data.details;

  const formMessage = validationDetails?.formErrors?.find(Boolean);
  if (formMessage) {
    return formMessage;
  }

  const fieldMessage = Object.values(validationDetails?.fieldErrors ?? {}).flat().find(Boolean);
  if (fieldMessage) {
    return fieldMessage;
  }

  if (typeof data.error === "string" && data.error.trim()) {
    return data.error;
  }

  return "Registration failed. Check your details and try again.";
}

function getRegistrationFieldErrors(data: {
  error?: string | ValidationErrorDetails;
  details?: ValidationErrorDetails;
} | null): Record<string, string> {
  const validationDetails =
    data && typeof data.error === "object" && data.error !== null ? data.error : data?.details;

  const fieldEntries = Object.entries(validationDetails?.fieldErrors ?? {}).flatMap(
    ([key, messages]) => {
      const message = messages?.find(Boolean);
      return message ? [[key, message] as const] : [];
    }
  );

  return Object.fromEntries(fieldEntries);
}

function getBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    return "";
  }
}

function getSupportedTimezones() {
  try {
    return typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  } catch {
    return [];
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [handleStatus, setHandleStatus] = useState<HandleStatus>("idle");
  const [handleVerified, setHandleVerified] = useState<string>("");
  const [organizationIntent, setOrganizationIntent] = useState<OrganizationIntent>("join");
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [orgLoading, setOrgLoading] = useState(true);
  const [timezone, setTimezone] = useState<string>(() => getBrowserTimezone());
  const [allTimezones] = useState<string[]>(() => getSupportedTimezones());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function loadOrganizations() {
      try {
        const res = await fetch("/api/organizations/list");
        if (res.ok) {
          const data = (await res.json()) as OrganizationOption[];
          setOrganizations(data);
          if (data.length === 0) {
            setOrganizationIntent("create");
          }
        }
      } finally {
        setOrgLoading(false);
      }
    }
    loadOrganizations();
  }, []);

  async function validateHandle(value: string) {
    if (!value.trim()) {
      setHandleStatus("idle");
      setHandleVerified("");
      return;
    }

    setHandleStatus("checking");
    try {
      const res = await fetch(`/api/sc-validate-handle?handle=${encodeURIComponent(value.trim())}`);
      const data = await res.json();
      if (data.valid) {
        setHandleStatus("valid");
        setHandleVerified(data.profile?.moniker ?? value.trim());
      } else if (data.error === "RSI lookup unavailable") {
        setHandleStatus("unavailable");
        setHandleVerified("");
      } else {
        setHandleStatus("invalid");
        setHandleVerified("");
      }
    } catch {
      setHandleStatus("unavailable");
    }
  }

  function onHandleChange(value: string) {
    setFieldErrors((prev) => {
      if (!prev.starCitizenHandle) return prev;
      const next = { ...prev };
      delete next.starCitizenHandle;
      return next;
    });
    setHandleStatus("idle");
    setHandleVerified("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => validateHandle(value), 600);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    if (handleStatus === "invalid") {
      setFieldErrors({
        starCitizenHandle: "Please enter a valid Star Citizen handle, or leave it blank to skip.",
      });
      return;
    }

    const form = new FormData(event.currentTarget);
    const optionalValue = (key: string) => {
      const value = String(form.get(key) || "").trim();
      return value.length > 0 ? value : undefined;
    };

    if (organizationIntent === "join" && !String(form.get("joinOrganizationId") || "").trim()) {
      setFieldErrors({ joinOrganizationId: "Choose an organization to join." });
      return;
    }

    if (organizationIntent === "create") {
      const organizationName = String(form.get("organizationName") || "").trim();
      const organizationTag = String(form.get("organizationTag") || "").trim().toUpperCase();
      if (!organizationName || !organizationTag) {
        setFieldErrors({
          ...(organizationName ? {} : { organizationName: "Organization name is required." }),
          ...(organizationTag ? {} : { organizationTag: "Organization tag is required." }),
        });
        return;
      }
    }

    setLoading(true);

    const payload = {
      name: String(form.get("name") || "").trim(),
      email: String(form.get("email") || "").trim(),
      password: String(form.get("password") || ""),
      starCitizenHandle: optionalValue("starCitizenHandle"),
      timezone: timezone || undefined,
      organizationIntent,
      organizationName:
        organizationIntent === "create" ? optionalValue("organizationName") : undefined,
      organizationTag:
        organizationIntent === "create"
          ? optionalValue("organizationTag")?.toUpperCase()
          : undefined,
      organizationDescription:
        organizationIntent === "create" ? optionalValue("organizationDescription") : undefined,
      joinOrganizationId:
        organizationIntent === "join" ? optionalValue("joinOrganizationId") : undefined,
      joinRequestMessage:
        organizationIntent === "join" ? optionalValue("joinRequestMessage") : undefined,
      acceptedTerms: String(form.get("acceptedTerms") || "") === "on",
    };

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: string | ValidationErrorDetails;
        details?: ValidationErrorDetails;
      } | null;
      const nextFieldErrors = getRegistrationFieldErrors(data);
      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors);
      } else {
        setFieldErrors({ _form: getRegistrationErrorMessage(data) });
      }
      setLoading(false);
      return;
    }

    await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });

    router.push("/dashboard");
    router.refresh();
  }

  const handleBorderClass =
    handleStatus === "valid"
      ? "border-green-400/50 focus:border-green-400/70"
      : handleStatus === "invalid"
      ? "border-rose-400/50 focus:border-rose-400/70"
      : "border-cyan-300/25 focus:border-cyan-300/45";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(1000px_520px_at_105%_-10%,rgba(249,115,22,0.22),transparent_58%),radial-gradient(760px_460px_at_-8%_12%,rgba(34,211,238,0.16),transparent_64%),linear-gradient(150deg,#090f15_0%,#06080e_45%,#120d08_100%)]"
      />

      <form
        onSubmit={onSubmit}
        className="w-full max-w-xl space-y-5 rounded-3xl border border-orange-300/25 bg-slate-950/70 p-7 shadow-[0_30px_70px_-35px_rgba(0,0,0,0.85)] backdrop-blur-md"
      >
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-orange-100/85">StarCitizenOps</p>
          <h1 className="text-3xl font-semibold text-orange-50">Create Command Profile</h1>
          <p className="text-sm text-slate-300">Create your account and either launch an organization or join one already registered on the platform.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <input
              className="w-full rounded-xl border border-cyan-300/25 bg-slate-900/75 px-3 py-2.5 text-slate-100 placeholder:text-slate-400 focus:border-cyan-300/45 focus:outline-none"
              name="name"
              required
              placeholder="Display name"
              onChange={() =>
                setFieldErrors((prev) => {
                  if (!prev.name) return prev;
                  const next = { ...prev };
                  delete next.name;
                  return next;
                })
              }
            />
            {fieldErrors.name ? <p className="pl-1 text-xs text-rose-300">{fieldErrors.name}</p> : null}
          </div>
          <div className="space-y-1">
            <input
              className="w-full rounded-xl border border-cyan-300/25 bg-slate-900/75 px-3 py-2.5 text-slate-100 placeholder:text-slate-400 focus:border-cyan-300/45 focus:outline-none"
              name="email"
              type="email"
              required
              placeholder="Email"
              onChange={() =>
                setFieldErrors((prev) => {
                  if (!prev.email) return prev;
                  const next = { ...prev };
                  delete next.email;
                  return next;
                })
              }
            />
            {fieldErrors.email ? <p className="pl-1 text-xs text-rose-300">{fieldErrors.email}</p> : null}
          </div>
        </div>

        <div className="space-y-1">
          <div className="relative">
            <input
              className={`w-full rounded-xl border bg-slate-900/75 px-3 py-2.5 pr-10 text-slate-100 placeholder:text-slate-400 focus:outline-none ${handleBorderClass}`}
              name="starCitizenHandle"
              placeholder="Star Citizen handle (RSI username)"
              onChange={(e) => onHandleChange(e.target.value)}
              autoComplete="off"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-base">
              {handleStatus === "checking" && (
                <svg className="h-4 w-4 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              )}
              {handleStatus === "valid" && <span className="text-green-400">✓</span>}
              {handleStatus === "invalid" && <span className="text-rose-400">✗</span>}
              {handleStatus === "unavailable" && <span className="text-slate-400">?</span>}
            </span>
          </div>
          {handleStatus === "valid" && <p className="pl-1 text-xs text-green-400">RSI citizen verified: {handleVerified}</p>}
          {handleStatus === "invalid" && <p className="pl-1 text-xs text-rose-400">Handle not found in RSI records. Check your spelling.</p>}
          {handleStatus === "unavailable" && <p className="pl-1 text-xs text-slate-400">RSI lookup unavailable. You can still continue.</p>}
          {handleStatus === "idle" && <p className="pl-1 text-xs text-slate-500">Optional: your RSI citizen handle from robertsspaceindustries.com</p>}
        </div>

        <input
          className="w-full rounded-xl border border-cyan-300/25 bg-slate-900/75 px-3 py-2.5 text-slate-100 placeholder:text-slate-400 focus:border-cyan-300/45 focus:outline-none"
          name="password"
          type="password"
          required
          placeholder="Password (8+ chars)"
          onChange={() =>
            setFieldErrors((prev) => {
              if (!prev.password) return prev;
              const next = { ...prev };
              delete next.password;
              return next;
            })
          }
        />
        {fieldErrors.password ? <p className="pl-1 text-xs text-rose-300">{fieldErrors.password}</p> : null}

        <div className="space-y-1">
          <label className="block text-xs text-slate-400 pl-1">Your timezone</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-xl border border-cyan-300/25 bg-slate-900/75 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-300/45 focus:outline-none"
          >
            {timezone && !allTimezones.includes(timezone) && (
              <option value={timezone}>{timezone}</option>
            )}
            {allTimezones.length === 0 && <option value="">Loading timezones...</option>}
            {allTimezones.map((tz) => (
              <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
            ))}
          </select>
          <p className="pl-1 text-xs text-slate-500">Auto-detected from your browser. Operations will show in this timezone.</p>
        </div>

        <section className="space-y-3 rounded-xl border border-cyan-300/20 bg-slate-900/40 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/85">Organization setup</p>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${organizationIntent === "join" ? "border-cyan-300/50 bg-cyan-400/10 text-cyan-100" : "border-slate-700 bg-slate-900/60 text-slate-300"}`}>
              <input
                type="radio"
                name="organizationIntent"
                className="sr-only"
                value="join"
                checked={organizationIntent === "join"}
                onChange={() => setOrganizationIntent("join")}
                disabled={orgLoading || organizations.length === 0}
              />
              Join an organization
            </label>
            <label className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${organizationIntent === "create" ? "border-orange-300/50 bg-orange-400/10 text-orange-100" : "border-slate-700 bg-slate-900/60 text-slate-300"}`}>
              <input
                type="radio"
                name="organizationIntent"
                className="sr-only"
                value="create"
                checked={organizationIntent === "create"}
                onChange={() => setOrganizationIntent("create")}
              />
              Create a new organization
            </label>
          </div>

          {organizationIntent === "join" ? (
            <div className="space-y-2">
              <select
                name="joinOrganizationId"
                required
                disabled={orgLoading || organizations.length === 0}
                className="w-full rounded-xl border border-cyan-300/25 bg-slate-900/75 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-300/45 focus:outline-none disabled:opacity-50"
                onChange={() =>
                  setFieldErrors((prev) => {
                    if (!prev.joinOrganizationId) return prev;
                    const next = { ...prev };
                    delete next.joinOrganizationId;
                    return next;
                  })
                }
              >
                <option value="">{orgLoading ? "Loading organizations..." : organizations.length ? "Select organization" : "No organizations found"}</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} [{org.tag}] • {org.memberCount} members
                  </option>
                ))}
              </select>
              {fieldErrors.joinOrganizationId ? (
                <p className="pl-1 text-xs text-rose-300">{fieldErrors.joinOrganizationId}</p>
              ) : null}
              <textarea
                name="joinRequestMessage"
                placeholder="Optional: tell leadership why you want to join"
                className="min-h-20 w-full rounded-xl border border-cyan-300/25 bg-slate-900/75 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:border-cyan-300/45 focus:outline-none"
                onChange={() =>
                  setFieldErrors((prev) => {
                    if (!prev.joinRequestMessage) return prev;
                    const next = { ...prev };
                    delete next.joinRequestMessage;
                    return next;
                  })
                }
              />
              {fieldErrors.joinRequestMessage ? (
                <p className="pl-1 text-xs text-rose-300">{fieldErrors.joinRequestMessage}</p>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <input
                  name="organizationName"
                  required
                  placeholder="Organization name"
                  className="w-full rounded-xl border border-orange-300/25 bg-slate-900/75 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:border-orange-300/45 focus:outline-none"
                  onChange={() =>
                    setFieldErrors((prev) => {
                      if (!prev.organizationName) return prev;
                      const next = { ...prev };
                      delete next.organizationName;
                      return next;
                    })
                  }
                />
                {fieldErrors.organizationName ? (
                  <p className="pl-1 text-xs text-rose-300">{fieldErrors.organizationName}</p>
                ) : null}
              </div>
              <div className="space-y-1">
                <input
                  name="organizationTag"
                  required
                  placeholder="Tag (e.g. AEGV)"
                  className="w-full rounded-xl border border-orange-300/25 bg-slate-900/75 px-3 py-2.5 text-sm uppercase text-slate-100 placeholder:text-slate-400 focus:border-orange-300/45 focus:outline-none"
                  onChange={() =>
                    setFieldErrors((prev) => {
                      if (!prev.organizationTag) return prev;
                      const next = { ...prev };
                      delete next.organizationTag;
                      return next;
                    })
                  }
                />
                {fieldErrors.organizationTag ? (
                  <p className="pl-1 text-xs text-rose-300">{fieldErrors.organizationTag}</p>
                ) : null}
              </div>
              <textarea
                name="organizationDescription"
                placeholder="Optional: short organization description"
                className="min-h-20 rounded-xl border border-orange-300/25 bg-slate-900/75 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:border-orange-300/45 focus:outline-none sm:col-span-2"
                onChange={() =>
                  setFieldErrors((prev) => {
                    if (!prev.organizationDescription) return prev;
                    const next = { ...prev };
                    delete next.organizationDescription;
                    return next;
                  })
                }
              />
              {fieldErrors.organizationDescription ? (
                <p className="pl-1 text-xs text-rose-300 sm:col-span-2">{fieldErrors.organizationDescription}</p>
              ) : null}
            </div>
          )}
        </section>

        <div className="space-y-1 rounded-xl border border-slate-700/70 bg-slate-900/55 p-3">
          <label className="flex items-start gap-3 text-sm text-slate-200">
            <input
              type="checkbox"
              name="acceptedTerms"
              required
              className="mt-0.5 h-4 w-4 rounded border-slate-500 bg-slate-900"
              onChange={() =>
                setFieldErrors((prev) => {
                  if (!prev.acceptedTerms) return prev;
                  const next = { ...prev };
                  delete next.acceptedTerms;
                  return next;
                })
              }
            />
            <span>
              I have read and agree to the{" "}
              <Link href="/terms" className="font-semibold text-cyan-200 hover:text-cyan-100">
                Terms and Conditions
              </Link>
              .
            </span>
          </label>
          {fieldErrors.acceptedTerms ? (
            <p className="pl-1 text-xs text-rose-300">{fieldErrors.acceptedTerms}</p>
          ) : null}
        </div>

        {fieldErrors._form ? <p className="text-sm text-rose-300">{fieldErrors._form}</p> : null}

        <button
          disabled={
            loading ||
            handleStatus === "invalid" ||
            (organizationIntent === "join" && !orgLoading && organizations.length === 0)
          }
          className="w-full rounded-xl border border-orange-200/40 bg-orange-400/85 px-3 py-2.5 font-semibold text-slate-950 transition hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
        >
          {loading ? "Creating..." : "Create Profile"}
        </button>

        <p className="text-sm text-slate-300">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-cyan-200 hover:text-cyan-100">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
