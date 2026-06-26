import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { findGroupAccess, getCurrentUser } from "@/lib/auth";
import {
  countGroupAdmins,
  groupAuditEvents,
  groupMemberReference,
  type GroupRole,
} from "@/lib/firebase/firestore";

const actions = new Set(["promote", "demote", "remove"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupSlug: string; userId: string }> },
) {
  const { groupSlug, userId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign-in required." }, { status: 401 });

  const access = await findGroupAccess(user.id, groupSlug);
  if (!access || access.role !== "admin") {
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  }

  const { action } = await request.json().catch(() => ({}));
  if (!actions.has(action)) return NextResponse.json({ error: "Unknown member action." }, { status: 400 });

  const memberReference = groupMemberReference(access.group.id, userId);
  const member = await memberReference.get();
  if (!member.exists) return NextResponse.json({ error: "Member not found." }, { status: 404 });

  const currentRole = member.data()?.role as GroupRole;
  if (currentRole === "admin" && (action === "demote" || action === "remove")) {
    const adminCount = await countGroupAdmins(access.group.id);
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Add another administrator before changing the final admin." }, { status: 409 });
    }
  }

  if (action === "remove") {
    await memberReference.delete();
  } else {
    await memberReference.update({
      role: action === "promote" ? "admin" : "member",
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await groupAuditEvents(access.group.id).add({
    eventType: `member_${action}`,
    targetUserId: userId,
    actorUserId: user.id,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
