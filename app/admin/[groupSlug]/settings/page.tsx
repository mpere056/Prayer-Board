import Link from "next/link";
import { GoogleDocConnect } from "@/components/google-doc-connect";
import { GoogleDocSettingsForm } from "@/components/google-doc-settings-form";
import { RetentionSettingsForm } from "@/components/retention-settings-form";
import { requireGroupAdmin } from "@/lib/auth";
import { getGoogleDocConnection } from "@/lib/firebase/firestore";

type SearchParams = Promise<{ "google-doc"?: string }>;

function statusMessage(status: string | undefined) {
  if (status === "connected") return "Google Doc connected successfully.";
  if (status === "missing-refresh-token") return "Google did not provide a refresh token. Please try connecting again.";
  if (status === "connection-failed") return "The Google Doc connection could not be completed. Please try again.";
  if (status === "invalid-state") return "For your protection, the Google connection state expired. Please start again.";
  return null;
}

export default async function GroupSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupSlug: string }>;
  searchParams: SearchParams;
}) {
  const { groupSlug } = await params;
  const query = await searchParams;
  const access = await requireGroupAdmin(groupSlug);
  const connection = await getGoogleDocConnection(access.group.id);
  const message = statusMessage(query["google-doc"]);

  return (
    <main className="page-center">
      <section className="card route-card">
        <p className="eyebrow">{access.group.name} · administrator</p>
        <h1>Group settings</h1>
        <h2>Google Doc publishing</h2>
        {message ? <p className={query["google-doc"] === "connected" ? "success" : "error"}>{message}</p> : null}
        {connection ? (
          <div className="stack">
            <p className="muted">
              This group has a connected document with <strong>{connection.sharingMode === "anyone_with_link_viewer" ? "anyone-with-link viewer" : "restricted"}</strong> access.
            </p>
            <p className={connection.lastPublicationStatus === "failed" ? "error" : "success"}>
              Publication status: {connection.lastPublicationStatus === "failed" ? "Needs attention" : "Healthy"}
            </p>
            <a className="button" href={connection.documentUrl} rel="noreferrer" target="_blank">
              Open {access.group.name} Google Doc
            </a>
            {connection.lastPublishedAt ? (
              <p className="muted">Last published: {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(connection.lastPublishedAt))}</p>
            ) : null}
            {connection.lastPublicationStatus === "failed" ? (
              <p className="error">{connection.lastPublicationError || "The last publication attempt failed."}</p>
            ) : null}
            <p className="muted">
              Connection activity and publication retries are recorded in the <Link href={`/admin/${encodeURIComponent(groupSlug)}/audit`}>group audit log</Link>.
            </p>
            <GoogleDocSettingsForm groupSlug={groupSlug} initialIncludeAnswered={connection.includeAnsweredSection} />
            <p className="notice">
              The app publishes approved requests here. If enabled, answered requests are included in their own section. Archived, rejected, and removed requests are never published.
            </p>
          </div>
        ) : (
          <>
            <p className="muted">
              Create a view-only document for {access.group.name}. It will never be shared with another Prayer Board group.
            </p>
            <GoogleDocConnect groupSlug={groupSlug} />
          </>
        )}
        <section className="admin-section" aria-labelledby="retention-heading">
          <h2 id="retention-heading">Request retention</h2>
          <p className="muted">
            Set when active requests appear as due for manual archive maintenance. Nothing is archived until an administrator confirms it.
          </p>
          <RetentionSettingsForm
            groupSlug={groupSlug}
            initialArchiveDays={access.group.defaultArchiveAfterDays}
            initialExemptOngoing={access.group.exemptOngoingFromArchive}
          />
        </section>
        <p>
          <Link href={`/admin/${encodeURIComponent(groupSlug)}`}>Back to administration</Link>
        </p>
      </section>
    </main>
  );
}
