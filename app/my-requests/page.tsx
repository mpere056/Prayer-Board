import Link from "next/link";
import { redirect } from "next/navigation";
import { MyRequestActions } from "@/components/my-request-actions";
import { getCurrentUser } from "@/lib/auth";
import { listPrayerRequestsForUser } from "@/lib/firebase/firestore";

const statusLabels: Record<string, string> = {
  pending: "Waiting for review",
  approved: "Active",
  answered: "Answered",
  archived: "Archived",
  rejected: "Not published",
  removed: "Removed",
};

function dateLabel(value: { toDate(): Date } | undefined) {
  return value ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(value.toDate()) : "Recently";
}

export default async function MyRequestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent("/my-requests")}`);
  const requests = await listPrayerRequestsForUser(user.id);

  return (
    <main className="admin-page">
      <section className="admin-heading">
        <div>
          <p className="eyebrow">Your prayer requests</p>
          <h1>My requests</h1>
          <p className="muted">Review requests you submitted while signed in and ask a group administrator to update them.</p>
        </div>
        <Link className="button button-secondary" href="/">Back home</Link>
      </section>
      {requests.length === 0 ? (
        <section className="card empty-card">
          <h2>No signed-in requests yet.</h2>
          <p className="muted">Requests submitted without signing in cannot be connected to your account later.</p>
        </section>
      ) : (
        <div className="request-list">
          {requests.map((request) => (
            <article className="card moderation-card" key={`${request.groupId}-${request.id}`}>
              <div className="request-meta">
                <span>{request.groupName}</span>
                <span>{dateLabel(request.submittedAt)}</span>
                <span>{statusLabels[request.status] ?? request.status}</span>
                <span>{request.anonymity === "named" ? "Shared with your name" : "Shared anonymously"}</span>
              </div>
              <h2>{request.title || "Prayer request"}</h2>
              <p className="request-body">{request.body}</p>
              {request.latestChange?.status === "approved" ? (
                <p className="success">Your most recent change request was approved.</p>
              ) : request.latestChange?.status === "declined" ? (
                <p className="notice">Your most recent change request was not approved. You can submit another request with more context.</p>
              ) : null}
              <MyRequestActions
                groupSlug={request.groupSlug}
                hasPendingChange={Boolean(request.pendingChange)}
                initialBody={request.body}
                initialCategory={request.category || "other"}
                initialDuration={request.duration || "unspecified"}
                initialTitle={request.title || ""}
                requestId={request.id}
                status={request.status}
              />
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
