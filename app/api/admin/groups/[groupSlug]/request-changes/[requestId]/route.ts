import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { findGroupAccess, getCurrentUser } from "@/lib/auth";
import {
  groupAuditEvents,
  groupRequestChanges,
  groupRequestReference,
  type PrayerRequestStatus,
  type RequestChange,
} from "@/lib/firebase/firestore";
import { publishCurrentGroupPrayerRequests } from "@/lib/google-doc-publication";
import { canApproveChange } from "@/lib/request-workflow";

const reviewActions = new Set(["approve", "decline"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupSlug: string; requestId: string }> },
) {
  const { groupSlug, requestId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign-in required." }, { status: 401 });

  const access = await findGroupAccess(user.id, groupSlug);
  if (!access || access.role !== "admin") {
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  }

  const payload = await request.json().catch(() => ({}));
  const reviewAction = payload.action;
  if (!reviewActions.has(reviewAction)) return NextResponse.json({ error: "Unknown review action." }, { status: 400 });

  const changeReference = groupRequestChanges(access.group.id).doc(requestId);
  const changeDocument = await changeReference.get();
  if (!changeDocument.exists) return NextResponse.json({ error: "Change request not found." }, { status: 404 });
  const change = { id: changeDocument.id, ...changeDocument.data() } as RequestChange;
  if (change.status !== "pending") {
    return NextResponse.json({ error: "This change request has already been reviewed." }, { status: 409 });
  }

  const prayerReference = groupRequestReference(access.group.id, change.requestId);
  const prayerDocument = await prayerReference.get();
  if (!prayerDocument.exists) return NextResponse.json({ error: "Prayer request not found." }, { status: 404 });
  const prayer = prayerDocument.data();
  const currentStatus = prayer?.status as PrayerRequestStatus;
  if (prayer?.submitterUserId !== change.submitterUserId) {
    return NextResponse.json({ error: "The submitter linkage for this change is invalid." }, { status: 409 });
  }

  if (reviewAction === "approve") {
    if (!canApproveChange(change.action, currentStatus)) {
      return NextResponse.json({ error: "The request is no longer in a state that allows this change." }, { status: 409 });
    }
    if (change.action === "update" && (!change.proposedBody || !change.proposedCategory || !change.proposedDuration)) {
      return NextResponse.json({ error: "The proposed update is incomplete." }, { status: 409 });
    }

    await prayerReference.update({
      ...(change.action === "update" ? {
        title: change.proposedTitle ?? null,
        body: change.proposedBody,
        category: change.proposedCategory,
        duration: change.proposedDuration,
        editedAt: FieldValue.serverTimestamp(),
        editedByUserId: user.id,
      } : {}),
      ...(change.action === "mark_answered" ? {
        status: "answered",
        answeredAt: FieldValue.serverTimestamp(),
      } : {}),
      ...(change.action === "remove" ? {
        status: "removed",
        removedAt: FieldValue.serverTimestamp(),
      } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await changeReference.update({
    status: reviewAction === "approve" ? "approved" : "declined",
    reviewedAt: FieldValue.serverTimestamp(),
    reviewedByUserId: user.id,
  });
  await groupAuditEvents(access.group.id).add({
    eventType: `request_change_${reviewAction === "approve" ? "approved" : "declined"}`,
    requestId: change.requestId,
    actorUserId: user.id,
    requestedAction: change.action,
    createdAt: FieldValue.serverTimestamp(),
  });

  if (reviewAction === "approve" && ["approved", "answered"].includes(currentStatus)) {
    await publishCurrentGroupPrayerRequests({
      groupId: access.group.id,
      groupName: access.group.name,
      submissionToken: access.group.submissionToken,
    });
  }

  return NextResponse.json({ ok: true });
}
