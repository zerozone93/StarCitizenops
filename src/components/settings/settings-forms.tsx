"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { OrganizationFocusType, OrganizationVisibility } from "@prisma/client";
import { preferredRoleOptions } from "@/lib/constants";
import {
  initialSettingsActionState,
  loggedInResetPasswordAction,
  updateOrganizationPreferencesAction,
  updatePasswordAction,
  updateProfileSettingsAction,
} from "@/app/settings/actions";

type SettingsFormsProps = {
  profile: {
    name: string | null;
    starCitizenHandle: string | null;
    bio: string | null;
    timezone: string | null;
    availability: string | null;
    preferredRoles: string[];
  };
  ownedOrganizations: Array<{
    id: string;
    name: string;
    tag: string;
    focusType: OrganizationFocusType;
    visibility: OrganizationVisibility;
    description: string | null;
  }>;
};

function SubmitButton({
  label,
  pendingLabel,
  className,
}: {
  label: string;
  pendingLabel: string;
  className: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  );
}

function FormStatus({
  message,
  error,
}: {
  message?: string;
  error?: string;
}) {
  if (error) {
    return (
      <p className="rounded-md border border-rose-500/30 bg-rose-900/20 p-2 text-xs text-rose-200">
        {error}
      </p>
    );
  }

  if (message) {
    return (
      <p className="rounded-md border border-emerald-500/30 bg-emerald-900/20 p-2 text-xs text-emerald-200">
        {message}
      </p>
    );
  }

  return null;
}

