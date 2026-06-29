import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { findGroupAccess, getCurrentUser } from "@/lib/auth";
import { firebaseAdminAuth } from "@/lib/firebase/admin";
import { countGroupAdmins, groupAuditEvents, groupMemberReference, type GroupRole } from "@/lib/firebase/firestore";

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

  const { email, role } = await request.json().catch(() => ({}));
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!normalizedEmail) return NextResponse.json({ error: "Email is required." }, { status: 400 });
  if (role !== "member" && role !== "admin") return NextResponse.json({ error: "Choose a valid role." }, { status: 400 });

  let targetUser;
  try {
    targetUser = await firebaseAdminAuth().getUserByEmail(normalizedEmail);
  } catch {
    return NextResponse.json(
      { error: "That person needs to sign in or create an account before they can be added." },
      { status: 404 },
    );
  }
  if (targetUser.providerData.some((provider) => provider.providerId === "password") && !targetUser.emailVerified) {
    return NextResponse.json(
      { error: "That person needs to verify their email address before they can be added." },
      { status: 409 },
    );
  }

  const memberReference = groupMemberReference(access.group.id, targetUser.uid);
  const existingMember = await memberReference.get();
  const existingRole = existingMember.data()?.role as GroupRole | undefined;
  if (existingRole === "admin" && role === "member") {
    const adminCount = await countGroupAdmins(access.group.id);
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Add another administrator before changing the final admin." }, { status: 409 });
    }
  }

  await memberReference.set({
    role: role as GroupRole,
    email: targetUser.email ?? normalizedEmail,
    displayName: targetUser.displayName ?? null,
    ...(existingMember.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  await groupAuditEvents(access.group.id).add({
    eventType: "member_added",
    targetUserId: targetUser.uid,
    actorUserId: user.id,
    role,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
