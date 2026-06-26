import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { findGroupAccess, getCurrentUser } from "@/lib/auth";
import { groupRequestReference, prayerMarkReference } from "@/lib/firebase/firestore";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ groupSlug: string; requestId: string }> },
) {
  const { groupSlug, requestId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign-in required." }, { status: 401 });

  const access = await findGroupAccess(user.id, groupSlug);
  if (!access) return NextResponse.json({ error: "Group access required." }, { status: 403 });

  const prayerRequest = await groupRequestReference(access.group.id, requestId).get();
  if (!prayerRequest.exists || prayerRequest.data()?.status !== "approved") {
    return NextResponse.json({ error: "This request is not active." }, { status: 404 });
  }

  const mark = prayerMarkReference(access.group.id, user.id, requestId);
  const existing = await mark.get();
  if (existing.exists) {
    await mark.delete();
    return NextResponse.json({ marked: false });
  }

  await mark.set({
    userId: user.id,
    requestId,
    createdAt: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ marked: true });
}
