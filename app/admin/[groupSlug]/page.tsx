import Link from "next/link";
import { ShareLinkTools } from "@/components/share-link-tools";
import { requireGroupAdmin } from "@/lib/auth";
import { getGoogleDocConnection, getPrayerRequestStatusCounts } from "@/lib/firebase/firestore";
import { buildAbsoluteAppUrl } from "@/lib/site-url";

export default async function AdminPage({ params }: { params: Promise<{ groupSlug: string }> }) {
  const { groupSlug } = await params;
  const access = await requireGroupAdmin(groupSlug);
  const [counts, googleDoc] = await Promise.all([
    getPrayerRequestStatusCounts(access.group.id),
    getGoogleDocConnection(access.group.id),
  ]);
  const encodedGroupSlug = encodeURIComponent(groupSlug);
  const siteLinks = [
    {
      label: "Submission link",
      description: `Send this to ${access.group.name} people when you want them to submit a request. Anonymous submissions do not require sign-in.`,
      href: buildAbsoluteAppUrl(`/submit/${access.group.submissionToken}`),
    },
    {
      label: "Prayer board link",
      description: `Send this to signed-in ${access.group.name} members who should be able to view approved requests.`,
      href: buildAbsoluteAppUrl(`/board/${encodedGroupSlug}`),
    },
    {
      label: "Admin link",
      description: `Use this with ${access.group.name} administrators only for review, members, and publishing settings.`,
      href: buildAbsoluteAppUrl(`/admin/${encodedGroupSlug}`),
    },
  ].filter((link): link is { label: string; description: string; href: string } => Boolean(link.href));

  return (
    <main className="page-center">
      <section className="card route-card">
        <p className="eyebrow">{access.group.name} · administrator</p>
        <h1>Group administration</h1>
        <p className="muted">
          Keep requests moving through review, prayer, answered testimony, and archive. Each group remains isolated from every other group.
        </p>
        <div className="dashboard-grid" aria-label="Request status summary">
          <div className="stat-card">
            <span>Pending</span>
            <strong>{counts.pending}</strong>
          </div>
          <div className="stat-card">
            <span>Active</span>
            <strong>{counts.approved}</strong>
          </div>
          <div className="stat-card">
            <span>Answered</span>
            <strong>{counts.answered}</strong>
          </div>
          <div className="stat-card">
            <span>Archived</span>
            <strong>{counts.archived}</strong>
          </div>
        </div>
        {googleDoc?.lastPublicationStatus === "failed" ? (
          <p className="error">The connected Google Doc needs attention. Open settings to retry or reconnect publishing.</p>
        ) : null}
        <section className="admin-section" aria-labelledby="share-links-heading">
          <h2 id="share-links-heading">Share links</h2>
          <p className="muted">
            These links are only for {access.group.name}. The submission link is the one to send to this group so they never need to pick a group.
          </p>
          {siteLinks.length > 0 ? (
            <ShareLinkTools links={siteLinks} />
          ) : (
            <p className="error">Set NEXT_PUBLIC_SITE_URL before sharing production links.</p>
          )}
        </section>
        <div className="admin-links">
          <Link className="button" href={`/admin/${encodeURIComponent(groupSlug)}/requests`}>
            Review pending requests
          </Link>
          <Link className="button button-secondary" href={`/admin/${encodeURIComponent(groupSlug)}/active`}>
            Manage active requests
          </Link>
          <Link className="button button-secondary" href={`/admin/${encodeURIComponent(groupSlug)}/answered`}>
            Answered requests
          </Link>
          <Link className="button button-secondary" href={`/admin/${encodeURIComponent(groupSlug)}/archive`}>
            Archive
          </Link>
          <Link className="button button-secondary" href={`/admin/${encodeURIComponent(groupSlug)}/settings`}>
            Google Doc settings
          </Link>
          <Link className="button button-secondary" href={`/admin/${encodeURIComponent(groupSlug)}/readiness`}>
            Launch readiness
          </Link>
          <Link className="button button-secondary" href={`/admin/${encodeURIComponent(groupSlug)}/members`}>
            Members
          </Link>
          <Link className="button button-secondary" href={`/admin/${encodeURIComponent(groupSlug)}/guide`}>
            Admin guide
          </Link>
          <Link className="button button-secondary" href={`/admin/${encodeURIComponent(groupSlug)}/audit`}>
            Audit log
          </Link>
        </div>
      </section>
    </main>
  );
}
