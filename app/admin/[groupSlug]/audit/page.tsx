import Link from "next/link";
import { requireGroupAdmin } from "@/lib/auth";
import { listRecentGroupAuditEvents, type GroupAuditEvent } from "@/lib/firebase/firestore";

function eventLabel(event: GroupAuditEvent) {
  const labels: Record<string, string> = {
    request_submitted: "Request submitted",
    request_edited: "Request edited",
    request_approved: "Request approved",
    request_rejected: "Request rejected",
    request_answered: "Request marked answered",
    request_archived: "Request archived",
    request_bulk_archived_due: "Due requests archived",
    request_removed: "Request removed",
    member_added: "Member added",
    member_promote: "Member promoted",
    member_demote: "Member demoted",
    member_remove: "Member removed",
    google_doc_disconnected: "Google Doc disconnected",
    google_doc_retry: "Google Doc publication retried",
    google_doc_settings_updated: "Google Doc settings updated",
  };

  return labels[event.eventType] ?? event.eventType.replaceAll("_", " ");
}

function formatTimestamp(event: GroupAuditEvent) {
  const date = event.createdAt?.toDate();
  if (!date) return "Just now";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function eventDetails(event: GroupAuditEvent) {
  const details = [];

  if (event.requestId) details.push(`Request ${event.requestId}`);
  if (event.targetUserId) details.push(`User ${event.targetUserId}`);
  if (event.role) details.push(`Role: ${event.role}`);
  if ("archivedCount" in event && typeof event.archivedCount === "number") details.push(`${event.archivedCount} archived`);
  if (event.actorUserId) details.push(`By ${event.actorUserId}`);

  return details;
}

export default async function GroupAuditPage({ params }: { params: Promise<{ groupSlug: string }> }) {
  const { groupSlug } = await params;
  const access = await requireGroupAdmin(groupSlug);
  const events = await listRecentGroupAuditEvents(access.group.id, 75);

  return (
    <main className="admin-page">
      <section className="admin-heading">
        <div>
          <p className="eyebrow">{access.group.name} · administrator</p>
          <h1>Audit log</h1>
          <p className="muted">
            Recent administrative and request activity for this group only. Request text, secrets, and Google tokens are never shown here.
          </p>
        </div>
        <Link className="button button-secondary" href={`/admin/${encodeURIComponent(groupSlug)}`}>
          Back to admin
        </Link>
      </section>

      {events.length === 0 ? (
        <section className="card empty-card">
          <h2>No activity yet</h2>
          <p className="muted">This group’s audit log will populate as requests, members, and Google Doc settings change.</p>
        </section>
      ) : (
        <section className="card audit-card" aria-label="Recent audit events">
          <ol className="audit-list">
            {events.map((event) => {
              const details = eventDetails(event);

              return (
                <li className="audit-row" key={event.id}>
                  <div>
                    <strong>{eventLabel(event)}</strong>
                    {details.length > 0 ? <p className="muted">{details.join(" · ")}</p> : null}
                  </div>
                  <time dateTime={event.createdAt?.toDate().toISOString()}>{formatTimestamp(event)}</time>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </main>
  );
}
