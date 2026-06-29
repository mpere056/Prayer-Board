import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  findGroupBySlug,
  groupAuditEvents,
  groupRequestChanges,
  groupRequestReference,
  type RequestChangeAction,
  type StoredPrayerRequest,
} from "@/lib/firebase/firestore";

const actions = new Set<RequestChangeAction>(["update", "mark_answered", "remove"]);
const categories = new Set(["health", "family_relationships", "work_school", "grief", "guidance", "praise", "other"]);
const durations = new Set(["this_week", "this_month", "ongoing", "unspecified"]);

function text(value: unknown, maximumLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maximumLength) : "";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupSlug: string; requestId: string }> },
) {
  const { groupSlug, requestId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign-in required." }, { status: 401 });

  const group = await findGroupBySlug(groupSlug);
  if (!group) return NextResponse.json({ error: "Prayer group not found." }, { status: 404 });

  const requestReference = groupRequestReference(group.id, requestId);
  const requestDocument = await requestReference.get();
  if (!requestDocument.exists) return NextResponse.json({ error: "Prayer request not found." }, { status: 404 });

  const prayerRequest = { id: requestDocument.id, ...requestDocument.data() } as StoredPrayerRequest;
  if (prayerRequest.submitterUserId !== user.id) {
    return NextResponse.json({ error: "You can only manage your own prayer requests." }, { status: 403 });
  }

  const payload = await request.json().catch(() => ({}));
  const action = payload.action as RequestChangeAction;
  if (!actions.has(action)) return NextResponse.json({ error: "Unknown request action." }, { status: 400 });

  if (["removed", "rejected"].includes(prayerRequest.status)) {
    return NextResponse.json({ error: "This request is no longer available for changes." }, { status: 409 });
  }
  if (action === "mark_answered" && prayerRequest.status !== "approved") {
    return NextResponse.json({ error: "Only an active approved request can be marked answered." }, { status: 409 });
  }

  const changeReference = groupRequestChanges(group.id).doc(requestId);
  const existingChange = await changeReference.get();
  if (existingChange.data()?.status === "pending") {
    return NextResponse.json({ error: "An administrator is already reviewing a change for this request." }, { status: 409 });
  }

  const note = text(payload.note, 1000);
  const proposedTitle = text(payload.title, 120);
  const proposedBody = text(payload.body, 4000);
  const proposedCategory = payload.category;
  const proposedDuration = payload.duration;

  if (action === "update" && (
    !proposedBody
    || typeof proposedCategory !== "string"
    || !categories.has(proposedCategory)
    || typeof proposedDuration !== "string"
    || !durations.has(proposedDuration)
  )) {
    return NextResponse.json({ error: "Please provide request text, category, and duration." }, { status: 400 });
  }

  await changeReference.set({
    requestId,
    submitterUserId: user.id,
    action,
    status: "pending",
    note: note || null,
    proposedTitle: action === "update" ? proposedTitle || null : null,
    proposedBody: action === "update" ? proposedBody : null,
    proposedCategory: action === "update" ? proposedCategory : null,
    proposedDuration: action === "update" ? proposedDuration : null,
    requestedAt: FieldValue.serverTimestamp(),
    reviewedAt: null,
    reviewedByUserId: null,
  });
  await groupAuditEvents(group.id).add({
    eventType: "request_change_requested",
    requestId,
    actorUserId: user.id,
    requestedAction: action,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
