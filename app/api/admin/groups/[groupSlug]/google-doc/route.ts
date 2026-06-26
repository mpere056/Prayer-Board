import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { findGroupAccess, getCurrentUser } from "@/lib/auth";
import { getGoogleDocConnection, groupAuditEvents, groupGoogleDocReference } from "@/lib/firebase/firestore";
import { publishCurrentGroupPrayerRequests } from "@/lib/google-doc-publication";

const actions = new Set(["update_settings", "retry", "disconnect"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupSlug: string }> },
) {
  const { groupSlug } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign-in required." }, { status: 401 });

  const access = await findGroupAccess(user.id, groupSlug);
  if (!access || access.role !== "admin") {
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  }

  const { action, includeAnswered } = await request.json().catch(() => ({}));
  if (!actions.has(action)) return NextResponse.json({ error: "Unknown Google Doc action." }, { status: 400 });

  const connection = await getGoogleDocConnection(access.group.id);
  if (!connection) return NextResponse.json({ error: "No Google Doc is connected." }, { status: 404 });

  if (action === "disconnect") {
    await groupGoogleDocReference(access.group.id).delete();
    await groupAuditEvents(access.group.id).add({
      eventType: "google_doc_disconnected",
      actorUserId: user.id,
      createdAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "update_settings") {
    await groupGoogleDocReference(access.group.id).update({
      includeAnsweredSection: Boolean(includeAnswered),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  const publication = await publishCurrentGroupPrayerRequests({
    groupId: access.group.id,
    groupName: access.group.name,
  });

  await groupAuditEvents(access.group.id).add({
    eventType: action === "retry" ? "google_doc_retry" : "google_doc_settings_updated",
    actorUserId: user.id,
    publicationSucceeded: publication.published,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true, publication });
}
