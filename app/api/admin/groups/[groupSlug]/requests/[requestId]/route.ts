import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { findGroupAccess, getCurrentUser } from "@/lib/auth";
import {
  groupAuditEvents,
  groupRequestReference,
  type PrayerRequestStatus,
} from "@/lib/firebase/firestore";
import { publishCurrentGroupPrayerRequests } from "@/lib/google-doc-publication";

const actions = new Set(["approve", "reject", "remove", "mark_answered", "archive", "restore", "save_edits"]);
const categories = new Set(["health", "family_relationships", "work_school", "grief", "guidance", "praise", "other"]);
const durations = new Set(["this_week", "this_month", "ongoing", "unspecified"]);

type RequestAction = "approve" | "reject" | "remove" | "mark_answered" | "archive" | "restore" | "save_edits";

function text(value: unknown, maximumLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maximumLength) : "";
}

function parseRequestEdits(input: Record<string, unknown>) {
  const title = text(input.title, 120);
  const body = text(input.body, 4000);
  const category = input.category;
  const duration = input.duration;

  if (!body || !categories.has(category as string) || !durations.has(duration as string)) return null;

  return {
    title: title || null,
    body,
    category,
    duration,
  };
}

function transitionFor(action: RequestAction, currentStatus: PrayerRequestStatus, statusBeforeArchive?: PrayerRequestStatus | null) {
  if (action === "approve" && currentStatus === "pending") return { nextStatus: "approved" as const };
  if (action === "reject" && currentStatus === "pending") return { nextStatus: "rejected" as const };
  if (action === "mark_answered" && currentStatus === "approved") return { nextStatus: "answered" as const };
  if (action === "archive" && (currentStatus === "approved" || currentStatus === "answered")) {
    return { nextStatus: "archived" as const, statusBeforeArchive: currentStatus };
  }
  if (action === "restore" && currentStatus === "archived") {
    return {
      nextStatus: statusBeforeArchive === "answered" ? "answered" as const : "approved" as const,
      statusBeforeArchive: null,
    };
  }
  if (action === "remove" && currentStatus !== "removed") return { nextStatus: "removed" as const };
  return null;
}

function shouldRepublish(currentStatus: PrayerRequestStatus, nextStatus: PrayerRequestStatus) {
  return ["approved", "answered"].includes(currentStatus) || ["approved", "answered"].includes(nextStatus);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupSlug: string; requestId: string }> },
) {
  const { groupSlug, requestId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign-in required." }, { status: 401 });

  const access = await findGroupAccess(user.id, groupSlug);
  if (!access || access.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });

  const payload = await request.json().catch(() => ({}));
  const { action } = payload;
  if (!actions.has(action)) return NextResponse.json({ error: "Unknown moderation action." }, { status: 400 });

  const requestReference = groupRequestReference(access.group.id, requestId);
  const current = await requestReference.get();
  if (!current.exists) return NextResponse.json({ error: "Request not found." }, { status: 404 });

  const currentData = current.data();
  const currentStatus = currentData?.status as PrayerRequestStatus;
  if (action === "save_edits") {
    if (currentStatus !== "pending") {
      return NextResponse.json({ error: "Only pending requests can be edited here." }, { status: 409 });
    }

    const edits = parseRequestEdits(payload);
    if (!edits) return NextResponse.json({ error: "Please provide a request body, category, and duration." }, { status: 400 });

    await requestReference.update({
      ...edits,
      editedByUserId: user.id,
      editedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await groupAuditEvents(access.group.id).add({
      eventType: "request_edited",
      requestId,
      actorUserId: user.id,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  }

  const transition = transitionFor(action as RequestAction, currentStatus, currentData?.statusBeforeArchive);
  if (!transition) {
    return NextResponse.json({ error: "This request is no longer available for that action." }, { status: 409 });
  }

  const nextStatus: PrayerRequestStatus = transition.nextStatus;
  const approvalEdits = action === "approve" && currentStatus === "pending" ? parseRequestEdits(payload) : null;
  if (action === "approve" && currentStatus === "pending" && !approvalEdits) {
    return NextResponse.json({ error: "Please provide a request body, category, and duration before approving." }, { status: 400 });
  }

  await requestReference.update({
    ...(approvalEdits ? {
      ...approvalEdits,
      editedByUserId: user.id,
      editedAt: FieldValue.serverTimestamp(),
    } : {}),
    status: nextStatus,
    moderatedByUserId: user.id,
    moderatedAt: FieldValue.serverTimestamp(),
    approvedAt: action === "approve" ? FieldValue.serverTimestamp() : currentData?.approvedAt ?? null,
    answeredAt: action === "mark_answered" ? FieldValue.serverTimestamp() : currentData?.answeredAt ?? null,
    archivedAt: action === "archive" ? FieldValue.serverTimestamp() : null,
    removedAt: action === "remove" ? FieldValue.serverTimestamp() : null,
    statusBeforeArchive: transition.statusBeforeArchive ?? null,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await groupAuditEvents(access.group.id).add({
    eventType: `request_${nextStatus}`,
    requestId,
    actorUserId: user.id,
    createdAt: FieldValue.serverTimestamp(),
  });

  if (shouldRepublish(currentStatus, nextStatus)) {
    await publishCurrentGroupPrayerRequests({ groupId: access.group.id, groupName: access.group.name });
  }

  return NextResponse.json({ ok: true });
}