export function SettingsForms({ profile, ownedOrganizations }: SettingsFormsProps) {
  const [profileState, profileAction] = useActionState(
    updateProfileSettingsAction,
    initialSettingsActionState
  );

  const [passwordState, passwordAction] = useActionState(
    updatePasswordAction,
    initialSettingsActionState
  );

  const [passwordResetState, passwordResetAction] = useActionState(
    loggedInResetPasswordAction,
    initialSettingsActionState
  );

  const [organizationState, organizationAction] = useActionState(
    updateOrganizationPreferencesAction,
    initialSettingsActionState
  );

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
        <h3 className="text-lg font-semibold text-cyan-100">Profile Preferences</h3>
        <p className="mt-1 text-xs text-slate-400">
          Manage your operator identity and mission-role preferences.
        </p>

        <form action={profileAction} className="mt-4 space-y-3">
          <FormStatus message={profileState.message} error={profileState.formError} />

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <input
                required
                name="name"
                defaultValue={profile.name || ""}
                className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                placeholder="Display name"
              />
              {profileState.fieldErrors?.name ? (
                <p className="mt-1 text-xs text-rose-300">{profileState.fieldErrors.name}</p>
              ) : null}
            </div>

            <div>
              <input
                name="starCitizenHandle"
                defaultValue={profile.starCitizenHandle || ""}
                className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                placeholder="Star Citizen handle"
              />
              {profileState.fieldErrors?.starCitizenHandle ? (
                <p className="mt-1 text-xs text-rose-300">
                  {profileState.fieldErrors.starCitizenHandle}
                </p>
              ) : null}
            </div>

            <div>
              <input
                name="timezone"
                defaultValue={profile.timezone || ""}
                className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                placeholder="Timezone"
              />
              {profileState.fieldErrors?.timezone ? (
                <p className="mt-1 text-xs text-rose-300">{profileState.fieldErrors.timezone}</p>
              ) : null}
            </div>

            <div>
              <input
                name="availability"
                defaultValue={profile.availability || ""}
                className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                placeholder="Availability"
              />
              {profileState.fieldErrors?.availability ? (
                <p className="mt-1 text-xs text-rose-300">{profileState.fieldErrors.availability}</p>
              ) : null}
            </div>

            <div className="md:col-span-2">
              <textarea
                name="bio"
                defaultValue={profile.bio || ""}
                rows={3}
                className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                placeholder="Bio"
              />
              {profileState.fieldErrors?.bio ? (
                <p className="mt-1 text-xs text-rose-300">{profileState.fieldErrors.bio}</p>
              ) : null}
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm text-slate-300">Preferred roles</legend>
            <div className="grid gap-2 md:grid-cols-3">
              {preferredRoleOptions.map((role) => (
                <label
                  key={role}
                  className="flex items-center gap-2 rounded border border-cyan-500/20 p-2 text-sm text-slate-200"
                >
                  <input
                    type="checkbox"
                    name="preferredRoles"
                    value={role}
                    defaultChecked={profile.preferredRoles.includes(role)}
                  />
                  {role}
                </label>
              ))}
            </div>
          </fieldset>

          <SubmitButton
            label="Save Profile Preferences"
            pendingLabel="Saving Profile Preferences..."
            className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
          />
        </form>
      </section>

      <section className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
        <h3 className="text-lg font-semibold text-cyan-100">Security</h3>
        <p className="mt-1 text-xs text-slate-400">
          Change your login password for credential authentication.
        </p>

        <form action={passwordAction} className="mt-4 grid gap-3 md:grid-cols-3">
          <div>
            <input
              required
              type="password"
              name="currentPassword"
              minLength={8}
              className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
              placeholder="Current password"
            />
            {passwordState.fieldErrors?.currentPassword ? (
              <p className="mt-1 text-xs text-rose-300">{passwordState.fieldErrors.currentPassword}</p>
            ) : null}
          </div>

          <div>
            <input
              required
              type="password"
              name="newPassword"
              minLength={8}
              className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
              placeholder="New password"
            />
            {passwordState.fieldErrors?.newPassword ? (
              <p className="mt-1 text-xs text-rose-300">{passwordState.fieldErrors.newPassword}</p>
            ) : null}
          </div>

          <div>
            <input
              required
              type="password"
              name="confirmPassword"
              minLength={8}
              className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
              placeholder="Confirm new password"
            />
            {passwordState.fieldErrors?.confirmPassword ? (
              <p className="mt-1 text-xs text-rose-300">{passwordState.fieldErrors.confirmPassword}</p>
            ) : null}
          </div>

          <div className="md:col-span-3 space-y-2">
            <FormStatus message={passwordState.message} error={passwordState.formError} />
            <SubmitButton
              label="Update Password"
              pendingLabel="Updating Password..."
              className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
            />
          </div>
        </form>

        <div className="mt-6 border-t border-cyan-500/20 pt-4">
          <h4 className="text-sm font-semibold text-cyan-100">Password Reset (Logged In)</h4>
          <p className="mt-1 text-xs text-slate-400">
            If you are already signed in but do not remember your current password, you can set a new one here.
          </p>

          <form action={passwordResetAction} className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <input
                required
                type="password"
                name="newPassword"
                minLength={8}
                className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                placeholder="New password"
              />
              {passwordResetState.fieldErrors?.newPassword ? (
                <p className="mt-1 text-xs text-rose-300">{passwordResetState.fieldErrors.newPassword}</p>
              ) : null}
            </div>

            <div>
              <input
                required
                type="password"
                name="confirmPassword"
                minLength={8}
                className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                placeholder="Confirm new password"
              />
              {passwordResetState.fieldErrors?.confirmPassword ? (
                <p className="mt-1 text-xs text-rose-300">{passwordResetState.fieldErrors.confirmPassword}</p>
              ) : null}
            </div>

            <div className="md:col-span-2 space-y-2">
              <FormStatus message={passwordResetState.message} error={passwordResetState.formError} />
              <SubmitButton
                label="Reset Password"
                pendingLabel="Resetting Password..."
                className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
              />
            </div>
          </form>
        </div>
      </section>

      <section className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
        <h3 className="text-lg font-semibold text-cyan-100">Organization Preferences</h3>
        <p className="mt-1 text-xs text-slate-400">Owner-level settings for your organizations.</p>

        {ownedOrganizations.length === 0 ? (
          <div className="mt-3 rounded-md border border-cyan-500/20 bg-slate-950/40 p-3 text-sm text-slate-300">
            <p>You do not own any organizations yet.</p>
            <Link href="/organizations/new" className="mt-2 inline-block text-cyan-200 underline">
              Create an organization
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {ownedOrganizations.map((organization) => (
              <form
                key={organization.id}
                action={organizationAction}
                className="space-y-3 rounded-lg border border-cyan-500/20 bg-slate-950/40 p-3"
              >
                <input type="hidden" name="organizationId" value={organization.id} />
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold text-cyan-100">{organization.name}</h4>
                  <span className="rounded bg-cyan-500/20 px-2 py-1 text-xs text-cyan-200">
                    {organization.tag}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <select
                      name="focusType"
                      defaultValue={organization.focusType}
                      className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                    >
                      {Object.values(OrganizationFocusType).map((focusType) => (
                        <option key={focusType} value={focusType}>
                          {focusType}
                        </option>
                      ))}
                    </select>
                    {organizationState.fieldErrors?.focusType ? (
                      <p className="mt-1 text-xs text-rose-300">{organizationState.fieldErrors.focusType}</p>
                    ) : null}
                  </div>

                  <div>
                    <select
                      name="visibility"
                      defaultValue={organization.visibility}
                      className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                    >
                      {Object.values(OrganizationVisibility).map((visibility) => (
                        <option key={visibility} value={visibility}>
                          {visibility}
                        </option>
                      ))}
                    </select>
                    {organizationState.fieldErrors?.visibility ? (
                      <p className="mt-1 text-xs text-rose-300">{organizationState.fieldErrors.visibility}</p>
                    ) : null}
                  </div>

                  <div className="md:col-span-2">
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={organization.description || ""}
                      className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                      placeholder="Organization description"
                    />
                    {organizationState.fieldErrors?.description ? (
                      <p className="mt-1 text-xs text-rose-300">{organizationState.fieldErrors.description}</p>
                    ) : null}
                  </div>
                </div>

                <FormStatus message={organizationState.message} error={organizationState.formError} />

                <SubmitButton
                  label={`Save ${organization.tag} Preferences`}
                  pendingLabel="Saving Organization Preferences..."
                  className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
                />
              </form>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
