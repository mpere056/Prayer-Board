import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getCurrentUser } from "@/lib/auth";
import { firebaseAdminDb } from "@/lib/firebase/admin";
import { findGroupBySubmissionToken, groupAuditEvents } from "@/lib/firebase/firestore";
import { allowSubmission } from "@/lib/submission-rate-limit";

const categories = new Set(["health", "family_relationships", "work_school", "grief", "guidance", "praise", "other"]);
const durations = new Set(["this_week", "this_month", "ongoing", "unspecified"]);
const identities = new Set(["anonymous_guest", "named", "anonymous_to_group"]);

function text(value: unknown, maximumLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maximumLength) : "";
}

export async function POST(request: Request, { params }: { params: Promise<{ submissionToken: string }> }) {
  const { submissionToken } = await params;
  const group = await findGroupBySubmissionToken(submissionToken);
  if (!group) return NextResponse.json({ error: "This submission link is not available." }, { status: 404 });

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipAddress = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  if (!(await allowSubmission(group.id, ipAddress))) {
    return NextResponse.json({ error: "Please wait a few minutes before submitting another request." }, { status: 429 });
  }

  const input = await request.json().catch(() => null);
  const identity = input?.identity;
  const body = text(input?.body, 4000);
  const title = text(input?.title, 120);
  const category = input?.category;
  const duration = input?.duration;

  if (!identities.has(identity) || !body || !categories.has(category) || !durations.has(duration) || input?.hasConsent !== true) {
    return NextResponse.json({ error: "Please complete the required fields." }, { status: 400 });
  }

  const requiresIdentity = identity === "named" || identity === "anonymous_to_group";
  const user = requiresIdentity ? await getCurrentUser() : null;
  if (requiresIdentity && !user) {
    return NextResponse.json({ error: "Please sign in with Google before sharing this request." }, { status: 401 });
  }

  const document = firebaseAdminDb().collection(`groups/${group.id}/requests`).doc();
  await document.set({
    title: title || null,
    body,
    category,
    duration,
    anonymity: identity === "named" ? "named" : "anonymous_to_group",
    submitterUserId: user?.id ?? null,
    submitterName: identity === "named" ? user?.displayName || user?.email || "Member" : null,
    status: "pending",
    submittedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await groupAuditEvents(group.id).add({
    eventType: "request_submitted",
    requestId: document.id,
    actorUserId: user?.id ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
