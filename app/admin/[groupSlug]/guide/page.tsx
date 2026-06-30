import Link from "next/link";
import { ShareLinkTools } from "@/components/share-link-tools";
import { requireGroupAdmin } from "@/lib/auth";
import { getGoogleDocConnection } from "@/lib/firebase/firestore";
import { buildAbsoluteAppUrl } from "@/lib/site-url";

export default async function AdminGuidePage({ params }: { params: Promise<{ groupSlug: string }> }) {
  const { groupSlug } = await params;
  const access = await requireGroupAdmin(groupSlug);
  const googleDoc = await getGoogleDocConnection(access.group.id);
  const submissionUrl = buildAbsoluteAppUrl(`/submit/${access.group.submissionToken}`);
  const boardUrl = buildAbsoluteAppUrl(`/board/${encodeURIComponent(groupSlug)}`);
  const adminUrl = buildAbsoluteAppUrl(`/admin/${encodeURIComponent(groupSlug)}`);
  const links = [
    submissionUrl
      ? {
          label: "Submission link",
          description: "Give this to people in the group when you want them to submit a request.",
          href: submissionUrl,
        }
      : null,
    boardUrl
      ? {
          label: "Private board link",
          description: "Give this to signed-in members who should view approved requests in the app.",
          href: boardUrl,
        }
      : null,
    adminUrl
      ? {
          label: "Admin link",
          description: "Use this only with administrators for review, member access, and publishing settings.",
          href: adminUrl,
        }
      : null,
    googleDoc
      ? {
          label: "Google Doc link",
          description: "Give this to the intended prayer audience once you are comfortable with the Doc sharing setting.",
          href: googleDoc.documentUrl,
        }
      : null,
  ].filter((link): link is { label: string; description: string; href: string } => Boolean(link));

  return (
    <main className="content-page">
      <article className="card content-card">
        <p className="eyebrow">{access.group.name} - administrator</p>
        <h1>Admin quick-start</h1>
        <p className="lede">
          A simple operating guide for gathering, reviewing, and sharing prayer requests for {access.group.name}.
        </p>

        <section>
          <h2>1. Share the submission link</h2>
          <p>
            Send the submission link to this group only. People do not choose a group; the link itself determines that every request goes to {access.group.name}.
          </p>
          <p>
            Anonymous requests do not require sign-in. Named requests require Google, Facebook, or a verified email account so the displayed name cannot be typed in by someone else.
          </p>
        </section>

        <section>
          <h2>2. Review before sharing</h2>
          <p>
            New requests stay pending until an administrator approves them. During review, edit only what is needed for clarity, permission, or privacy.
          </p>
          <p>
            Remove unnecessary identifying details, especially when a request mentions someone who may not know their situation is being shared.
          </p>
        </section>

        <section>
          <h2>3. Keep the Google Doc private in practice</h2>
          <p>
            The Google Doc is view-only, but a link can still be forwarded, copied, or screenshotted. Share it only with the intended prayer audience.
          </p>
          <p>
            If the Doc is set to anyone-with-link viewer, anyone who receives the link can read every approved request in that document.
          </p>
        </section>

        <section>
          <h2>4. Maintain active requests</h2>
          <p>
            Mark answered requests when there is a praise report. Archive requests that are no longer current. The active-request page also highlights requests that are due for archive.
          </p>
        </section>

        <section>
          <h2>Suggested message to submitters</h2>
          <div className="copy-template">
            <p>
              Please share prayer requests for {access.group.name} here: {submissionUrl ?? "[submission link]"}
            </p>
            <p>
              You can submit anonymously without signing in, or sign in with Google, Facebook, or email if you want your name shown. Please only share details you have permission to share.
            </p>
          </div>
        </section>

        <section>
          <h2>Suggested note for Google Doc readers</h2>
          <div className="copy-template">
            <p>
              This document is for praying with care for requests shared with {access.group.name}. Please do not forward, copy, screenshot, or discuss requests outside the intended group without permission.
            </p>
            <p>
              If you notice something that should be removed or corrected, please contact an administrator.
            </p>
          </div>
        </section>

        <section>
          <h2>Group links</h2>
          {links.length > 0 ? <ShareLinkTools links={links} /> : <p className="error">Set NEXT_PUBLIC_SITE_URL before sharing production links.</p>}
        </section>

        <p>
          <Link href={`/admin/${encodeURIComponent(groupSlug)}`}>Back to administration</Link>
        </p>
      </article>
    </main>
  );
}
