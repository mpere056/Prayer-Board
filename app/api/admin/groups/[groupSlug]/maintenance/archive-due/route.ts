import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { findGroupAccess, getCurrentUser } from "@/lib/auth";
import { firebaseAdminDb } from "@/lib/firebase/admin";
import {
  groupAuditEvents,
  groupRequestReference,
  listApprovedRequestsDueForArchive,
} from "@/lib/firebase/firestore";
import { publishCurrentGroupPrayerRequests } from "@/lib/google-doc-publication";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ groupSlug: string }> },
) {
  const { groupSlug } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign-in required." }, { status: 401 });

  const access = await findGroupAccess(user.id, groupSlug);
  if (!access || access.role !== "admin") {
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  }

  const dueRequests = await listApprovedRequestsDueForArchive(access.group.id);
  if (dueRequests.length === 0) {
    return NextResponse.json({ ok: true, archivedCount: 0 });
  }

  const batch = firebaseAdminDb().batch();
  for (const request of dueRequests) {
    batch.update(groupRequestReference(access.group.id, request.id), {
      status: "archived",
      archivedAt: FieldValue.serverTimestamp(),
      statusBeforeArchive: "approved",
      moderatedByUserId: user.id,
      moderatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();

  await groupAuditEvents(access.group.id).add({
    eventType: "request_bulk_archived_due",
    archivedCount: dueRequests.length,
    actorUserId: user.id,
    createdAt: FieldValue.serverTimestamp(),
  });

  await publishCurrentGroupPrayerRequests({ groupId: access.group.id, groupName: access.group.name });

  return NextResponse.json({ ok: true, archivedCount: dueRequests.length });
}
