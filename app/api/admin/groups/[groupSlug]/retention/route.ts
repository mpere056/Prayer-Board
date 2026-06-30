import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { findGroupAccess, getCurrentUser } from "@/lib/auth";
import { firebaseAdminDb } from "@/lib/firebase/admin";
import { groupAuditEvents } from "@/lib/firebase/firestore";

const allowedArchiveDays = new Set([14, 30, 60, 90]);

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

  const body = await request.json().catch(() => null);
  const defaultArchiveAfterDays = Number(body?.defaultArchiveAfterDays);
  const exemptOngoingFromArchive = body?.exemptOngoingFromArchive;
  if (!allowedArchiveDays.has(defaultArchiveAfterDays) || typeof exemptOngoingFromArchive !== "boolean") {
    return NextResponse.json({ error: "Choose a valid retention policy." }, { status: 400 });
  }

  await firebaseAdminDb().doc(`groups/${access.group.id}`).update({
    defaultArchiveAfterDays,
    exemptOngoingFromArchive,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await groupAuditEvents(access.group.id).add({
    eventType: "group_retention_settings_updated",
    actorUserId: user.id,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
