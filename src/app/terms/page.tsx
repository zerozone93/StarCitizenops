import Link from "next/link";

const termsSections = [
  {
    title: "1. Acceptance of Terms",
    body: "By creating an account or using StarCitizenOps, you agree to these Terms and Conditions and our applicable policies.",
  },
  {
    title: "2. Eligibility and Accounts",
    body: "You must provide accurate account information and keep your login credentials secure. You are responsible for activity on your account.",
  },
  {
    title: "3. Acceptable Use",
    body: "You agree not to abuse the platform, interfere with service operation, attempt unauthorized access, or post unlawful, harmful, or infringing content.",
  },
  {
    title: "4. User Content",
    body: "You retain ownership of content you submit, but grant StarCitizenOps a non-exclusive license to host, process, and display that content to operate the service.",
  },
  {
    title: "5. Community and Organization Features",
    body: "Organization owners and moderators are responsible for their group governance. StarCitizenOps may remove content or suspend accounts that violate platform rules.",
  },
  {
    title: "6. Service Availability",
    body: "The service is provided on an as-is and as-available basis. We may change, suspend, or discontinue features at any time.",
  },
  {
    title: "7. Limitation of Liability",
    body: "To the maximum extent permitted by law, StarCitizenOps is not liable for indirect, incidental, or consequential damages arising from use of the service.",
  },
  {
    title: "8. Termination",
    body: "We may suspend or terminate access for violations of these terms, abuse, security risks, or legal requirements.",
  },
  {
    title: "9. Changes to Terms",
    body: "We may update these terms periodically. Continued use after updates constitutes acceptance of the revised terms.",
  },
  {
    title: "10. Contact",
    body: "For legal or policy questions, contact the site administrators through the platform support channels.",
  },
] as const;

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-2xl border border-cyan-500/25 bg-slate-950/70 p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">StarCitizenOps Legal</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-50">Terms and Conditions</h1>
        <p className="mt-3 text-sm text-slate-300">
          Effective date: June 7, 2026. These terms govern access to and use of StarCitizenOps.
        </p>
      </div>

      <section className="space-y-4">
        {termsSections.map((section) => (
          <article key={section.title} className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-5">
            <h2 className="text-lg font-semibold text-slate-100">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{section.body}</p>
          </article>
        ))}
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href="/register"
          className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20"
        >
          Back to Sign Up
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
        >
          Go to Login
        </Link>
      </div>
    </main>
  );
}
